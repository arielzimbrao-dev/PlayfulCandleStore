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
import { getPackCodes, getVariantStock } from '@/lib/shopify/admin';
import type { Cart, CartLineInput } from '@/lib/shopify/types';

const CART_COOKIE = 'cartId';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

// Packs: com 1 de cada produto do pack no carrinho aplica o código do pack; sem eles, tira-o.
// Os códigos que o cliente digitou ficam como estão.
async function syncPackCodes(cart: Cart): Promise<Cart> {
  const packs = await getPackCodes();
  if (!packs.length) return cart;
  const handles = new Set(cart.lines.map((line) => line.merchandise.product.handle));
  const packCodes = new Set(packs.map((pack) => pack.code.toLowerCase()));
  const customerCodes = cart.discountCodes
    .map((discount) => discount.code)
    .filter((code) => !packCodes.has(code.toLowerCase()));
  const earned = packs
    .filter((pack) => pack.productHandles.every((handle) => handles.has(handle)))
    .map((pack) => pack.code);
  const wanted = [...customerCodes, ...earned];
  const current = cart.discountCodes.map((discount) => discount.code);
  const same =
    wanted.length === current.length &&
    wanted.every((code) => current.some((other) => other.toLowerCase() === code.toLowerCase()));
  if (same) return cart;
  // Mantém os avisos da mutação anterior (ex.: quantidade ajustada ao estoque).
  return { ...(await updateCartDiscountCodes(cart.id, wanted)), warnings: cart.warnings };
}

// Anexa o estoque de cada linha para a UI não deixar subir a quantidade acima do disponível.
async function withStock(cart: Cart | null) {
  if (!cart) return NextResponse.json({ cart });
  cart = await syncPackCodes(cart).catch(() => cart!);
  const stock = await getVariantStock(cart.lines.map((line) => line.merchandise.id));
  const lines = cart.lines.map((line) => ({
    ...line,
    merchandise: { ...line.merchandise, quantityAvailable: stock[line.merchandise.id] },
  }));
  return NextResponse.json({ cart: { ...cart, lines } });
}

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
    const cartId = await readCartId();
    const cart = cartId ? await getCart(cartId) : null;
    return withStock(cart);
  } catch {
    // Shopify fora do ar: o site continua navegável com o carrinho vazio em vez de quebrar.
    return NextResponse.json({ cart: null }, { status: 200 });
  }
}

// Corpo inválido (bot, fetch truncado) não deve dar 500.
async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

// Converte um throw das mutações Shopify (userErrors/cart nulo) em uma resposta 422 com a mensagem
// real, em vez de deixar estourar um 500 opaco.
function fail(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.replace(/^Shopify(\sGraphQL)?:\s*/, '')
      : 'Erro no carrinho';
  return NextResponse.json({ error: message }, { status: 422 });
}

export async function POST(request: Request) {
  const body = await readJson<{
    merchandiseId?: string;
    quantity?: number;
    buyNow?: boolean;
    lines?: CartLineInput[];
  }>(request);
  const { merchandiseId, quantity = 1, buyNow } = body ?? {};
  // `lines` adiciona vários itens numa só chamada (seção "Leva junto").
  const lines = Array.isArray(body?.lines)
    ? body.lines
        .filter((line) => typeof line?.merchandiseId === 'string')
        .map((line) => ({
          merchandiseId: line.merchandiseId,
          quantity: Math.max(1, Number(line.quantity) || 1),
        }))
    : merchandiseId
      ? [{ merchandiseId, quantity }]
      : [];
  if (!lines.length) {
    return NextResponse.json({ error: 'merchandiseId obrigatorio' }, { status: 400 });
  }

  try {
    // "Comprar agora": carrinho descartável só com este item — o carrinho do cliente fica intacto
    // (senão levaria para o checkout o que já estava lá, sem avisar).
    if (buyNow) {
      const cart = await createCart(lines);
      return withStock(cart);
    }

    // O carrinho pode ter expirado (ex.: checkout concluído) → recria.
    let cartId = await readCartId();
    if (cartId && !(await getCart(cartId))) cartId = null;

    const cart = cartId ? await addCartLines(cartId, lines) : await createCart(lines);

    if (!cartId) await writeCartId(cart.id);
    return withStock(cart);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  const body = await readJson<{
    lineId?: string;
    quantity?: number;
    discountCodes?: string[];
    note?: string;
  }>(request);
  const cartId = await readCartId();
  if (!body) {
    return NextResponse.json({ error: 'corpo inválido' }, { status: 400 });
  }
  if (!cartId) {
    return NextResponse.json({ error: 'sem carrinho' }, { status: 400 });
  }
  try {
    if (typeof body.note === 'string') {
      const cart = await updateCartNote(cartId, body.note.slice(0, 500));
      return withStock(cart);
    }
    if (Array.isArray(body.discountCodes)) {
      const cart = await updateCartDiscountCodes(cartId, body.discountCodes);
      return withStock(cart);
    }
    if (!body.lineId || body.quantity == null) {
      return NextResponse.json({ error: 'lineId e quantity obrigatorios' }, { status: 400 });
    }
    const cart = await updateCartLines(cartId, [{ id: body.lineId, quantity: body.quantity }]);
    return withStock(cart);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  const { lineId } = (await readJson<{ lineId?: string }>(request)) ?? {};
  const cartId = await readCartId();
  if (!cartId || !lineId) {
    return NextResponse.json({ error: 'cartId e lineId obrigatorios' }, { status: 400 });
  }
  try {
    const cart = await removeCartLines(cartId, [lineId]);
    return withStock(cart);
  } catch (error) {
    return fail(error);
  }
}
