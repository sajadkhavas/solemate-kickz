import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Heart, Share2, Truck, RotateCcw, ShieldCheck, ChevronDown, Star } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ShoeCard } from "@/components/ShoeCard";
import { SHOES, formatPrice } from "@/data/shoes";
import { useStore } from "@/store";
import { useSharedTransition } from "@/hooks/useSharedTransition";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const shoe = SHOES.find((s) => s.id === Number(params.id));
    if (!shoe) throw notFound();
    return { shoe };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.shoe.brand} ${loaderData.shoe.name} — SOLE` },
          { name: "description", content: `${loaderData.shoe.colorway} — ${formatPrice(loaderData.shoe.sale_price ?? loaderData.shoe.price)}` },
          { property: "og:title", content: `${loaderData.shoe.brand} ${loaderData.shoe.name}` },
          { property: "og:image", content: loaderData.shoe.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <div className="font-display font-black text-6xl text-muted-foreground">404</div>
        <p className="mt-2 mb-6">این کفش پیدا نشد</p>
        <Link to="/products" className="btn-hype">برگرد به فروشگاه</Link>
      </div>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const data = Route.useLoaderData() as { shoe: (typeof SHOES)[number] };
  const { shoe } = data;
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const isWishlisted = useStore((s) => s.wishlist.includes(shoe.id));
  const addRecentlyViewed = useStore((s) => s.addRecentlyViewed);

  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState<number | null>(shoe.sizes[Math.floor(shoe.sizes.length / 2)] ?? null);
  const [activeColor, setActiveColor] = useState(0);
  const [openSection, setOpenSection] = useState<string | null>("specs");
  const { getRect } = useSharedTransition();
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const [flip, setFlip] = useState<{ x: number; y: number; sx: number; sy: number } | null>(null);

  useEffect(() => {
    addRecentlyViewed(shoe.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoe.id]);

  useEffect(() => {
    const from = getRect(shoe.id);
    if (!from || !galleryRef.current) return;
    const to = galleryRef.current.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const sx = from.width / to.width;
    const sy = from.height / to.height;
    setFlip({ x: dx, y: dy, sx, sy });
    requestAnimationFrame(() => setFlip({ x: 0, y: 0, sx: 1, sy: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoe.id]);

  const discount = shoe.sale_price
    ? Math.round(((shoe.price - shoe.sale_price) / shoe.price) * 100)
    : 0;
  const price = shoe.sale_price ?? shoe.price;

  const related = SHOES.filter((s) => s.id !== shoe.id && (s.brand === shoe.brand || s.category === shoe.category)).slice(0, 4);

  // Pseudo "sold" sizes for variety (deterministic)
  const soldOutSizes = new Set(shoe.sizes.filter((_, idx) => (shoe.id + idx) % 5 === 0));

  const lowStock = !shoe.isSoldOut && (shoe.id % 3 === 0);

  function handleAdd() {
    if (shoe.isSoldOut) return;
    if (!size) {
      toast.error("لطفاً سایز رو انتخاب کن");
      return;
    }
    if (soldOutSizes.has(size)) {
      toast.error("این سایز ناموجوده");
      return;
    }
    addToCart(shoe.id, size, 1);
    toast.success(`${shoe.name} به سبد اضافه شد 🛒`);
    setCartOpen(true);
  }

  return (
    <motion.div
      className="bg-ink text-foreground min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground mb-6 flex gap-2 items-center">
          <Link to="/" className="hover:text-neon">خانه</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-neon">فروشگاه</Link>
          <span>/</span>
          <span className="text-foreground">{shoe.name}</span>
        </nav>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10">
          {/* Gallery */}
          <div>
            <div
              ref={galleryRef}
              style={
                flip
                  ? {
                      transform: `translate(${flip.x}px, ${flip.y}px) scale(${flip.sx}, ${flip.sy})`,
                      transformOrigin: "top left",
                      transition:
                        flip.x === 0 && flip.y === 0
                          ? "transform 0.6s cubic-bezier(0.16,1,0.3,1)"
                          : "none",
                    }
                  : undefined
              }
              className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-surface-2 to-surface border border-border group"
            >
              {shoe.isNew && (
                <span className="absolute top-4 left-4 z-10 bg-neon text-ink eyebrow px-3 py-1 rounded-full">NEW</span>
              )}
              {shoe.isLimited && (
                <span className="absolute top-4 left-4 z-10 mt-8 bg-neon-orange text-white eyebrow px-3 py-1 rounded-full">LIMITED</span>
              )}
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success("لینک کپی شد!");
                }}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-ink/60 backdrop-blur flex items-center justify-center hover:bg-neon hover:text-ink transition"
                aria-label="Share"
              >
                <Share2 size={16} />
              </button>

              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  src={shoe.images[activeImg]}
                  alt={shoe.name}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </AnimatePresence>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-muted-foreground bg-ink/60 backdrop-blur px-3 py-1 rounded-full">
                ↔ DRAG TO ROTATE
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-4">
              {shoe.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                    activeImg === i ? "border-neon" : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <img src={img} alt={`Angle ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="eyebrow text-neon mb-2">{shoe.brand}</div>
            <h1 className="font-display font-black text-4xl md:text-5xl leading-[0.95] tracking-tight">
              {shoe.name}
            </h1>
            <p className="text-muted-foreground mt-2">{shoe.colorway}</p>

            <div className="flex items-center gap-3 text-sm mt-3 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-neon text-neon" />
                <span className="text-foreground font-mono-num">{shoe.rating}</span>
              </span>
              <span>·</span>
              <span className="font-mono-num">{shoe.reviews} نظر</span>
              <span>·</span>
              <span className="font-mono-num">SKU: {shoe.sku}</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-6">
              <span className="font-display font-black text-3xl text-neon font-mono-num">
                {formatPrice(price)}
              </span>
              {shoe.sale_price && (
                <>
                  <span className="font-mono-num text-muted-foreground line-through text-base">
                    {formatPrice(shoe.price)}
                  </span>
                  <span className="bg-neon-orange text-white eyebrow px-2 py-0.5 rounded-full">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {/* Colors */}
            <div className="mt-6">
              <div className="eyebrow text-muted-foreground mb-2">
                Color — <span className="text-foreground">{shoe.colorway}</span>
              </div>
              <div className="flex gap-2">
                {shoe.colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveColor(i)}
                    className={`w-9 h-9 rounded-full border-2 transition ${
                      activeColor === i ? "border-neon scale-110" : "border-border"
                    }`}
                    style={{ background: c }}
                    aria-label={`Color ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <div className="eyebrow text-muted-foreground">
                  Size — <span className="text-foreground">{size ? `EU ${size}` : "انتخاب کن"}</span>
                </div>
                <button className="text-xs text-neon hover:underline">راهنمای سایز</button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {shoe.sizes.map((s) => {
                  const isSold = soldOutSizes.has(s);
                  const isSel = size === s;
                  return (
                    <button
                      key={s}
                      disabled={isSold}
                      onClick={() => setSize(s)}
                      className={`py-3 rounded-xl font-mono-num text-sm font-semibold border transition ${
                        isSel
                          ? "bg-neon text-ink border-neon"
                          : isSold
                            ? "bg-surface border-border text-muted-foreground line-through cursor-not-allowed opacity-50"
                            : "bg-surface border-border hover:border-neon"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock indicator */}
            <div className="mt-5 text-sm">
              {shoe.isSoldOut ? (
                <span className="text-destructive flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive" /> ناموجود
                </span>
              ) : lowStock ? (
                <span className="text-neon-orange flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neon-orange animate-pulse" />
                  فقط ۳ جفت باقی مونده
                </span>
              ) : (
                <span className="text-neon flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neon" /> موجود در انبار
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleAdd}
                disabled={shoe.isSoldOut}
                className="w-full h-14 rounded-full bg-neon text-ink font-display font-bold uppercase tracking-wider hover:bg-foreground transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {shoe.isSoldOut ? "ناموجود" : "افزودن به سبد 🛒"}
              </button>
              <button
                onClick={() => {
                  toggleWishlist(shoe.id);
                  toast(isWishlisted ? "از علاقه‌مندی حذف شد" : "به علاقه‌مندی اضافه شد ♡");
                }}
                className="w-full h-12 rounded-full border border-border hover:border-neon flex items-center justify-center gap-2 transition"
              >
                <Heart size={16} className={isWishlisted ? "fill-neon text-neon" : ""} />
                {isWishlisted ? "ذخیره شده" : "ذخیره در علاقه‌مندی‌ها"}
              </button>
            </div>

            {/* Trust */}
            <div className="mt-6 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="flex flex-col items-center text-center gap-1 p-3 rounded-xl bg-surface">
                <Truck size={16} className="text-neon" /> ارسال رایگان
              </div>
              <div className="flex flex-col items-center text-center gap-1 p-3 rounded-xl bg-surface">
                <RotateCcw size={16} className="text-neon" /> ۷ روز بازگشت
              </div>
              <div className="flex flex-col items-center text-center gap-1 p-3 rounded-xl bg-surface">
                <ShieldCheck size={16} className="text-neon" /> اصالت تضمینی
              </div>
            </div>

            {/* Accordion */}
            <div className="mt-8 border-t border-border">
              {[
                {
                  id: "specs",
                  title: "مشخصات محصول",
                  content: (
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>جنس رویه: چرم طبیعی + مش</li>
                      <li>زیره: لاستیک ولکانیزه</li>
                      <li>وزن: ۳۴۰ گرم</li>
                      <li>کشور سازنده: ویتنام</li>
                      <li>برند: {shoe.brand}</li>
                      <li>SKU: <span className="font-mono-num">{shoe.sku}</span></li>
                    </ul>
                  ),
                },
                {
                  id: "care",
                  title: "راهنمای مراقبت",
                  content: (
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>از قرار دادن در آفتاب مستقیم بپرهیزید</li>
                      <li>با برس نرم و مرطوب تمیز کنید</li>
                      <li>در محیط خنک و خشک نگهداری کنید</li>
                    </ul>
                  ),
                },
                {
                  id: "ship",
                  title: "ارسال و بازگشت",
                  content: (
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>ارسال در ۱-۳ روز کاری</li>
                      <li>ارسال رایگان برای خریدهای بالای ۳ میلیون</li>
                      <li>بازگشت رایگان تا ۷ روز</li>
                    </ul>
                  ),
                },
              ].map((s) => (
                <div key={s.id} className="border-b border-border">
                  <button
                    onClick={() => setOpenSection(openSection === s.id ? null : s.id)}
                    className="w-full flex items-center justify-between py-4 font-display font-semibold text-sm uppercase tracking-wider"
                  >
                    {s.title}
                    <ChevronDown
                      size={16}
                      className={`transition ${openSection === s.id ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {openSection === s.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-4">{s.content}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-24">
            <div className="eyebrow text-neon mb-2">Complete The Look</div>
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase mb-8">
              این کفش‌ها هم بهت میاد
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((s, i) => (
                <ShoeCard key={s.id} shoe={s} index={i} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </motion.div>
  );
}
