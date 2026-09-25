import { NextResponse, type NextRequest } from 'next/server';
import { predictiveSearch, searchProducts } from '@/lib/shopify';

// Live search for the header dropdown.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  try {
    // predictiveSearch tolera gralhas; se não devolver nada, tenta a pesquisa normal.
    let products: unknown[] = await predictiveSearch(q, 6);
    if (products.length === 0) products = await searchProducts(q, 6);
    return NextResponse.json({ products });
  } catch {
    // Falha do Shopify não deve rebentar o dropdown do header — devolve lista vazia.
    return NextResponse.json({ products: [] });
  }
}
