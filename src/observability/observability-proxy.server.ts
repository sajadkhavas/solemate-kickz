type Target = { path: string; method: "GET" | "POST" | "PUT" };

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
  const key = `${method.toUpperCase()} ${splat}`;
  const targets: Record<string, Target> = {
    "GET consent": { path: "/api/v1/observability/consent", method: "GET" },
    "PUT consent": { path: "/api/v1/observability/consent", method: "PUT" },
    "POST events": { path: "/api/v1/observability/events", method: "POST" },
    "GET experiments": { path: "/api/v1/observability/experiments", method: "GET" },
    "POST experiments/exposure": {
      path: "/api/v1/observability/experiments/exposure",
      method: "POST",
    },
  };
  return targets[key] ?? null;
}

function xsrfFromCookie(cookie: string | null): string | null {
  const encoded = cookie
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("XSRF-TOKEN="))
    ?.slice("XSRF-TOKEN=".length);
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

export async function proxyObservabilityRequest(
  request: Request,
  splat: string,
): Promise<Response> {
  const root = apiBaseUrl();
  const target = targetFor(request.method, splat);
  if (!root || !target) {
    return Response.json(
      { error: target ? "observability_unavailable" : "not_found" },
      { status: target ? 503 : 404 },
    );
  }

  const incoming = new URL(request.url);
  const cookie = request.headers.get("cookie");
  const headers = new Headers({
    Accept: "application/json",
    Origin: incoming.origin,
    Referer: `${incoming.origin}/`,
  });
  if (cookie) headers.set("Cookie", cookie);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const analyticsSession = request.headers.get("x-sole-analytics-session");
  if (analyticsSession) headers.set("X-Sole-Analytics-Session", analyticsSession);
  if (target.method !== "GET") {
    const xsrf = xsrfFromCookie(cookie);
    if (xsrf) headers.set("X-XSRF-TOKEN", xsrf);
  }

  try {
    const backend = await fetch(new URL(target.path, `${root}/`), {
      method: target.method,
      headers,
      body: target.method === "GET" ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      signal: AbortSignal.timeout(5_000),
    });
    const responseHeaders = new Headers({
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    const backendType = backend.headers.get("content-type");
    if (backendType) responseHeaders.set("Content-Type", backendType);
    return new Response(backend.body, { status: backend.status, headers: responseHeaders });
  } catch {
    return Response.json({ error: "observability_backend_unavailable" }, { status: 503 });
  }
}
