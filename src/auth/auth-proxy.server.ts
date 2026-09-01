type ProxyTarget = {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
};

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

function mapTarget(method: string, splat: string): ProxyTarget | null {
  const normalizedMethod = method.toUpperCase();

  const exact: Record<string, Partial<Record<string, string>>> = {
    csrf: { GET: "/sanctum/csrf-cookie" },
    "google/start": { GET: "/auth/google/redirect" },
    "google/callback": { GET: "/auth/google/callback" },
    session: { GET: "/api/v1/auth/me" },
    logout: { POST: "/api/v1/auth/logout" },
    customer: { GET: "/api/v1/customer", PUT: "/api/v1/customer" },
    "customer/addresses": {
      GET: "/api/v1/customer/addresses",
      POST: "/api/v1/customer/addresses",
    },
    "customer/consents": {
      GET: "/api/v1/customer/consents",
      POST: "/api/v1/customer/consents",
    },
    "customer/export": { GET: "/api/v1/customer/export" },
    "customer/deletion": {
      POST: "/api/v1/customer/deletion",
      DELETE: "/api/v1/customer/deletion",
    },
  };

  const exactPath = exact[splat]?.[normalizedMethod];
  if (exactPath) return { path: exactPath, method: normalizedMethod as ProxyTarget["method"] };

  const addressMatch = /^customer\/addresses\/(\d+)$/.exec(splat);
  if (addressMatch && (normalizedMethod === "PUT" || normalizedMethod === "DELETE")) {
    return {
      path: `/api/v1/customer/addresses/${addressMatch[1]}`,
      method: normalizedMethod,
    };
  }

  return null;
}

function xsrfFromCookie(cookie: string | null): string | null {
  if (!cookie) return null;
  const token = cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("XSRF-TOKEN="))
    ?.slice("XSRF-TOKEN=".length);

  if (!token) return null;

  try {
    return decodeURIComponent(token);
  } catch {
    return null;
  }
}

function setCookies(headers: Headers): string[] {
  const enhanced = headers as Headers & { getSetCookie?: () => string[] };
  const cookies = enhanced.getSetCookie?.();
  if (cookies?.length) return cookies;

  const fallback = headers.get("set-cookie");
  return fallback ? [fallback] : [];
}

export async function proxyAuthRequest(request: Request, splat: string): Promise<Response> {
  const root = apiBaseUrl();
  const target = mapTarget(request.method, splat);
  if (!root || !target) {
    return Response.json({ error: "auth_route_unavailable" }, { status: target ? 503 : 404 });
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(target.path, `${root}/`);

  if (splat === "google/start") {
    const returnTo = incomingUrl.searchParams.get("return_to");
    if (returnTo) targetUrl.searchParams.set("return_to", returnTo);
  } else if (splat === "google/callback") {
    for (const [key, value] of incomingUrl.searchParams) targetUrl.searchParams.append(key, value);
  }

  const headers = new Headers({
    Accept: request.headers.get("accept") ?? "application/json",
    Origin: incomingUrl.origin,
    Referer: `${incomingUrl.origin}/`,
  });
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("Cookie", cookie);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  if (target.method !== "GET") {
    const xsrf = xsrfFromCookie(cookie);
    if (xsrf) headers.set("X-XSRF-TOKEN", xsrf);
  }

  let body: BodyInit | undefined;
  if (target.method !== "GET" && target.method !== "DELETE") {
    body = await request.arrayBuffer();
  }

  let backend: Response;
  try {
    backend = await fetch(targetUrl, {
      method: target.method,
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return Response.json({ error: "auth_backend_unavailable" }, { status: 503 });
  }

  const responseHeaders = new Headers({
    "Cache-Control": "private, no-store",
  });
  for (const name of ["content-type", "content-disposition", "location"]) {
    const value = backend.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  for (const value of setCookies(backend.headers)) responseHeaders.append("Set-Cookie", value);

  return new Response(backend.body, {
    status: backend.status,
    statusText: backend.statusText,
    headers: responseHeaders,
  });
}
