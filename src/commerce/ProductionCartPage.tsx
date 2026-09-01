import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  deleteCommerceCartItem,
  getCommerceCart,
  putCommerceCartItem,
  type CommerceCart,
} from "@/commerce/commerce-api";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/shoes";

export function ProductionCartPage() {
  const [cart, setCart] = useState<CommerceCart | null>();
  const [status, setStatus] = useState("");
  const refresh = useCallback(async () => {
    try {
      setCart(await getCommerceCart());
    } catch {
      setCart(null);
      setStatus("دریافت سبد از سرور انجام نشد.");
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const change = async (variantId: number, quantity: number) => {
    try {
      setCart(
        quantity < 1
          ? await deleteCommerceCartItem(variantId)
          : await putCommerceCartItem(variantId, quantity),
      );
      setStatus("سبد از سرور به‌روزرسانی شد.");
    } catch {
      setStatus("موجودی یا قیمت تغییر کرده است؛ سبد دوباره بررسی شد.");
      await refresh();
    }
  };

  return (
    <Shell>
      <main
        className="page-container-wide pb-36 pt-8 md:pb-16"
        aria-labelledby="production-cart-heading"
        data-testid="production-cart-page"
      >
        <p className="eyebrow text-primary">Server-authoritative cart</p>
        <h1
          id="production-cart-heading"
          className="mt-2 font-display text-4xl font-black sm:text-5xl"
        >
          سبد خرید
        </h1>
        <p className="mt-3 max-w-2xl font-fa text-sm leading-7 text-muted-foreground">
          قیمت، موجودی و امکان ادامه خرید مستقیماً از Backend محاسبه می‌شود.
        </p>
        {status ? (
          <p role="status" className="mt-4 rounded-xl border border-border p-3 font-fa text-sm">
            {status}
          </p>
        ) : null}
        {cart === undefined ? (
          <div role="status" className="mt-10 min-h-72 rounded-2xl border border-border p-8">
            در حال دریافت سبد…
          </div>
        ) : null}
        {cart === null ? (
          <div className="mt-10 rounded-2xl border border-danger/30 p-8">
            سبد سرور در دسترس نیست.
          </div>
        ) : null}
        {cart?.items.length === 0 ? (
          <div className="mt-10 grid min-h-72 place-items-center rounded-2xl border border-dashed border-border p-8 text-center">
            <div>
              <ShoppingBag className="mx-auto size-10 text-primary" />
              <h2 className="mt-4 text-2xl font-bold">سبد خالی است</h2>
              <Button asChild className="mt-5">
                <Link to="/products">مشاهده محصولات</Link>
              </Button>
            </div>
          </div>
        ) : null}
        {cart && cart.items.length > 0 ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
            <section className="space-y-4" aria-label="اقلام سبد">
              {cart.items.map((item) => (
                <article
                  key={item.variant_id}
                  className="rounded-2xl border border-border bg-surface p-5"
                  data-status={item.status}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        to="/product/$id"
                        params={{ id: item.product_slug }}
                        className="font-display text-xl font-bold"
                      >
                        {item.product_name}
                      </Link>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.variant_title} · EU {item.size ?? "—"}
                      </p>
                      <p className="mt-3 font-bold">{formatPrice(item.unit_price_minor / 10)}</p>
                    </div>
                    <button
                      type="button"
                      className="grid size-11 place-items-center rounded-full"
                      aria-label={`حذف ${item.product_name}`}
                      onClick={() => void change(item.variant_id, 0)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-4 inline-flex items-center rounded-full border border-border p-1">
                    <button
                      type="button"
                      className="grid size-11 place-items-center rounded-full"
                      aria-label="کاهش تعداد"
                      onClick={() => void change(item.variant_id, item.quantity - 1)}
                    >
                      <Minus className="size-4" />
                    </button>
                    <output className="min-w-10 text-center">{item.quantity}</output>
                    <button
                      type="button"
                      className="grid size-11 place-items-center rounded-full"
                      aria-label="افزایش تعداد"
                      disabled={item.quantity >= item.available_quantity}
                      onClick={() => void change(item.variant_id, item.quantity + 1)}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  {item.status !== "ready" ? (
                    <p className="mt-3 text-sm text-warning">
                      این قلم نیاز به بازبینی موجودی دارد.
                    </p>
                  ) : null}
                </article>
              ))}
            </section>
            <aside className="h-fit rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-xl font-bold">جمع سبد</h2>
              <div className="mt-5 flex justify-between">
                <span>جمع کالاها</span>
                <strong>{formatPrice(cart.summary.subtotal_minor / 10)}</strong>
              </div>
              <p className="mt-4 text-xs leading-6 text-muted-foreground">
                هزینه ارسال و مبلغ نهایی در Checkout و فقط از سیاست رسمی Backend محاسبه می‌شود.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-6 w-full"
                disabled={!cart.summary.checkout_ready}
              >
                <Link to="/checkout">ادامه به Checkout</Link>
              </Button>
            </aside>
          </div>
        ) : null}
      </main>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      {children}
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
