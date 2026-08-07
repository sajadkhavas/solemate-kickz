import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { ShoeCard } from "@/components/ShoeCard";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { SHOES } from "@/data/shoes";
import { useStore } from "@/store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "علاقه‌مندی‌ها — SOLE" },
      {
        name: "description",
        content: "فهرست علاقه‌مندی‌های محلی SOLE؛ داده‌ها فقط در مرورگر همین نسخه نمایشی نگه‌داری می‌شوند.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const wishlist = useStore((state) => state.wishlist);
  const clearWishlist = useStore((state) => state.clearWishlist);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const shoes = useMemo(
    () => (mounted ? wishlist.map((id) => SHOES.find((shoe) => shoe.id === id)).filter(Boolean) : []),
    [mounted, wishlist],
  );

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="wishlist-page">
      <Navbar />
      <main className="px-[var(--space-page-gutter)] py-10 pb-[calc(var(--safe-bottom-nav)+env(safe-area-inset-bottom)+3rem)] md:py-16">
        <section className="mx-auto max-w-[1400px]">
          <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="eyebrow text-primary">Local wishlist</div>
              <h1 className="mt-3 font-display text-[length:var(--text-h1)] font-black leading-[1.05]">
                علاقه‌مندی‌ها
              </h1>
              <p className="mt-4 max-w-2xl font-fa leading-7 text-muted-foreground">
                این فهرست فقط در storage مرورگر همین نسخه نمایشی نگه‌داری می‌شود و به حساب یا
                Backend واقعی متصل نیست.
              </p>
            </div>

            {mounted && shoes.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={clearWishlist}
                data-testid="wishlist-clear"
              >
                <Trash2 aria-hidden="true" />
                پاک‌کردن همه
              </Button>
            ) : null}
          </div>

          {!mounted ? (
            <div
              role="status"
              aria-live="polite"
              className="mt-8 rounded-[var(--radius-xl)] border border-border bg-surface p-8 text-center font-fa text-muted-foreground"
            >
              در حال خواندن فهرست محلی مرورگر…
            </div>
          ) : shoes.length === 0 ? (
            <div
              data-testid="wishlist-empty"
              className="mt-8 grid min-h-[24rem] place-items-center rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-8 text-center"
            >
              <div className="max-w-xl">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-interactive text-primary">
                  <Heart aria-hidden="true" className="size-7" />
                </span>
                <h2 className="mt-5 font-display text-3xl font-black">هنوز چیزی ذخیره نکرده‌اید</h2>
                <p className="mt-3 font-fa leading-7 text-muted-foreground">
                  از کارت محصول یا صفحه جزئیات، دکمه قلب را بزنید. انتخاب شما در همین مرورگر
                  باقی می‌ماند تا بعداً دوباره آن را ببینید.
                </p>
                <Button asChild size="lg" className="mt-6">
                  <Link to="/products">
                    <ShoppingBag aria-hidden="true" />
                    دیدن محصولات
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 flex items-center justify-between gap-4">
                <p className="font-fa text-sm text-muted-foreground" data-testid="wishlist-count">
                  {shoes.length.toLocaleString("fa-IR")} محصول ذخیره‌شده
                </p>
                <Button asChild variant="ghost">
                  <Link to="/products">ادامه خرید</Link>
                </Button>
              </div>
              <div
                data-testid="wishlist-grid"
                className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {shoes.map((shoe, index) =>
                  shoe ? <ShoeCard key={shoe.id} shoe={shoe} index={index} /> : null,
                )}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
