import { NextResponse } from 'next/server';
import { adminFetch } from '@/lib/shopify/admin';

// Envio de avaliação → grava no metafield custom.reviews (JSON) como PENDENTE (approved:false).
// O dono aprova depois no admin (approved:true) ou via script. Só as aprovadas aparecem na loja.
const MAX_STORED = 200;

// Serializa o read-modify-write por produto DENTRO desta instância. Num único processo (next start)
// elimina o lost-update entre envios concorrentes; em serverless multi-instância resta uma janela
// mínima que só um storage atômico fecharia — YAGNI nesta escala.
const writeChains = new Map<string, Promise<unknown>>();
function serialize<T>(key: string, task: () => Promise<T>): Promise<T> {
  const next = (writeChains.get(key) ?? Promise.resolve()).then(task, task);
  writeChains.set(
    key,
    next.catch(() => {}),
  );
  return next;
}

// Rate limit por IP: um envio é um ato humano raro, um bot faz centenas. Sem isso, um script
// enche as avaliações pendentes e gasta o limite de requisições da Admin API.
// ponytail: em memória — num deploy multi-instância cada instância tem o seu contador. Basta para
// travar spam de script; se um dia houver ataque de verdade, mover para Redis/KV.
const RATE_MAX = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1h
const submissionsByIp = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (submissionsByIp.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );
  // Limpeza grosseira: garante que o mapa não cresce sem fim.
  if (submissionsByIp.size > 5000) submissionsByIp.clear();
  recent.push(now);
  submissionsByIp.set(ip, recent);
  return recent.length > RATE_MAX;
}

export async function POST(request: Request) {
  let body: {
    productId?: string;
    author?: string;
    rating?: number;
    text?: string;
    website?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'corpo inválido' }, { status: 400 });
  }
  // Honeypot: o campo fica escondido no formulário, um humano nunca o preenche. Respondemos ok
  // para o bot não perceber que foi pego — e não gravamos nada.
  if (body.website) return NextResponse.json({ ok: true });

  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'demasiadas avaliações seguidas. Tenta daqui a bocado.' },
      { status: 429 },
    );
  }

  const productId = String(body.productId ?? '');
  const author = String(body.author ?? '')
    .trim()
    .slice(0, 60);
  const text = String(body.text ?? '')
    .trim()
    .slice(0, 1000);
  const rating = Math.round(Number(body.rating));

  if (!/^gid:\/\/shopify\/Product\/\d+$/.test(productId)) {
    return NextResponse.json({ error: 'produto inválido' }, { status: 400 });
  }
  if (!author || !text || !(rating >= 1 && rating <= 5)) {
    return NextResponse.json(
      { error: 'nome, comentário e classificação (1-5) são obrigatórios' },
      { status: 400 },
    );
  }

  try {
    const result = await serialize(productId, async () => {
      const data = await adminFetch<{ product: { metafield: { value: string } | null } | null }>(
        `query($id:ID!){ product(id:$id){ metafield(namespace:"custom",key:"reviews"){ value } } }`,
        { id: productId },
      );
      // Aceita os dois formatos já usados no metafield: array puro ou { items: [...] }.
      // JSON estragado → não grava nada (gravar por cima apagaria todas as avaliações).
      let reviews: unknown[] = [];
      const stored = data.product?.metafield?.value;
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        const items = (parsed as { items?: unknown })?.items;
        if (Array.isArray(parsed)) reviews = parsed;
        else if (Array.isArray(items)) reviews = items;
        else throw new Error('metafield custom.reviews com formato inesperado');
      }

      reviews.push({
        author,
        rating,
        text,
        date: new Date().toISOString(),
        verified: false,
        approved: false,
      });
      if (reviews.length > MAX_STORED) {
        // Corta as PENDENTES mais antigas primeiro — spam nunca empurra para fora as aprovadas.
        let excess = reviews.length - MAX_STORED;
        reviews = reviews.filter((review) => {
          if (excess > 0 && !(review as { approved?: boolean }).approved) {
            excess--;
            return false;
          }
          return true;
        });
        if (reviews.length > MAX_STORED) reviews = reviews.slice(reviews.length - MAX_STORED);
      }

      return adminFetch<{ metafieldsSet: { userErrors: { message: string }[] } }>(
        `mutation($metafields:[MetafieldsSetInput!]!){
          metafieldsSet(metafields:$metafields){ userErrors{ field message } } }`,
        {
          metafields: [
            {
              ownerId: productId,
              namespace: 'custom',
              key: 'reviews',
              type: 'json',
              value: JSON.stringify(reviews),
            },
          ],
        },
      );
    });
    const userErrors = result.metafieldsSet.userErrors;
    if (userErrors.length) {
      console.error('reviews: metafieldsSet', userErrors);
      return NextResponse.json({ error: 'Não foi possível guardar a avaliação.' }, { status: 422 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // O detalhe (Admin API, JSON estragado) fica no log do servidor, não vai para o browser.
    console.error('reviews:', error);
    return NextResponse.json({ error: 'Não foi possível guardar a avaliação.' }, { status: 500 });
  }
}
