import { Bell, LoaderCircle, RefreshCw, ShieldAlert } from "lucide-react";
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
import {
  EngagementApiError,
  getNotificationPreferences,
  getNotificationSignals,
  unsubscribeNotificationChannel,
  updateNotificationPreference,
  type NotificationChannel,
  type NotificationPreference,
  type NotificationSignal,
} from "@/engagement/engagement-api";

const labels: Record<NotificationChannel, string> = {
  email: "ایمیل",
  sms: "پیامک",
  push: "Push",
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [signals, setSignals] = useState<NotificationSignal[]>([]);
  const [saving, setSaving] = useState<NotificationChannel | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextPreferences, nextSignals] = await Promise.all([
        getNotificationPreferences(),
        getNotificationSignals(),
      ]);
      setPreferences(nextPreferences);
      setSignals(nextSignals);
    } catch (cause) {
      setPreferences([]);
      setSignals([]);
      setError(
        cause instanceof EngagementApiError && cause.status === 401
          ? "برای مشاهده تنظیمات اعلان وارد حساب شوید."
          : "دریافت سیاست اعلان از Backend انجام نشد.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void load();
  }, [open]);

  const save = async (preference: NotificationPreference, enabled: boolean) => {
    setSaving(preference.channel);
    setError(null);
    try {
      const saved = await updateNotificationPreference(preference.channel, {
        enabled,
        daily_cap: preference.daily_cap,
        quiet_start: preference.quiet_start,
        quiet_end: preference.quiet_end,
        timezone: preference.timezone,
      });
      setPreferences((current) =>
        current.map((item) => (item.channel === saved.channel ? saved : item)),
      );
    } catch {
      setError("ذخیره رضایت/ترجیح انجام نشد.");
    } finally {
      setSaving(null);
    }
  };

  const unsubscribe = async (channel: NotificationChannel) => {
    setSaving(channel);
    setError(null);
    try {
      const saved = await unsubscribeNotificationChannel(channel);
      setPreferences((current) =>
        current.map((item) => (item.channel === saved.channel ? saved : item)),
      );
    } catch {
      setError("لغو کانال انجام نشد.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="مرکز اعلان‌ها" data-testid="notification-center-trigger">
          <Bell aria-hidden="true" className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,48rem)] overflow-y-auto sm:max-w-2xl" dir="rtl" data-testid="p09-production-notification-center">
        <DialogHeader>
          <DialogTitle>اعلان‌ها و ترجیحات</DialogTitle>
          <DialogDescription>
            فعال‌بودن یک کانال فقط رضایت و سیاست تحویل را ثبت می‌کند؛ تا وقتی adapter/provider واقعی پیکربندی نشده، ارسال موفق ادعا نمی‌شود.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm leading-6">
          <ShieldAlert aria-hidden="true" className="mb-2 size-5 text-warning" />
          Push مرورگر، VAPID و provider در P09 فعال نمی‌شوند. Backend به‌صورت fail-closed هر adapter پیکربندی‌نشده را با audit ثبت می‌کند.
        </div>

        {loading ? <div className="grid min-h-24 place-items-center" role="status"><LoaderCircle aria-hidden="true" className="animate-spin" /><span className="sr-only">در حال دریافت تنظیمات</span></div> : null}
        {error ? (
          <div role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}><RefreshCw aria-hidden="true" /> تلاش دوباره</Button>
          </div>
        ) : null}

        {!loading && preferences.length > 0 ? (
          <section aria-labelledby="p09-preferences-title">
            <h3 id="p09-preferences-title" className="font-fa text-sm font-bold">رضایت و محدودیت کانال‌ها</h3>
            <div className="mt-3 grid gap-3">
              {preferences.map((preference) => (
                <div key={preference.channel} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-fa font-bold">{labels[preference.channel]}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        سقف روزانه: {preference.daily_cap} · منطقه زمانی: {preference.timezone}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        ساعات سکوت: {preference.quiet_start && preference.quiet_end ? `${preference.quiet_start} تا ${preference.quiet_end}` : "ثبت نشده"}
                      </p>
                    </div>
                    <Switch
                      checked={preference.enabled}
                      disabled={saving === preference.channel}
                      onCheckedChange={(checked) => void save(preference, checked)}
                      aria-label={`فعال‌سازی ${labels[preference.channel]}`}
                    />
                  </div>
                  {preference.enabled ? (
                    <Button type="button" variant="ghost" size="sm" className="mt-3" disabled={saving === preference.channel} onClick={() => void unsubscribe(preference.channel)}>
                      لغو این کانال
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && !error ? (
          <section className="border-t border-border pt-4" aria-labelledby="p09-signals-title">
            <h3 id="p09-signals-title" className="font-fa text-sm font-bold">سیگنال و audit تحویل</h3>
            {signals.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">سیگنال قابل نمایش وجود ندارد.</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {signals.map((signal) => (
                  <li key={signal.id} className="rounded-xl border border-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <strong dir="ltr">{signal.type}</strong>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs">{signal.status}</span>
                    </div>
                    {signal.delivery_attempts.length ? (
                      <ul className="mt-2 grid gap-1 text-xs text-muted-foreground">
                        {signal.delivery_attempts.map((attempt, index) => (
                          <li key={`${signal.id}-${attempt.channel}-${index}`}>
                            {attempt.channel}: {attempt.status} · {attempt.reason} · provider: {attempt.provider ?? "none"}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">هنوز تلاش تحویل ثبت نشده است.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
