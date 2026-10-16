import { NextResponse } from 'next/server';
import { adminFetch } from '@/lib/shopify/admin';

// Envio de avaliação → cria um metaobject "avaliacao" em RASCUNHO (Admin → Conteúdo → Metaobjects
// → Avaliações). O dono muda para Ativo para publicar; o Storefront só devolve as ativas.

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
    const result = await adminFetch<{ metaobjectCreate: { userErrors: { message: string }[] } }>(
      `mutation($m:MetaobjectCreateInput!){ metaobjectCreate(metaobject:$m){ userErrors{ field message } } }`,
      {
        m: {
          type: 'avaliacao',
          capabilities: { publishable: { status: 'DRAFT' } },
          fields: [
            { key: 'produto', value: productId },
            { key: 'nome', value: author },
            {
              key: 'classificacao',
              value: JSON.stringify({ value: String(rating), scale_min: '1', scale_max: '5' }),
            },
            { key: 'comentario', value: text },
            { key: 'data', value: new Date().toISOString() },
            { key: 'compra_verificada', value: 'false' },
          ],
        },
      },
    );
    const userErrors = result.metaobjectCreate.userErrors;
    if (userErrors.length) {
      console.error('reviews: metaobjectCreate', userErrors);
      return NextResponse.json({ error: 'Não foi possível guardar a avaliação.' }, { status: 422 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // O detalhe (Admin API) fica no log do servidor, não vai para o browser.
    console.error('reviews:', error);
    return NextResponse.json({ error: 'Não foi possível guardar a avaliação.' }, { status: 500 });
  }
}
