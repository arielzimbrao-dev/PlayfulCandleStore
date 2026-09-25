import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  updateCartDiscountCodes,
  updateCartLines,
  updateCartNote,
} from '@/lib/shopify';

const CART_COOKIE = 'cartId';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

async function readCartId(): Promise<string | null> {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

async function writeCartId(id: string): Promise<void> {
  (await cookies()).set(CART_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function GET() {
  try {
    const id = await readCartId();
    const cart = id ? await getCart(id) : null;
    return NextResponse.json({ cart });
  } catch {
    // Shopify indisponível: o site continua a navegar com o carrinho vazio em vez de rebentar.
    return NextResponse.json({ cart: null }, { status: 200 });
  }
}

// Converte um throw das mutações Shopify (userErrors/cart nulo) numa resposta 422 com a mensagem real,
// em vez de deixar rebentar num 500 opaco.
// Corpo inválido (bot, fetch truncado) não deve dar 500.
async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

function fail(e: unknown) {
  const msg = e instanceof Error ? e.message.replace(/^Shopify(\sGraphQL)?:\s*/, '') : 'Erro no carrinho';
  return NextResponse.json({ error: msg }, { status: 422 });
}

export async function POST(req: Request) {
  const body = await readJson<{ merchandiseId?: string; quantity?: number; buyNow?: boolean }>(req);
  const { merchandiseId, quantity = 1, buyNow } = body ?? {};
  if (!merchandiseId) {
    return NextResponse.json({ error: 'merchandiseId obrigatorio' }, { status: 400 });
  }

  try {
    // "Comprar agora": carrinho descartável só com este artigo — o carrinho do cliente fica intacto
    // (senão levava para o checkout o que já lá tinha, sem o dizer).
    if (buyNow) {
      const cart = await createCart([{ merchandiseId, quantity }]);
      return NextResponse.json({ cart });
    }

    // Carrinho pode ter expirado (ex.: checkout concluido) -> recria.
    let id = await readCartId();
    if (id && !(await getCart(id))) id = null;

    const cart = id
      ? await addCartLines(id, [{ merchandiseId, quantity }])
      : await createCart([{ merchandiseId, quantity }]);

    if (!id) await writeCartId(cart.id);
    return NextResponse.json({ cart });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  const body = await readJson<{ lineId?: string; quantity?: number; discountCodes?: string[]; note?: string }>(req);
  const id = await readCartId();
  if (!body) {
    return NextResponse.json({ error: 'corpo inválido' }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: 'sem carrinho' }, { status: 400 });
  }
  try {
    if (typeof body.note === 'string') {
      const cart = await updateCartNote(id, body.note.slice(0, 500));
      return NextResponse.json({ cart });
    }
    if (Array.isArray(body.discountCodes)) {
      const cart = await updateCartDiscountCodes(id, body.discountCodes);
      return NextResponse.json({ cart });
    }
    if (!body.lineId || body.quantity == null) {
      return NextResponse.json({ error: 'lineId e quantity obrigatorios' }, { status: 400 });
    }
    const cart = await updateCartLines(id, [{ id: body.lineId, quantity: body.quantity }]);
    return NextResponse.json({ cart });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request) {
  const { lineId } = (await readJson<{ lineId?: string }>(req)) ?? {};
  const id = await readCartId();
  if (!id || !lineId) {
    return NextResponse.json({ error: 'cartId e lineId obrigatorios' }, { status: 400 });
  }
  try {
    const cart = await removeCartLines(id, [lineId]);
    return NextResponse.json({ cart });
  } catch (e) {
    return fail(e);
  }
}
