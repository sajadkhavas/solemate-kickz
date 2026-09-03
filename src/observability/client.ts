import {
  ANALYTICS_POLICY_VERSION,
  ANALYTICS_TAXONOMY_VERSION,
  type AnalyticsConsent,
  type AnalyticsRoute,
  type ClientAnalyticsEvent,
} from "./contracts";

const SESSION_KEY = "sole.analytics.session.v1";
let csrfReady = false;

function sessionId(): string | null {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const id = sessionId();
  const response = await fetch(`/api/observability/${path}`, {
    ...init,
    credentials: "same-origin",
    keepalive: init?.method === "POST",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(id ? { "X-Sole-Analytics-Session": id } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok)
    throw Object.assign(new Error("Observability request rejected."), { status: response.status });
  return (await response.json()) as T;
}

async function csrf(): Promise<void> {
  if (csrfReady) return;
  const response = await fetch("/api/auth/csrf", { credentials: "same-origin" });
  if (!response.ok) throw new Error("CSRF bootstrap failed.");
  csrfReady = true;
}

export async function getAnalyticsConsent(): Promise<AnalyticsConsent> {
  return (await request<{ data: AnalyticsConsent }>("consent")).data;
}

export async function setAnalyticsConsent(granted: boolean): Promise<AnalyticsConsent> {
  await csrf();
  return (
    await request<{ data: AnalyticsConsent }>("consent", {
      method: "PUT",
      body: JSON.stringify({ granted, policy_version: ANALYTICS_POLICY_VERSION }),
    })
  ).data;
}

export async function sendAnalyticsEvent(
  event_name: ClientAnalyticsEvent,
  route_name: AnalyticsRoute,
  properties: Record<string, string | number>,
): Promise<void> {
  try {
    await csrf();
    await request("events", {
      method: "POST",
      body: JSON.stringify({
        taxonomy_version: ANALYTICS_TAXONOMY_VERSION,
        event_name,
        route_name,
        properties,
      }),
    });
  } catch {
    // First-party telemetry is deliberately non-blocking and fail-closed.
  }
}
