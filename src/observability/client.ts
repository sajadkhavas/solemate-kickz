import {
  ANALYTICS_POLICY_VERSION,
  ANALYTICS_TAXONOMY_VERSION,
  type AnalyticsConsent,
  type AnalyticsRoute,
  type ClientAnalyticsEvent,
} from "./contracts";

const SESSION_KEY = "sole.analytics.session.v1";
const CONSENT_KEY = "sole.analytics.consent.v1";
let csrfReady = false;

export function hasLocalAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

function rememberAnalyticsConsent(granted: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
  } catch {
    // Storage can be unavailable; telemetry remains disabled in that case.
  }
}

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
  const consent = (await request<{ data: AnalyticsConsent }>("consent")).data;
  rememberAnalyticsConsent(consent.granted);
  return consent;
}

export async function setAnalyticsConsent(granted: boolean): Promise<AnalyticsConsent> {
  await csrf();
  const consent = (
    await request<{ data: AnalyticsConsent }>("consent", {
      method: "PUT",
      body: JSON.stringify({ granted, policy_version: ANALYTICS_POLICY_VERSION }),
    })
  ).data;
  rememberAnalyticsConsent(consent.granted);
  return consent;
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
