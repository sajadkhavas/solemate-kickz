import { Link } from "@tanstack/react-router";
import { Heart, LoaderCircle, LogIn, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ProductionFooter as Footer } from "@/auth/ProductionFooter";
import { ProductionMobileBottomNav as MobileBottomNav } from "@/auth/ProductionMobileBottomNav";
import { ProductionNavbar as Navbar } from "@/auth/ProductionNavbar";
import { catalogForRuntime } from "@/catalog/production-catalog";
import { Button } from "@/components/ui/button";
import { formatPrice, SHOES } from "@/data/shoes";
import { removeWishlistVariant } from "@/engagement/engagement-api";
import {
  loadProductionWishlist,
  migrateLegacyWishlist,
  useProductionWishlistSnapshot,
} from "@/engagement/production-wishlist-store";

export function ProductionWishlistPage() {
  const wishlist = useProductionWishlistSnapshot();
  const [migration, setMigration] = useState<string | null>(null);
  const [busyVariant, setBusyVariant] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const loaded = await loadProductionWishlist();
      if (loaded.status !== "ready") return;
      try {
        const catalog = await catalogForRuntime(SHOES);
        const migrated = await migrateLegacyWishlist(catalog);
        if (active && migrated > 0) setMigration(`${migrated} مورد قدیمی با حساب شما همگام شد.`);
      } catch {
        if (active) setMigration("انتقال علاقه‌مندی قدیمی کامل نشد؛ داده محلی حذف نشد.");
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  const remove = async (variantId: number) => {
    setBusyVariant(variantId);
    try {
      await removeWishlistVariant(variantId);
      await loadProductionWishlist(true);
    } finally {
      setBusyVariant(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="p09-production-wishlist">
      <Navbar />
      <main className="px-[var(--space-page-gutter)] py-10 pb-[calc(var(--safe-bottom-nav)+env(safe-area-inset-bottom)+3rem)] md:py-16">
        <section className="mx-auto max-w-[1100px]">
          <div className="border-b border-border pb-7">
            <div className="eyebrow text-primary">P09 · Server-owned wishlist</div>
            <h1 className="mt-3 font-display text-[length:var(--text-h1)] font-black">علاقه‌مندی‌ها</h1>
            <p className="mt-3 max-w-2xl font-fa leading-7 text-muted-foreground">
              در نسخه production، عضویت در علاقه‌مندی فقط از حساب شما و Backend خوانده می‌شود.
              داده محلی قدیمی صرفاً یک‌بار و پس از تأیید Backend منتقل می‌شود.
            </p>
          </div>

          {migration ? (
            <p role="status" className="mt-5 rounded-xl border border-border p-3 text-sm">
              {migration}
            </p>
          ) : null}

          {wishlist.status === "idle" || wishlist.status === "loading" ? (
            <div className="grid min-h-64 place-items-center" role="status">
              <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
              <span className="sr-only">در حال دریافت علاقه‌مندی</span>
            </div>
          ) : null}

          {wishlist.status === "unauthorized" ? (
            <div className="mt-8 rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-8 text-center">
              <LogIn aria-hidden="true" className="mx-auto size-10 text-primary" />
              <h2 className="mt-4 font-display text-2xl font-black">برای علاقه‌مندی وارد شوید</h2>
              <p className="mt-2 font-fa text-muted-foreground">
                لیست production به حساب احراز هویت‌شده متصل است.
              </p>
              <Button asChild className="mt-5">
                <Link to="/auth">ورود امن</Link>
              </Button>
            </div>
          ) : null}

          {wishlist.status === "error" ? (
            <div className="mt-8 rounded-xl border border-destructive/40 p-6" role="alert">
              <p>{wishlist.error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => void loadProductionWishlist(true)}
              >
                <RefreshCw aria-hidden="true" /> تلاش دوباره
              </Button>
            </div>
          ) : null}

          {wishlist.status === "ready" && wishlist.items.length === 0 ? (
            <div className="mt-8 rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-10 text-center">
              <Heart aria-hidden="true" className="mx-auto size-10 text-muted-foreground" />
              <h2 className="mt-4 font-display text-2xl font-black">هنوز موردی ذخیره نشده</h2>
              <Button asChild variant="outline" className="mt-5">
                <Link to="/products">مشاهده فروشگاه</Link>
              </Button>
            </div>
          ) : null}

          {wishlist.status === "ready" && wishlist.items.length > 0 ? (
            <ul className="mt-8 grid gap-4">
              {wishlist.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="eyebrow text-muted-foreground">Variant #{item.variant_id}</p>
                    <h2 className="mt-1 font-display text-xl font-black">
                      {item.product_name ?? "محصول"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[item.variant_title, item.size, item.color].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-2 font-mono-num text-sm">
                      {item.currency === "IRR"
                        ? formatPrice(item.price_minor / 10)
                        : `${item.price_minor.toLocaleString("fa-IR")} ${item.currency}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline">
                      <Link to="/product/$id" params={{ id: String(item.product_id) }}>
                        مشاهده
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busyVariant === item.variant_id}
                      onClick={() => void remove(item.variant_id)}
                    >
                      <Trash2 aria-hidden="true" /> حذف
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
