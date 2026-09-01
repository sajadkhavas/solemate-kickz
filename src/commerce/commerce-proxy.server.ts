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
  if (splat === "cart" && normalized === "GET")
    return { path: "/api/v1/commerce/cart", method: "GET" };
  if (splat === "checkout" && normalized === "POST")
    return { path: "/api/v1/commerce/checkout", method: "POST" };
  if (splat === "orders" && normalized === "GET")
    return { path: "/api/v1/commerce/orders", method: "GET" };

  const item = /^cart\/items\/(\d+)$/.exec(splat);
  if (item && (normalized === "PUT" || normalized === "DELETE")) {
    return { path: `/api/v1/commerce/cart/items/${item[1]}`, method: normalized };
  }
  const order = /^orders\/([0-9a-f-]{36})$/.exec(splat);
  if (order && normalized === "GET")
    return { path: `/api/v1/commerce/orders/${order[1]}`, method: "GET" };
  return null;
}

function cookieValue(cookie: string | null, name: string): string | null {
  return (
    cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
}

export async function proxyCommerceRequest(request: Request, splat: string): Promise<Response> {
  const root = apiBaseUrl();
  const target = targetFor(request.method, splat);
  if (!root || !target)
    return Response.json(
      { error: target ? "commerce_unavailable" : "not_found" },
      { status: target ? 503 : 404 },
    );

  const incoming = new URL(request.url);
  const targetUrl = new URL(target.path, `${root}/`);
  targetUrl.search = incoming.search;
  const cookie = request.headers.get("cookie");
  const headers = new Headers({
    Accept: "application/json",
    Origin: incoming.origin,
    Referer: `${incoming.origin}/`,
  });
  if (cookie) headers.set("Cookie", cookie);
  const cart = cookieValue(cookie, "sole_cart");
  if (cart) headers.set("X-Sole-Cart", cart);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);

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
    const nextCart = backend.headers.get("X-Sole-Cart");
    if (nextCart) {
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      responseHeaders.append(
        "Set-Cookie",
        `sole_cart=${nextCart}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`,
      );
    }
    return new Response(backend.body, { status: backend.status, headers: responseHeaders });
  } catch {
    return Response.json({ error: "commerce_backend_unavailable" }, { status: 503 });
  }
}
