import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { adminFetch } from '@/lib/shopify/admin';

// Webhook orders/create (registado por scripts/register-webhooks.mjs): os packs de escolha não têm
// stock próprio, por isso desconta aqui 1 × quantidade de cada item escolhido (propriedades da
// linha, ex. "Snapbar 1: Dama da Noite"). Assinado com o client secret da app (HMAC SHA-256).

// Mesma regra de slotKeys() em lib/packs.ts: rótulos repetidos ganham número ("Snapbar 1"…).
// ponytail: cópia local para a rota não depender do resto da funcionalidade de packs; manter igual.
function slotKeys(slots: { label: string }[]): string[] {
  return slots.map((slot, index) => {
    const same = slots.filter((other) => other.label === slot.label).length;
    const nth = slots.slice(0, index + 1).filter((other) => other.label === slot.label).length;
    return same > 1 ? `${slot.label} ${nth}` : slot.label;
  });
}

type OrderPayload = {
  admin_graphql_api_id: string;
  line_items: {
    product_id: number | null;
    quantity: number;
    properties: { name: string; value: string }[];
  }[];
};

function validHmac(body: string, header: string | null): boolean {
  const secret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!secret || !header) return false;
  const expected = createHmac('sha256', secret).update(body, 'utf8').digest();
  const received = Buffer.from(header, 'base64');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  if (!validHmac(body, request.headers.get('x-shopify-hmac-sha256'))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const order = JSON.parse(body) as OrderPayload;
  const packLines = order.line_items.filter((line) => line.product_id && line.properties?.length);
  if (!packLines.length) return NextResponse.json({ ok: true, adjusted: 0 });

  const data = await adminFetch<{
    locations: { nodes: { id: string }[] };
    products: { nodes: { title: string; variants: { nodes: { inventoryItem: { id: string; tracked: boolean } }[] } }[] };
    nodes: ({ id: string; packSlots: { value: string } | null } | null)[];
  }>(
    `query($ids:[ID!]!){ locations(first:1){ nodes{ id } }
      products(first:250){ nodes{ title variants(first:1){ nodes{ inventoryItem{ id tracked } } } } }
      nodes(ids:$ids){ ... on Product{ id packSlots: metafield(namespace:"custom", key:"pack_slots"){ value } } } }`,
    { ids: [...new Set(packLines.map((line) => `gid://shopify/Product/${line.product_id}`))] },
  );
  const itemByTitle = new Map(
    data.products.nodes.map((product) => [product.title, product.variants.nodes[0]?.inventoryItem]),
  );
  const slotsByProduct = new Map(
    data.nodes.flatMap((node) => {
      if (!node?.packSlots) return [];
      try {
        return [[node.id, JSON.parse(node.packSlots.value) as { label: string }[]] as const];
      } catch {
        return [];
      }
    }),
  );

  // Soma por item de inventário (o mesmo produto pode aparecer em vários slots/linhas).
  const deltas = new Map<string, number>();
  for (const line of packLines) {
    const slots = slotsByProduct.get(`gid://shopify/Product/${line.product_id}`);
    if (!slots?.length) continue; // linha com propriedades mas não é pack de escolha
    for (const key of slotKeys(slots)) {
      const title = line.properties.find((property) => property.name === key)?.value;
      const item = title ? itemByTitle.get(title) : undefined;
      if (!item?.tracked) {
        console.warn(`[orders/create] ${order.admin_graphql_api_id}: "${key}: ${title}" sem stock controlado`);
        continue;
      }
      deltas.set(item.id, (deltas.get(item.id) ?? 0) - line.quantity);
    }
  }
  if (!deltas.size) return NextResponse.json({ ok: true, adjusted: 0 });

  // @idempotent pela encomenda: as repetições do webhook (a Shopify reenvia até receber 200) não
  // descontam duas vezes.
  const result = await adminFetch<{ inventoryAdjustQuantities: { userErrors: { message: string }[] } }>(
    `mutation($input:InventoryAdjustQuantitiesInput!, $key:String!){
      inventoryAdjustQuantities(input:$input) @idempotent(key:$key){ userErrors{ field message } } }`,
    {
      key: `pack-stock-${order.admin_graphql_api_id}`,
      input: {
        name: 'available',
        reason: 'correction',
        referenceDocumentUri: order.admin_graphql_api_id,
        changes: [...deltas].map(([inventoryItemId, delta]) => ({
          inventoryItemId,
          locationId: data.locations.nodes[0].id,
          delta,
          changeFromQuantity: null,
        })),
      },
    },
  );
  const errors = result.inventoryAdjustQuantities.userErrors;
  if (errors.length) {
    // 500 → a Shopify volta a tentar; a chave idempotente protege o que já tiver passado.
    console.error(`[orders/create] ${order.admin_graphql_api_id}:`, errors);
    return NextResponse.json({ ok: false, errors }, { status: 500 });
  }
  return NextResponse.json({ ok: true, adjusted: deltas.size });
}
