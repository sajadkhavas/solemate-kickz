type Target = { path: string; method: "GET" | "POST" | "PUT" | "DELETE" };

function apiBaseUrl(): string | null {
  const raw = process.env.SOLE_API_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return null;
    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function targetFor(method: string, splat: string): Target | null {
  const normalized = method.toUpperCase();
  if (splat === "wishlist" && normalized === "GET")
    return { path: "/api/v1/customer/wishlist", method: "GET" };
  if (splat === "wishlist/migrate" && normalized === "POST")
    return { path: "/api/v1/customer/wishlist/migrate", method: "POST" };
  if (splat === "notification-preferences" && normalized === "GET")
    return { path: "/api/v1/customer/notification-preferences", method: "GET" };
  if (splat === "notification-signals" && normalized === "GET")
    return { path: "/api/v1/customer/notification-signals", method: "GET" };
  if (splat === "loyalty" && normalized === "GET")
    return { path: "/api/v1/customer/loyalty", method: "GET" };

  const wishlist = /^wishlist\/(\d+)$/.exec(splat);
  if (wishlist && (normalized === "PUT" || normalized === "DELETE")) {
    return { path: `/api/v1/customer/wishlist/${wishlist[1]}`, method: normalized };
  }

  const preference = /^notification-preferences\/(email|sms|push)$/.exec(splat);
  if (preference && (normalized === "PUT" || normalized === "DELETE")) {
    return {
      path: `/api/v1/customer/notification-preferences/${preference[1]}`,
      method: normalized,
    };
  }

  return null;
}

export async function proxyEngagementRequest(request: Request, splat: string): Promise<Response> {
  const root = apiBaseUrl();
  const target = targetFor(request.method, splat);
  if (!root || !target) {
    return Response.json(
      { error: target ? "engagement_unavailable" : "not_found" },
      { status: target ? 503 : 404 },
    );
  }

  const incoming = new URL(request.url);
  const targetUrl = new URL(target.path, `${root}/`);
  const cookie = request.headers.get("cookie");
  const headers = new Headers({
    Accept: "application/json",
    Origin: incoming.origin,
    Referer: `${incoming.origin}/`,
  });
  if (cookie) headers.set("Cookie", cookie);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  try {
    const backend = await fetch(targetUrl, {
      method: target.method,
      headers,
      body:
        target.method === "GET" || target.method === "DELETE"
          ? undefined
          : await request.arrayBuffer(),
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    const responseHeaders = new Headers({ "Cache-Control": "private, no-store" });
    const backendType = backend.headers.get("content-type");
    if (backendType) responseHeaders.set("Content-Type", backendType);
    return new Response(backend.body, { status: backend.status, headers: responseHeaders });
  } catch {
    return Response.json({ error: "engagement_backend_unavailable" }, { status: 503 });
  }
}
