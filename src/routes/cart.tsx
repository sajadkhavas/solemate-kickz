import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, Tag, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useStore } from "@/store";
import { SHOES, formatPrice } from "@/data/shoes";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "سبد خرید — SOLE" }],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useStore((s) => s.cart);
  const updateQty = useStore((s) => s.updateQty);
  const removeFromCart = useStore((s) => s.removeFromCart);

  const items = useMemo(
    () =>
      cart
        .map((c) => {
          const shoe = SHOES.find((s) => s.id === c.id);
          return shoe ? { ...c, shoe } : null;
        })
        .filter(Boolean) as Array<{ id: number; size: number; qty: number; shoe: (typeof SHOES)[number] }>,
    [cart],
  );

  const subtotal = items.reduce((acc, i) => acc + i.shoe.price * i.qty, 0);
  const discountTotal = items.reduce(
    (acc, i) => acc + (i.shoe.sale_price ? (i.shoe.price - i.shoe.sale_price) * i.qty : 0),
    0,
  );
  const [coupon, setCoupon] = useState("");
  const [extra, setExtra] = useState(0);
  const afterDiscount = subtotal - discountTotal - extra;
  const tax = Math.round(afterDiscount * 0.09);
  const total = afterDiscount + tax;

  function applyCoupon() {
    if (coupon.trim().toUpperCase() === "SOLE10") {
      setExtra(Math.round(afterDiscount * 0.1));
      toast.success("کد تخفیف اعمال شد -۱۰٪");
    } else if (coupon.trim()) {
      toast.error("کد تخفیف نامعتبر است");
    }
  }

  return (
    <div className="bg-ink min-h-screen">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="eyebrow text-neon mb-2">Your Bag</div>
        <h1 className="font-display font-black text-4xl md:text-6xl uppercase mb-10">
          سبد خرید <span className="text-muted-foreground font-mono-num text-3xl">({items.length})</span>
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 gap-5">
            <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center">
              <ShoppingBag size={40} className="text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl mb-2">کیفت خالیه!</h2>
              <p className="text-muted-foreground">برو یه چیز باحال پیدا کن</p>
            </div>
            <Link to="/products" className="btn-hype">Shop Now →</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.7fr_1fr] gap-8">
            {/* Items */}
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {items.map((i) => (
                  <motion.div
                    key={`${i.id}-${i.size}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className="bg-surface border border-border rounded-2xl p-4 flex gap-4"
                  >
                    <Link
                      to="/product/$id"
                      params={{ id: String(i.id) }}
                      className="shrink-0"
                    >
                      <img
                        src={i.shoe.image}
                        alt={i.shoe.name}
                        className="w-28 h-28 md:w-32 md:h-32 rounded-xl object-cover bg-ink"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <div className="eyebrow text-muted-foreground">{i.shoe.brand}</div>
                          <Link
                            to="/product/$id"
                            params={{ id: String(i.id) }}
                            className="font-display font-bold text-lg leading-tight hover:text-neon truncate block"
                          >
                            {i.shoe.name}
                          </Link>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {i.shoe.colorway} · سایز {i.size}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(i.id, i.size)}
                          className="text-muted-foreground hover:text-destructive transition shrink-0"
                          aria-label="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-end justify-between mt-4">
                        <div className="flex items-center gap-1 bg-ink rounded-full p-1">
                          <button
                            onClick={() => updateQty(i.id, i.size, i.qty - 1)}
                            className="w-7 h-7 rounded-full hover:bg-neon hover:text-ink flex items-center justify-center"
                            aria-label="Decrease"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center font-mono-num text-sm">{i.qty}</span>
                          <button
                            onClick={() => updateQty(i.id, i.size, i.qty + 1)}
                            className="w-7 h-7 rounded-full hover:bg-neon hover:text-ink flex items-center justify-center"
                            aria-label="Increase"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="font-mono-num font-bold text-lg">
                            {formatPrice((i.shoe.sale_price ?? i.shoe.price) * i.qty)}
                          </div>
                          {i.shoe.sale_price && (
                            <div className="font-mono-num text-xs text-muted-foreground line-through">
                              {formatPrice(i.shoe.price * i.qty)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-24 self-start bg-surface border border-border rounded-2xl p-6 space-y-5 h-fit">
              <div className="eyebrow text-neon">Order Summary</div>

              <div className="space-y-2 text-sm">
                <Row label="قیمت کالاها" value={formatPrice(subtotal)} />
                {discountTotal > 0 && (
                  <Row label="تخفیف" value={`-${formatPrice(discountTotal)}`} accent="text-neon" />
                )}
                {extra > 0 && (
                  <Row label="کد تخفیف" value={`-${formatPrice(extra)}`} accent="text-neon" />
                )}
                <Row label="هزینه ارسال" value="رایگان 🎉" accent="text-neon" />
                <Row label="مالیات ۹٪" value={formatPrice(tax)} />
              </div>

              <div className="border-t border-border pt-4 flex justify-between items-baseline">
                <span className="font-display font-bold">جمع کل</span>
                <span className="font-mono-num font-black text-2xl text-neon">{formatPrice(total)}</span>
              </div>

              {/* Coupon */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="کد تخفیف"
                    className="w-full bg-ink border border-border rounded-full pr-9 pl-3 py-2.5 text-sm focus:border-neon outline-none"
                  />
                </div>
                <button
                  onClick={applyCoupon}
                  className="px-4 rounded-full bg-ink border border-border hover:border-neon text-sm font-display uppercase tracking-wider"
                >
                  اعمال
                </button>
              </div>

              <button className="btn-hype w-full justify-center h-14">
                تکمیل خرید →
              </button>
              <Link
                to="/products"
                className="block text-center text-xs text-muted-foreground hover:text-neon"
              >
                ادامه خرید
              </Link>

              <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground pt-4 border-t border-border">
                <div className="flex flex-col items-center text-center gap-1">
                  <ShieldCheck size={14} className="text-neon" /> پرداخت امن
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <Truck size={14} className="text-neon" /> ارسال سریع
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <RotateCcw size={14} className="text-neon" /> ۷ روز بازگشت
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono-num ${accent ?? ""}`}>{value}</span>
    </div>
  );
}
