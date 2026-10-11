import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

// Webhook da Shopify → revalida as páginas em cache (ISR sob demanda).
// Configurar um webhook (products/update, collections/update) apontando para:
//   POST /api/revalidate  (header x-revalidate-secret: SHOPIFY_REVALIDATE_SECRET)
export async function POST(request: NextRequest) {
  // Preferir o header (fica fora dos logs de URL); a query ?secret= continua aceita por
  // compatibilidade com webhooks já configurados.
  const secret =
    request.headers.get('x-revalidate-secret') ?? request.nextUrl.searchParams.get('secret');
  if (!process.env.SHOPIFY_REVALIDATE_SECRET || secret !== process.env.SHOPIFY_REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  revalidatePath('/');
  revalidatePath('/produtos');
  revalidatePath('/colecoes');
  revalidatePath('/produtos/[handle]', 'page');
  revalidatePath('/colecoes/[handle]', 'page');
  revalidatePath('/categorias/[handle]', 'page');
  revalidatePath('/sitemap.xml');
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
