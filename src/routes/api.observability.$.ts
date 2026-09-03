import { createFileRoute } from "@tanstack/react-router";

async function handler({ request, params }: { request: Request; params: { _splat?: string } }) {
  const { proxyObservabilityRequest } = await import("@/observability/observability-proxy.server");
  return proxyObservabilityRequest(request, params._splat ?? "");
}

export const Route = createFileRoute("/api/observability/$")({
  server: { handlers: { GET: handler, POST: handler, PUT: handler } },
});
