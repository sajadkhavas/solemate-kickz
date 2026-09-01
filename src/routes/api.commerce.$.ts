import { createFileRoute } from "@tanstack/react-router";

async function handler({ request, params }: { request: Request; params: { _splat?: string } }) {
  const { proxyCommerceRequest } = await import("@/commerce/commerce-proxy.server");
  return proxyCommerceRequest(request, params._splat ?? "");
}

export const Route = createFileRoute("/api/commerce/$")({
  server: { handlers: { GET: handler, POST: handler, PUT: handler, DELETE: handler } },
});
