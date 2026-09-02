import { createFileRoute } from "@tanstack/react-router";

async function handler({ request, params }: { request: Request; params: { _splat?: string } }) {
  const { proxyEngagementRequest } = await import("@/engagement/engagement-proxy.server");
  return proxyEngagementRequest(request, params._splat ?? "");
}

export const Route = createFileRoute("/api/engagement/$")({
  server: { handlers: { GET: handler, POST: handler, PUT: handler, DELETE: handler } },
});
