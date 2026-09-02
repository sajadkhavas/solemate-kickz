import { Award, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { ProductionFooter as Footer } from "@/auth/ProductionFooter";
import { ProductionMobileBottomNav as MobileBottomNav } from "@/auth/ProductionMobileBottomNav";
import { ProductionNavbar as Navbar } from "@/auth/ProductionNavbar";
import { Button } from "@/components/ui/button";
import {
  EngagementApiError,
  getLoyalty,
  type LoyaltySnapshot,
} from "@/engagement/engagement-api";

export function ProductionLoyaltyPage() {
  const [snapshot, setSnapshot] = useState<LoyaltySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await getLoyalty());
    } catch (cause) {
      setSnapshot(null);
      setError(
        cause instanceof EngagementApiError && cause.status === 401
          ? "برای مشاهده امتیازهای حساب وارد شوید."
          : "دریافت دفتر امتیاز از Backend انجام نشد.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="p09-production-loyalty">
      <Navbar />
      <main className="px-[var(--space-page-gutter)] py-10 pb-[calc(var(--safe-bottom-nav)+env(safe-area-inset-bottom)+3rem)] md:py-16">
        <section className="mx-auto max-w-[1000px]">
          <div className="eyebrow text-primary">P09 · Server-authoritative loyalty</div>
          <h1 className="mt-3 font-display text-[length:var(--text-h1)] font-black">امتیازهای SOLE</h1>
          <p className="mt-3 max-w-2xl font-fa leading-7 text-muted-foreground">
            موجودی و تاریخچه فقط از ledger سرور خوانده می‌شود. این صفحه هیچ امتیازی را در مرورگر
            محاسبه یا ایجاد نمی‌کند.
          </p>

          {loading ? (
            <div className="grid min-h-56 place-items-center" role="status">
              <LoaderCircle aria-hidden="true" className="animate-spin" />
              <span className="sr-only">در حال دریافت امتیازها</span>
            </div>
          ) : null}
          {error ? (
            <div role="alert" className="mt-7 rounded-xl border border-destructive/40 p-5">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => void load()}>
                <RefreshCw aria-hidden="true" /> تلاش دوباره
              </Button>
            </div>
          ) : null}

          {!loading && !error && snapshot ? (
            <>
              <section className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
                  <Award aria-hidden="true" className="size-8 text-primary" />
                  <p className="mt-4 font-fa text-sm text-muted-foreground">موجودی قابل استفاده</p>
                  <p className="mt-2 font-mono-num text-4xl font-black">
                    {snapshot.balance.toLocaleString("fa-IR")}
                  </p>
                </div>
                <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
                  <ShieldCheck aria-hidden="true" className="size-8 text-primary" />
                  <h2 className="mt-4 font-display text-xl font-black">شرایط قابل اثبات</h2>
                  <ul className="mt-3 space-y-2 font-fa text-sm text-muted-foreground">
                    <li>ارزش نقدی: ندارد</li>
                    <li>مرجع موجودی: فقط Backend ledger</li>
                    <li>نرخ کسب عمومی: هنوز منتشر نشده است</li>
                  </ul>
                </div>
              </section>

              <section className="mt-8 rounded-[var(--radius-xl)] border border-border bg-surface p-6">
                <h2 className="font-display text-2xl font-black">تاریخچه ledger</h2>
                {snapshot.history.length === 0 ? (
                  <p className="mt-4 font-fa text-muted-foreground">هنوز entry ثبت‌شده‌ای وجود ندارد.</p>
                ) : (
                  <ul className="mt-5 divide-y divide-border">
                    {snapshot.history.map((entry) => (
                      <li key={entry.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <strong dir="ltr" className="font-mono-num text-sm">
                            {entry.type}
                          </strong>
                          <p className="mt-1 font-fa text-sm text-muted-foreground">{entry.reason}</p>
                        </div>
                        <span className="font-mono-num text-lg font-bold">
                          {entry.points_delta > 0 ? "+" : ""}
                          {entry.points_delta.toLocaleString("fa-IR")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : null}
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
