import {
  NotificationApiError,
  type NotificationPreferences,
  type NotificationSnapshot,
  type PreferenceKey,
} from "./contracts";

const API_BASE = "/api/v1/notifications";

function csrfToken() {
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content.trim() || null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "same-origin",
    headers: { Accept: "application/json", ...init?.headers },
  }).catch(() => {
    throw new NotificationApiError("UNAVAILABLE", "سرویس اعلان در دسترس نیست.");
  });

  if (response.status === 401) {
    throw new NotificationApiError("UNAUTHORIZED", "برای مشاهده اعلان‌ها وارد حساب شوید.");
  }
  if (!response.ok) {
    throw new NotificationApiError("UNAVAILABLE", "سرویس اعلان هنوز به Backend متصل نشده است.");
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new NotificationApiError("INVALID_RESPONSE", "پاسخ سرویس اعلان معتبر نیست.");
  }
}

function mutationHeaders() {
  const token = csrfToken();
  if (!token) {
    throw new NotificationApiError(
      "CSRF_MISSING",
      "توکن امنیتی Backend برای این عملیات آماده نیست.",
    );
  }
  return { "Content-Type": "application/json", "X-CSRF-Token": token };
}

export const notificationApi = {
  snapshot: () => request<NotificationSnapshot>(""),
  markRead: (id: string) =>
    request<{ unreadCount: number }>(`/${encodeURIComponent(id)}/read`, {
      method: "POST",
      headers: mutationHeaders(),
    }),
  updatePreference: (key: PreferenceKey, value: boolean) =>
    request<{ preferences: NotificationPreferences }>("/preferences", {
      method: "PATCH",
      headers: mutationHeaders(),
      body: JSON.stringify({ key, value }),
    }),
  subscribe: (subscription: PushSubscriptionJSON) =>
    request<{ active: true }>("/push-subscriptions", {
      method: "POST",
      headers: mutationHeaders(),
      body: JSON.stringify({
        subscription,
        locale: "fa-IR",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    }),
  unsubscribe: (endpoint: string) =>
    request<{ active: false }>("/push-subscriptions", {
      method: "DELETE",
      headers: mutationHeaders(),
      body: JSON.stringify({ endpoint }),
    }),
};

export function readVapidPublicKey() {
  return (
    document.querySelector<HTMLMetaElement>('meta[name="sole-vapid-public-key"]')?.content.trim() ||
    null
  );
}

export function decodeVapidKey(value: string) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}
