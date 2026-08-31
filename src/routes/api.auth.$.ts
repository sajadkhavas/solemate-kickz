import { createFileRoute } from "@tanstack/react-router";

async function handler({ request, params }: { request: Request; params: { _splat?: string } }) {
  const splat = params._splat ?? "";
  const { proxyAuthRequest } = await import("@/auth/auth-proxy.server");
  return proxyAuthRequest(request, splat);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PUT: handler,
      DELETE: handler,
    },
  },
});
