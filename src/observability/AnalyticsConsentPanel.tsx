import { useEffect, useState } from "react";

import { getAnalyticsConsent, setAnalyticsConsent } from "./client";

export function AnalyticsConsentPanel({ onStatus }: { onStatus: (message: string) => void }) {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getAnalyticsConsent()
      .then((value) => setGranted(value.granted))
      .catch(() => setGranted(false));
  }, []);

  const update = async (next: boolean) => {
    setSaving(true);
    try {
      const value = await setAnalyticsConsent(next);
      setGranted(value.granted);
      onStatus(
        next ? "اندازه‌گیری اختیاری تجربه کاربری فعال شد." : "اندازه‌گیری تجربه کاربری غیرفعال شد.",
      );
    } catch {
      onStatus("تغییر رضایت تحلیل تجربه کاربری انجام نشد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="rounded-[var(--radius-xl)] border border-border bg-surface p-6"
      data-testid="analytics-consent-panel"
    >
      <h2 className="font-display text-2xl font-black">تحلیل اختیاری تجربه کاربری</h2>
      <p className="mt-2 font-fa leading-7 text-muted-foreground">
        فقط معیارهای فنی محدود و بدون متن آزاد، نشانی کامل، شناسه سفارش یا اطلاعات شخصی ثبت می‌شوند.
        خاموش‌کردن آن فوری است.
      </p>
      <button
        type="button"
        role="switch"
        aria-checked={granted === true}
        disabled={granted === null || saving}
        onClick={() => void update(granted !== true)}
        className="mt-5 min-h-11 rounded-[var(--radius-md)] border border-border-strong px-4 font-fa disabled:opacity-50"
      >
        {saving
          ? "در حال ثبت…"
          : granted
            ? "فعال — برای غیرفعال‌کردن کلیک کنید"
            : "غیرفعال — برای فعال‌کردن کلیک کنید"}
      </button>
    </section>
  );
}
