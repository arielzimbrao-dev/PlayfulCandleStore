import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

// Shopify webhook → revalida as páginas em cache (ISR on-demand).
// Configurar um webhook (products/update, collections/update) a apontar para:
//   POST /api/revalidate?secret=SHOPIFY_REVALIDATE_SECRET
export async function POST(req: NextRequest) {
  // Preferir o header (fica fora dos logs de URL); manter a query como fallback compatível.
  const secret = req.headers.get('x-revalidate-secret') ?? req.nextUrl.searchParams.get('secret');
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
