import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { motion } from "framer-motion";
import { SlidersHorizontal, X, Grid3x3, LayoutList, Search, Tag, Flame, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ShoeCard } from "@/components/ShoeCard";
import { SHOES, BRANDS, CATEGORIES } from "@/data/shoes";

const searchSchema = z.object({
  brand: fallback(z.string().optional(), undefined),
  category: fallback(z.string().optional(), undefined),
  q: fallback(z.string().optional(), undefined),
  sort: fallback(z.enum(["newest", "price-asc", "price-desc", "popular"]), "newest").default("newest"),
});

export const Route = createFileRoute("/products")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Shop — SOLE" },
      { name: "description", content: "تمام کفش‌ها از همه برندها. فیلتر کن، پیدا کن، بپوش." },
      { property: "og:title", content: "Shop — SOLE" },
    ],
  }),
  component: ProductsPage,
});

const QUICK_FILTERS = [
  { id: "all", label: "همه", icon: Tag, filter: () => true },
  { id: "new", label: "جدید", icon: Sparkles, filter: (s: typeof SHOES[number]) => s.isNew },
  { id: "sale", label: "تخفیف‌دار", icon: Tag, filter: (s: typeof SHOES[number]) => !!s.sale_price },
  { id: "limited", label: "لیمیتد", icon: Flame, filter: (s: typeof SHOES[number]) => s.isLimited },
];

