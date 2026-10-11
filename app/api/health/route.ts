// Healthcheck do container (Docker/Coolify). Não chama a Shopify: só confirma que o servidor
// responde.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ ok: true });
}
