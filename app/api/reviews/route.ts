import { NextResponse } from 'next/server';
import { adminFetch } from '@/lib/shopify/admin';

// Submissão de review → grava no metafield custom.reviews (JSON) como PENDENTE (approved:false).
// O dono aprova depois no admin (pôr approved:true) ou via script. Só aprovadas aparecem na loja.
const MAX_STORED = 200;

// Serializa o read-modify-write por produto DENTRO desta instância. Num único processo (next start)
// elimina o lost-update entre submissões concorrentes; em serverless multi-instância resta uma janela
// mínima que só storage atómico fecharia — YAGNI nesta escala.
const writeChains = new Map<string, Promise<unknown>>();
function serialize<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const next = (writeChains.get(key) ?? Promise.resolve()).then(fn, fn);
  writeChains.set(key, next.catch(() => {}));
  return next;
}

// Rate limit por IP: uma submissão é um ato humano raro, um bot faz centenas. Sem isto, um script
// enche as reviews pendentes e gasta o limite de pedidos da Admin API.
// ponytail: em memória — num deploy multi-instância cada instância tem o seu contador. Chega para
// travar spam de script; se um dia houver ataque a sério, mover para Redis/KV.
const RATE_MAX = 5;
const RATE_WINDOW = 60 * 60 * 1000; // 1h
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW);
  if (hits.size > 5000) hits.clear(); // limpeza grosseira: o mapa não cresce sem fim
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_MAX;
}

export async function POST(req: Request) {
  let body: { productId?: string; author?: string; rating?: number; text?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'corpo inválido' }, { status: 400 });
  }
  // Honeypot: o campo está escondido no formulário, um humano nunca o preenche. Respondemos ok
  // para o bot não perceber que foi apanhado — e não gravamos nada.
  if (body.website) return NextResponse.json({ ok: true });

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'demasiadas avaliações seguidas. Tenta daqui a bocado.' }, { status: 429 });
  }

  const productId = String(body.productId ?? '');
  const author = String(body.author ?? '').trim().slice(0, 60);
  const text = String(body.text ?? '').trim().slice(0, 1000);
  const rating = Math.round(Number(body.rating));

  if (!/^gid:\/\/shopify\/Product\/\d+$/.test(productId)) {
    return NextResponse.json({ error: 'produto inválido' }, { status: 400 });
  }
  if (!author || !text || !(rating >= 1 && rating <= 5)) {
    return NextResponse.json({ error: 'nome, comentário e classificação (1-5) são obrigatórios' }, { status: 400 });
  }

  try {
    const res = await serialize(productId, async () => {
      // lê as reviews atuais
      const data = await adminFetch<{ product: { metafield: { value: string } | null } | null }>(
        `query($id:ID!){ product(id:$id){ metafield(namespace:"custom",key:"reviews"){ value } } }`,
        { id: productId },
      );
      let list: unknown[] = [];
      try {
        const raw = data.product?.metafield?.value;
        if (raw) {
          const v = JSON.parse(raw);
          list = Array.isArray(v) ? v : Array.isArray((v as { items?: unknown[] })?.items) ? (v as { items: unknown[] }).items : [];
        }
      } catch {
        list = [];
      }

      list.push({ author, rating, text, date: new Date().toISOString(), verified: false, approved: false });
      if (list.length > MAX_STORED) {
        // corta as PENDENTES mais antigas primeiro — spam nunca despeja reviews aprovadas.
        let over = list.length - MAX_STORED;
        list = list.filter((r) => {
          if (over > 0 && !(r as { approved?: boolean }).approved) {
            over--;
            return false;
          }
          return true;
        });
        if (list.length > MAX_STORED) list = list.slice(list.length - MAX_STORED);
      }

      return adminFetch<{ metafieldsSet: { userErrors: { message: string }[] } }>(
        `mutation($m:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$m){ userErrors{ field message } } }`,
        { m: [{ ownerId: productId, namespace: 'custom', key: 'reviews', type: 'json', value: JSON.stringify(list) }] },
      );
    });
    const errs = res.metafieldsSet.userErrors;
    if (errs.length) return NextResponse.json({ error: errs[0].message }, { status: 422 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
