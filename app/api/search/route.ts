import { NextResponse, type NextRequest } from 'next/server';
import { predictiveSearch, searchProducts } from '@/lib/shopify';

// Busca ao vivo do dropdown do header.
export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get('q') ?? '';
  try {
    // predictiveSearch tolera erros de digitação; se não retornar nada, tenta a busca normal.
    let products: unknown[] = await predictiveSearch(term, 6);
    if (products.length === 0) products = await searchProducts(term, 6);
    return NextResponse.json({ products });
  } catch {
    // Falha da Shopify não deve quebrar o dropdown do header — retorna lista vazia.
    return NextResponse.json({ products: [] });
  }
}
