import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  updateCartDiscountCodes,
  updateCartLines,
} from '@/lib/shopify';
import { getPackCodes, getVariantStock } from '@/lib/shopify/admin';
import { packLimits } from '@/lib/packs';
import type { Cart, CartLineInput } from '@/lib/shopify/types';

const CART_COOKIE = 'cartId';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

// Packs: com 1 de cada produto do pack no carrinho aplica o código do pack; sem eles, tira-o.
// Os códigos que o cliente digitou ficam como estão.
async function syncPackCodes(cart: Cart): Promise<Cart> {
  const packs = await getPackCodes();
  if (!packs.length) return cart;
  // Unidades por produto; cada pack ganho consome 1 de cada (produto em 2 packs só conta para
  // um). Os packs vêm do maior desconto para o menor, por isso o maior tem prioridade.
  const units = new Map<string, number>();
  for (const line of cart.lines) {
    const handle = line.merchandise.product.handle;
    units.set(handle, (units.get(handle) ?? 0) + line.quantity);
  }
  const earned: string[] = [];
  for (const pack of packs) {
    if (!pack.productHandles.every((handle) => (units.get(handle) ?? 0) > 0)) continue;
    pack.productHandles.forEach((handle) => units.set(handle, units.get(handle)! - 1));
    earned.push(pack.code);
  }
  const packCodes = new Set(packs.map((pack) => pack.code.toLowerCase()));
  const customerCodes = cart.discountCodes
    .map((discount) => discount.code)
    .filter((code) => !packCodes.has(code.toLowerCase()));
  const wanted = [...customerCodes, ...earned];
  const current = cart.discountCodes.map((discount) => discount.code);
  const same =
    wanted.length === current.length &&
    wanted.every((code) => current.some((other) => other.toLowerCase() === code.toLowerCase()));
  if (same) return cart;
  // Mantém os avisos da mutação anterior (ex.: quantidade ajustada ao estoque).
  return { ...(await updateCartDiscountCodes(cart.id, wanted)), warnings: cart.warnings };
}

// O código de um pack nunca vai para o browser (para ninguém o copiar): troca-o por um nome.
// ponytail: o checkout da Shopify continua a mostrar o código — aí não temos controlo.
async function hidePackCodes(cart: Cart): Promise<Cart> {
  const packs = await getPackCodes();
  const discountCodes = cart.discountCodes.map((discount) => {
    const pack = packs.find((candidate) => candidate.code.toLowerCase() === discount.code.toLowerCase());
    return pack ? { ...discount, code: '', label: `Desconto ${pack.title}` } : discount;
  });
  return { ...cart, discountCodes };
}

// Packs de escolha: as linhas em `indexes` têm de ter composição válida e caber no stock dos itens,
// contando o carrinho todo. Devolve o primeiro erro, ou null se está tudo bem.
async function checkPacks(lines: CartLineInput[], indexes: number[]): Promise<string | null> {
  const limits = await packLimits(lines);
  for (const index of indexes) {
    const { max, error } = limits[index];
    if (error) return error;
    if (max != null && lines[index].quantity > max) return 'Sem stock suficiente para os itens do pack';
  }
  return null;
}

const toLineInputs = (cart: Cart): CartLineInput[] =>
  cart.lines.map((line) => ({ merchandiseId: line.merchandise.id, quantity: line.quantity, attributes: line.attributes }));

// Anexa o estoque de cada linha para a UI não deixar subir a quantidade acima do disponível.
async function withStock(cart: Cart | null) {
  if (!cart) return NextResponse.json({ cart });
  cart = await syncPackCodes(cart).catch(() => cart!);
  cart = await hidePackCodes(cart);
  const [stock, limits] = await Promise.all([
    getVariantStock(cart.lines.map((line) => line.merchandise.id)),
    packLimits(toLineInputs(cart)).catch(() => []),
  ]);
  // Máximo da linha = stock da variante e, se tocar em itens de packs, o que sobra deles.
  const lines = cart.lines.map((line, index) => {
    const caps = [stock[line.merchandise.id], limits[index]?.max].filter((cap): cap is number => cap != null);
    return { ...line, merchandise: { ...line.merchandise, quantityAvailable: caps.length ? Math.min(...caps) : null } };
  });
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
    attributes?: CartLineInput['attributes'];
  }>(request);
  const { merchandiseId, quantity = 1, buyNow } = body ?? {};
  const toAttributes = (value: unknown) =>
    Array.isArray(value)
      ? value
          .filter((attribute) => typeof attribute?.key === 'string' && typeof attribute?.value === 'string')
          .map(({ key, value }) => ({ key: String(key), value: String(value) }))
      : [];
  // `lines` adiciona vários itens numa só chamada (seção "Leva junto").
  const lines = Array.isArray(body?.lines)
    ? body.lines
        .filter((line) => typeof line?.merchandiseId === 'string')
        .map((line) => ({
          merchandiseId: line.merchandiseId,
          quantity: Math.max(1, Number(line.quantity) || 1),
          attributes: toAttributes(line.attributes),
        }))
    : merchandiseId
      ? [{ merchandiseId, quantity: Math.max(1, Number(quantity) || 1), attributes: toAttributes(body?.attributes) }]
      : [];
  if (!lines.length) {
    return NextResponse.json({ error: 'merchandiseId obrigatorio' }, { status: 400 });
  }
  try {
    // O carrinho pode ter expirado (ex.: checkout concluído) → recria. "Comprar agora" ignora-o.
    let cartId = buyNow ? null : await readCartId();
    const current = cartId ? await getCart(cartId) : null;
    if (!current) cartId = null;

    // Sem conseguir validar, não deixa passar (a composição vai direta para a encomenda).
    const existing = current ? toLineInputs(current) : [];
    const packError = await checkPacks(
      [...existing, ...lines],
      [...lines.keys()].map((index) => existing.length + index),
    ).catch(() => 'Não foi possível validar o pack');
    if (packError) return NextResponse.json({ error: packError }, { status: 422 });

    // "Comprar agora": carrinho descartável só com este item — o carrinho do cliente fica intacto
    // (senão levaria para o checkout o que já estava lá, sem avisar).
    if (buyNow) {
      const cart = await createCart(lines);
      return withStock(cart);
    }

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
  }>(request);
  const cartId = await readCartId();
  if (!body) {
    return NextResponse.json({ error: 'corpo inválido' }, { status: 400 });
  }
  if (!cartId) {
    return NextResponse.json({ error: 'sem carrinho' }, { status: 400 });
  }
  try {
    if (Array.isArray(body.discountCodes)) {
      const cart = await updateCartDiscountCodes(cartId, body.discountCodes);
      return withStock(cart);
    }
    if (!body.lineId || body.quantity == null) {
      return NextResponse.json({ error: 'lineId e quantity obrigatorios' }, { status: 400 });
    }
    // Subir a quantidade revê o stock partilhado dos itens dos packs (descer passa sempre).
    const current = await getCart(cartId);
    const index = current?.lines.findIndex((line) => line.id === body.lineId) ?? -1;
    if (current && index >= 0 && body.quantity > current.lines[index].quantity) {
      const lines = toLineInputs(current);
      lines[index] = { ...lines[index], quantity: body.quantity };
      const packError = await checkPacks(lines, [index]).catch(() => 'Não foi possível validar o pack');
      if (packError) return NextResponse.json({ error: packError }, { status: 422 });
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