function ProductsPage() {
  const { brand, category, sort, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [sizes, setSizes] = useState<number[]>([]);
  const [maxPrice, setMaxPrice] = useState(20000000);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [quick, setQuick] = useState<string>("all");
  const [localQ, setLocalQ] = useState(q ?? "");

  const filtered = useMemo(() => {
    let list = [...SHOES];
    if (brand) list = list.filter(s => s.brand === brand);
    if (category) list = list.filter(s => s.category === category);
    const term = (q ?? "").trim().toLowerCase();
    if (term) list = list.filter(s => `${s.brand} ${s.name} ${s.colorway}`.toLowerCase().includes(term));
    if (sizes.length) list = list.filter(s => sizes.some(sz => s.sizes.includes(sz)));
    list = list.filter(s => (s.sale_price ?? s.price) <= maxPrice);
    const qf = QUICK_FILTERS.find(x => x.id === quick);
    if (qf) list = list.filter(qf.filter);
    if (sort === "price-asc") list.sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price));
    else if (sort === "price-desc") list.sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price));
    else if (sort === "popular") list.sort((a, b) => b.reviews - a.reviews);
    else list.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    return list;
  }, [brand, category, sort, sizes, maxPrice, quick, q]);

  const ALL_SIZES = [39, 40, 41, 42, 43, 44, 45, 46];

  const setParam = (key: "brand" | "category" | "q", value?: string) => {
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, [key]: value }) });
  };

  const clearAll = () => {
    navigate({ search: { sort: "newest" } as never });
    setSizes([]);
    setMaxPrice(20000000);
    setQuick("all");
    setLocalQ("");
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("q", localQ.trim() || undefined);
  };

  return (
    <div className="bg-ink text-foreground min-h-screen">
      <Navbar />

      {/* Hero header */}
      <section className="px-6 pt-12 pb-6 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,#c8f135_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="max-w-[1400px] mx-auto relative">
          <div className="eyebrow text-neon mb-3">Explore</div>
          <h1 className="font-display font-black uppercase text-5xl md:text-7xl leading-none">
            All <span className="text-neon">Kicks</span>
          </h1>
          <p className="font-fa text-muted-foreground mt-3">
            <span className="font-mono-num">{filtered.length}</span> مدل از بهترین برندهای جهان
          </p>

          {/* Search */}
          <form onSubmit={submitSearch} className="mt-6 max-w-xl flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2.5 focus-within:border-neon transition">
            <Search size={16} className="text-muted-foreground" />
            <input
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              placeholder="جستجوی کفش، برند، رنگ..."
              className="bg-transparent outline-none flex-1 text-sm font-fa"
            />
            {localQ && (
              <button type="button" onClick={() => { setLocalQ(""); setParam("q", undefined); }} className="text-muted-foreground hover:text-neon">
                <X size={14} />
              </button>
            )}
            <button type="submit" className="eyebrow bg-neon text-ink px-3 py-1 rounded-full">Go</button>
          </form>

          {/* Quick filters */}
          <div className="flex gap-2 mt-5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {QUICK_FILTERS.map(qf => {
              const Icon = qf.icon;
              const active = quick === qf.id;
              return (
                <button
                  key={qf.id}
                  onClick={() => setQuick(qf.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition ${
                    active ? "bg-neon text-ink border-neon" : "bg-surface border-border hover:border-neon"
                  }`}
                >
                  <Icon size={13} />
                  <span className="font-fa text-xs">{qf.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {brand && (
              <button onClick={() => setParam("brand", undefined)} className="eyebrow bg-neon text-ink px-3 py-1.5 rounded-full inline-flex items-center gap-2">
                {brand} <X size={12} />
              </button>
            )}
            {category && (
              <button onClick={() => setParam("category", undefined)} className="eyebrow bg-neon text-ink px-3 py-1.5 rounded-full inline-flex items-center gap-2">
                {category} <X size={12} />
              </button>
            )}
            {q && (
              <button onClick={() => { setLocalQ(""); setParam("q", undefined); }} className="eyebrow bg-neon-orange text-white px-3 py-1.5 rounded-full inline-flex items-center gap-2">
                "{q}" <X size={12} />
              </button>
            )}
            {sizes.map(sz => (
              <button key={sz} onClick={() => setSizes(s => s.filter(x => x !== sz))} className="eyebrow bg-surface border border-border px-3 py-1.5 rounded-full inline-flex items-center gap-2 font-mono-num">
                Size {sz} <X size={12} />
              </button>
            ))}
            {(brand || category || sizes.length > 0 || q) && (
              <button onClick={clearAll} className="eyebrow text-muted-foreground hover:text-neon px-3 py-1.5">
                Clear all
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-8">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className={`${showFilters ? "fixed inset-0 z-50 bg-ink overflow-auto p-6" : "hidden"} lg:relative lg:block lg:inset-auto lg:p-0 lg:bg-transparent`}>
            <div className="lg:sticky lg:top-28 space-y-7">
              <div className="flex items-center justify-between lg:hidden">
                <h3 className="font-display font-bold text-xl uppercase">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X /></button>
              </div>

              <div>
                <div className="eyebrow text-neon mb-3">Brand</div>
                <div className="space-y-1.5 max-h-64 overflow-auto no-scrollbar">
                  {BRANDS.map(b => {
                    const count = SHOES.filter(s => s.brand === b).length;
                    if (!count) return null;
                    return (
                      <button
                        key={b}
                        onClick={() => setParam("brand", brand === b ? undefined : b)}
                        className={`w-full flex items-center justify-between text-sm py-1.5 px-2 rounded-md transition-colors ${
                          brand === b ? "bg-neon text-ink font-bold" : "hover:bg-surface"
                        }`}
                      >
                        <span>{b}</span>
                        <span className="font-mono-num text-xs opacity-60">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="eyebrow text-neon mb-3">Category</div>
                <div className="space-y-1">
                  <button
                    onClick={() => setParam("category", undefined)}
                    className={`block w-full text-left text-sm py-1.5 px-2 rounded-md ${!category ? "bg-neon text-ink font-bold" : "hover:bg-surface"}`}
                  >
                    All
                  </button>
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setParam("category", c.id)}
                      className={`w-full text-left text-sm py-1.5 px-2 rounded-md flex items-center gap-2 ${category === c.id ? "bg-neon text-ink font-bold" : "hover:bg-surface"}`}
                    >
                      <span>{c.icon}</span> {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="eyebrow text-neon mb-3">Size</div>
                <div className="grid grid-cols-4 gap-2">
                  {ALL_SIZES.map(sz => {
                    const active = sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        onClick={() => setSizes(s => active ? s.filter(x => x !== sz) : [...s, sz])}
                        className={`font-mono-num text-sm py-2 rounded-lg border transition-colors ${
                          active ? "bg-neon text-ink border-neon font-bold" : "border-border hover:border-neon"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="eyebrow text-neon mb-3">Max Price</div>
                <input
                  type="range"
                  min={1000000}
                  max={20000000}
                  step={500000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[--neon]"
                />
                <div className="font-mono-num text-sm text-muted-foreground mt-2">
                  تا {new Intl.NumberFormat("fa-IR").format(maxPrice)} تومان
                </div>
              </div>

              <button onClick={clearAll} className="w-full btn-ghost-neon justify-center">
                Clear All
              </button>
            </div>
          </aside>

          {/* Grid / List */}
          <div>
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden inline-flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2 text-sm"
                >
                  <SlidersHorizontal size={14} /> Filters
                </button>
                <span className="hidden lg:block font-mono-num text-sm text-muted-foreground">
                  {filtered.length} products
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex bg-surface border border-border rounded-full p-1">
                  <button
                    onClick={() => setView("grid")}
                    className={`p-1.5 rounded-full transition ${view === "grid" ? "bg-neon text-ink" : "text-muted-foreground hover:text-foreground"}`}
                    aria-label="Grid view"
                  >
                    <Grid3x3 size={14} />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`p-1.5 rounded-full transition ${view === "list" ? "bg-neon text-ink" : "text-muted-foreground hover:text-foreground"}`}
                    aria-label="List view"
                  >
                    <LayoutList size={14} />
                  </button>
                </div>
                <select
                  value={sort}
                  onChange={(e) => navigate({ search: (p: Record<string, unknown>) => ({ ...p, sort: e.target.value as never }) })}
                  className="bg-surface border border-border rounded-full px-4 py-2 text-sm font-display uppercase tracking-wide outline-none focus:border-neon"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-24 border border-dashed border-border rounded-3xl"
              >
                <div className="text-6xl mb-4">👟</div>
                <h3 className="font-display font-bold text-2xl uppercase">Nothing here</h3>
                <p className="font-fa text-muted-foreground mt-2">هیچ کفشی پیدا نشد. فیلترها رو تغییر بده.</p>
                <button onClick={clearAll} className="btn-hype mt-6">Clear filters</button>
              </motion.div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                {filtered.map((s, i) => <ShoeCard key={s.id} shoe={s} index={i} />)}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((s, i) => <ShoeCard key={s.id} shoe={s} index={i} variant="list" />)}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
