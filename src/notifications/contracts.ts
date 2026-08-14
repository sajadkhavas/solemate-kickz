export type NotificationCategory = "order" | "promotion" | "price_drop" | "system";

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  deepLink: string | null;
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  priceDrops: boolean;
  promotions: boolean;
  system: boolean;
  email: boolean;
  sms: boolean;
  marketing: boolean;
}

export interface NotificationSnapshot {
  items: NotificationItem[];
  unreadCount: number;
  preferences: NotificationPreferences;
}

export type PreferenceKey = keyof NotificationPreferences;

export class NotificationApiError extends Error {
  constructor(
    public readonly code: "UNAVAILABLE" | "UNAUTHORIZED" | "CSRF_MISSING" | "INVALID_RESPONSE",
    message: string,
  ) {
    super(message);
    this.name = "NotificationApiError";
  }
}
