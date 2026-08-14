import { Bell, BellOff, LoaderCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { decodeVapidKey, notificationApi, readVapidPublicKey } from "@/notifications/client";
import type { NotificationSnapshot, PreferenceKey } from "@/notifications/contracts";

const labels: Record<PreferenceKey, string> = {
  orderUpdates: "تغییرات سفارش",
  priceDrops: "کاهش قیمت علاقه‌مندی‌ها",
  promotions: "کمپین‌ها و تخفیف‌ها",
  system: "پیام‌های سیستمی",
  email: "دریافت از طریق ایمیل",
  sms: "دریافت از طریق پیامک",
  marketing: "رضایت بازاریابی",
};

type PermissionState = NotificationPermission | "unsupported";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<NotificationSnapshot | null>(null);
  const [permission, setPermission] = useState<PermissionState>("unsupported");
  const [showPermissionStep, setShowPermissionStep] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await notificationApi.snapshot());
    } catch (cause) {
      setSnapshot(null);
      setError(cause instanceof Error ? cause.message : "دریافت اعلان‌ها انجام نشد.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void load();
  }, [open]);

  const requestPush = async () => {
    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    )
      return;
    setPushBusy(true);
    setError(null);
    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") return;
      const vapid = readVapidPublicKey();
      if (!vapid) throw new Error("کلید عمومی Push هنوز توسط Backend تنظیم نشده است.");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(vapid),
      });
      try {
        await notificationApi.subscribe(subscription.toJSON());
      } catch (cause) {
        await subscription.unsubscribe().catch(() => false);
        throw cause;
      }
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "فعال‌سازی Push انجام نشد.");
    } finally {
      setPushBusy(false);
      setShowPermissionStep(false);
    }
  };

  const updatePreference = async (key: PreferenceKey, value: boolean) => {
    setError(null);
    try {
      const result = await notificationApi.updatePreference(key, value);
      setSnapshot((current) =>
        current ? { ...current, preferences: result.preferences } : current,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تنظیم اعلان ذخیره نشد.");
    }
  };

  const markRead = async (id: string) => {
    setError(null);
    try {
      await notificationApi.markRead(id);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "اعلان خوانده نشد.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="مرکز اعلان‌ها"
          data-testid="notification-center-trigger"
        >
          <Bell aria-hidden="true" className="size-5" />
          {snapshot && snapshot.unreadCount > 0 ? (
            <span
              aria-label={`${snapshot.unreadCount} اعلان خوانده‌نشده`}
              className="absolute -end-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-mono-num text-[10px] font-bold text-primary-foreground"
            >
              {snapshot.unreadCount}
            </span>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,48rem)] overflow-y-auto sm:max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>مرکز اعلان‌ها</DialogTitle>
          <DialogDescription>
            Permission مرورگر و رضایت ثبت‌شده در حساب دو موضوع مستقل هستند.
          </DialogDescription>
        </DialogHeader>

        <section className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-fa text-sm font-bold">اعلان روی این دستگاه</h3>
              <p className="mt-1 text-xs text-muted-foreground">وضعیت مرورگر: {permission}</p>
            </div>
            <BellOff aria-hidden="true" className="size-5 text-muted-foreground" />
          </div>
          {permission === "default" && !showPermissionStep ? (
            <Button className="mt-3" size="sm" onClick={() => setShowPermissionStep(true)}>
              توضیح و فعال‌سازی
            </Button>
          ) : null}
          {showPermissionStep ? (
            <div className="mt-3 rounded-lg bg-muted p-3 text-xs leading-6">
              <p>
                با تأیید مرحله بعد، پنجره رسمی مرورگر باز می‌شود. پذیرش آن به‌تنهایی رضایت پیامک،
                ایمیل یا بازاریابی نیست.
              </p>
              <Button className="mt-2" size="sm" disabled={pushBusy} onClick={requestPush}>
                {pushBusy ? <LoaderCircle className="animate-spin" /> : null} ادامه و درخواست مجوز
              </Button>
            </div>
          ) : null}
          {permission === "denied" ? (
            <p className="mt-3 text-xs text-destructive">
              مجوز مرورگر مسدود است. آن را فقط از تنظیمات Site Settings مرورگر می‌توانید تغییر دهید.
            </p>
          ) : null}
          {permission === "unsupported" ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Push در این مرورگر در دسترس نیست. در iPhone ابتدا برنامه را به Home Screen اضافه کنید.
            </p>
          ) : null}
        </section>

        {loading ? (
          <div className="flex min-h-28 items-center justify-center" role="status">
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            <span className="sr-only">در حال دریافت اعلان‌ها</span>
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-destructive/40 p-4 text-sm" role="alert">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={load}>
              <RefreshCw aria-hidden="true" /> تلاش دوباره
            </Button>
          </div>
        ) : null}
        {!loading && !error && snapshot ? (
          <>
            <section aria-labelledby="notification-list-title">
              <h3 id="notification-list-title" className="font-fa text-sm font-bold">
                پیام‌ها
              </h3>
              {snapshot.items.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                  اعلانی وجود ندارد.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {snapshot.items.map((item) => (
                    <li key={item.id} className="rounded-xl border border-border p-3">
                      <p className="text-xs text-primary">{item.category}</p>
                      <h4 className="mt-1 font-fa text-sm font-bold">{item.title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                      {!item.readAt ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2"
                          onClick={() => markRead(item.id)}
                        >
                          علامت‌گذاری به‌عنوان خوانده‌شده
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section
              className="border-t border-border pt-4"
              aria-labelledby="notification-settings-title"
            >
              <h3 id="notification-settings-title" className="font-fa text-sm font-bold">
                تنظیمات مستقل
              </h3>
              <div className="mt-3 space-y-2">
                {(Object.keys(labels) as PreferenceKey[]).map((key) => (
                  <label
                    key={key}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-3 text-sm"
                  >
                    <span>{labels[key]}</span>
                    <Switch
                      checked={snapshot.preferences[key]}
                      onCheckedChange={(value) => void updatePreference(key, value)}
                      aria-label={labels[key]}
                    />
                  </label>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
