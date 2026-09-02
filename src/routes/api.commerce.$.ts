import { createFileRoute } from "@tanstack/react-router";

async function handler({ request, params }: { request: Request; params: { _splat?: string } }) {
  const splat = params._splat ?? "";
  if (splat.startsWith("engagement/")) {
    const { proxyEngagementRequest } = await import("@/engagement/engagement-proxy.server");
    return proxyEngagementRequest(request, splat.slice("engagement/".length));
  }

  const { proxyCommerceRequest } = await import("@/commerce/commerce-proxy.server");
  return proxyCommerceRequest(request, splat);
}

export const Route = createFileRoute("/api/commerce/$")({
  server: { handlers: { GET: handler, POST: handler, PUT: handler, DELETE: handler } },
});
