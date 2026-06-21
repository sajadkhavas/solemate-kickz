import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, User, Menu, X, Heart, ChevronDown, Sparkles, Truck, Shield, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore, useCartCount } from "@/store";
import { BRANDS, CATEGORIES, SHOES } from "@/data/shoes";

const TOP_MESSAGES = [
  { icon: Truck, text: "ارسال رایگان بالای ۳ میلیون تومان" },
  { icon: Shield, text: "اصالت ۱۰۰٪ تضمینی — مستقیم از برند" },
  { icon: RefreshCw, text: "۷ روز ضمانت بازگشت بدون قید و شرط" },
  { icon: Sparkles, text: "کد تخفیف SOLE10 برای اولین خرید" },
];

function TopBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % TOP_MESSAGES.length), 3500);
    return () => clearInterval(t);
  }, []);
  const M = TOP_MESSAGES[i];
  const Icon = M.icon;
  return (
    <div className="relative bg-gradient-to-r from-neon via-neon to-[#a8d418] text-ink overflow-hidden">
      <div className="absolute inset-0 opacity-30 mix-blend-overlay [background-image:repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.06)_8px,rgba(0,0,0,0.06)_16px)]" />
      <div className="relative h-9 flex items-center justify-center text-[11px] sm:text-xs font-display font-semibold tracking-wider">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2.5"
          >
            <Icon size={14} strokeWidth={2.5} />
            <span>{M.text}</span>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex gap-1 justify-center pb-1">
        {TOP_MESSAGES.map((_, idx) => (
          <span key={idx} className={`h-[2px] rounded-full transition-all ${idx === i ? "w-6 bg-ink" : "w-1 bg-ink/30"}`} />
        ))}
      </div>
    </div>
  );
}

const MEGA_SHOP = [
  { title: "دسته‌بندی", items: CATEGORIES.slice(0, 6).map((c) => ({ label: c.label, fa: c.fa, to: "/products", search: { category: c.id } })) },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const setCartOpen = useStore((s) => s.setCartOpen);
  const user = useStore((s) => s.user);
  const wishlist = useStore((s) => s.wishlist);
  const cartCount = useCartCount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, searchOpen]);

  const searchResults = query.length > 1
    ? SHOES.filter((s) => `${s.brand} ${s.name} ${s.colorway}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  return (
    <>
      <TopBar />

      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "bg-ink/95 backdrop-blur-xl border-b border-border shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]" : "bg-ink/70 backdrop-blur-md"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Mobile menu */}
          <button className="md:hidden p-2 -ml-2" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>

          <Link to="/" className="font-display font-black text-2xl tracking-tighter flex items-center">
            SOLE<span className="text-neon">.</span>
          </Link>

          {/* Desktop nav with mega menu */}
          <nav className="hidden md:flex items-center gap-1 font-display font-semibold text-sm tracking-wider uppercase">
            <Link to="/" className="px-3 py-2 hover:text-neon transition-colors">Home</Link>

            <div
              onMouseEnter={() => setMegaOpen("shop")}
              onMouseLeave={() => setMegaOpen(null)}
              className="relative"
            >
              <Link to="/products" className="px-3 py-2 hover:text-neon transition-colors inline-flex items-center gap-1">
                Shop <ChevronDown size={12} className={`transition ${megaOpen === "shop" ? "rotate-180" : ""}`} />
              </Link>
              <AnimatePresence>
                {megaOpen === "shop" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[680px]"
                  >
                    <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl grid grid-cols-3 gap-6">
                      <div className="col-span-2 grid grid-cols-2 gap-1">
                        <div className="eyebrow text-neon mb-2 col-span-2">Categories</div>
                        {CATEGORIES.map((c) => (
                          <Link
                            key={c.id}
                            to="/products"
                            search={{ category: c.id } as never}
                            onClick={() => setMegaOpen(null)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-ink group"
                          >
                            <span className="text-lg">{c.icon}</span>
                            <div>
                              <div className="text-xs font-bold group-hover:text-neon transition-colors">{c.label}</div>
                              <div className="text-[10px] text-muted-foreground font-fa">{c.fa}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link
                        to="/products"
                        onClick={() => setMegaOpen(null)}
                        className="relative rounded-xl overflow-hidden bg-gradient-to-br from-neon to-[#7b2fbe] p-4 flex flex-col justify-end min-h-[180px]"
                      >
                        <div className="eyebrow text-ink">New Drop</div>
                        <div className="font-display font-black text-xl text-ink leading-none mt-1">Browse All</div>
                        <div className="text-xs text-ink/80 mt-1 font-mono-num">{SHOES.length} styles</div>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              onMouseEnter={() => setMegaOpen("brands")}
              onMouseLeave={() => setMegaOpen(null)}
              className="relative"
            >
              <Link to="/brands" className="px-3 py-2 hover:text-neon transition-colors inline-flex items-center gap-1">
                Brands <ChevronDown size={12} className={`transition ${megaOpen === "brands" ? "rotate-180" : ""}`} />
              </Link>
              <AnimatePresence>
                {megaOpen === "brands" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[520px]"
                  >
                    <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl">
                      <div className="eyebrow text-neon mb-3">All Brands</div>
                      <div className="grid grid-cols-3 gap-1">
                        {BRANDS.map((b) => (
                          <Link
                            key={b}
                            to="/products"
                            search={{ brand: b } as never}
                            onClick={() => setMegaOpen(null)}
                            className="text-xs font-display font-semibold tracking-wide p-2 rounded-md hover:bg-ink hover:text-neon transition-colors"
                          >
                            {b}
                          </Link>
                        ))}
                      </div>
                      <Link
                        to="/brands"
                        onClick={() => setMegaOpen(null)}
                        className="mt-4 text-xs text-neon hover:underline inline-flex items-center gap-1"
                      >
                        مشاهده همه برندها →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/about" className="px-3 py-2 hover:text-neon transition-colors">About</Link>
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 hover:text-neon transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <Link to="/auth" className="p-2.5 hover:text-neon transition-colors relative" aria-label="Wishlist">
              <Heart size={18} />
              {mounted && wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-neon-orange text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-mono-num">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/auth" className="p-2.5 hover:text-neon transition-colors hidden sm:block" aria-label="Account">
              {user ? <span className="text-xs font-display uppercase">{user.name.split(" ")[0]}</span> : <User size={18} />}
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="p-2.5 hover:text-neon transition-colors relative"
              aria-label="Cart"
            >
              <ShoppingBag size={18} />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-neon text-ink text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-mono-num">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-surface border-r border-border overflow-y-auto md:hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <Link to="/" onClick={() => setOpen(false)} className="font-display font-black text-2xl">
                  SOLE<span className="text-neon">.</span>
                </Link>
                <button onClick={() => setOpen(false)} className="p-2"><X size={20} /></button>
              </div>

              <div className="p-5 space-y-5">
                {/* Quick links */}
                <nav className="space-y-1">
                  {[
                    { to: "/", label: "خانه", en: "Home" },
                    { to: "/products", label: "فروشگاه", en: "Shop" },
                    { to: "/brands", label: "برندها", en: "Brands" },
                    { to: "/about", label: "درباره ما", en: "About" },
                    { to: "/cart", label: "سبد خرید", en: "Cart" },
                    { to: "/auth", label: user ? "حساب من" : "ورود / ثبت‌نام", en: "Account" },
                  ].map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-ink group"
                    >
                      <span className="font-fa text-base">{l.label}</span>
                      <span className="eyebrow text-muted-foreground group-hover:text-neon transition-colors">{l.en} →</span>
                    </Link>
                  ))}
                </nav>

                {/* Categories accordion */}
                <div>
                  <div className="eyebrow text-neon mb-3">Shop by Vibe</div>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((c) => (
                      <Link
                        key={c.id}
                        to="/products"
                        search={{ category: c.id } as never}
                        onClick={() => setOpen(false)}
                        className="relative overflow-hidden rounded-xl border border-border bg-ink p-3 flex items-center gap-2 hover:border-neon group"
                      >
                        <span className="text-xl">{c.icon}</span>
                        <div>
                          <div className="font-display font-bold text-xs group-hover:text-neon transition">{c.label}</div>
                          <div className="text-[10px] text-muted-foreground font-fa">{c.fa}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div>
                  <div className="eyebrow text-neon mb-3">Brands</div>
                  <div className="flex flex-wrap gap-2">
                    {BRANDS.slice(0, 10).map((b) => (
                      <Link
                        key={b}
                        to="/products"
                        search={{ brand: b } as never}
                        onClick={() => setOpen(false)}
                        className="text-xs font-display font-semibold tracking-wide px-3 py-1.5 rounded-full bg-ink border border-border hover:border-neon hover:text-neon"
                      >
                        {b}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border text-xs text-muted-foreground font-fa">
                  پشتیبانی: <span className="font-mono-num text-foreground">۰۲۱-۸۸۸۸۸۸۸۸</span>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-ink/95 backdrop-blur-lg"
          >
            <div className="max-w-2xl mx-auto px-6 pt-20">
              <div className="flex items-center gap-3 border-b-2 border-neon pb-3">
                <Search size={22} className="text-neon" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجو در محصولات..."
                  className="flex-1 bg-transparent text-xl font-fa outline-none placeholder:text-muted-foreground"
                />
                <button onClick={() => { setSearchOpen(false); setQuery(""); }} className="p-2 hover:text-neon">
                  <X size={22} />
                </button>
              </div>
              <div className="mt-6 space-y-2 max-h-[60vh] overflow-y-auto">
                {searchResults.length > 0 ? searchResults.map((s) => (
                  <Link
                    key={s.id}
                    to="/product/$id"
                    params={{ id: String(s.id) }}
                    onClick={() => { setSearchOpen(false); setQuery(""); }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface group"
                  >
                    <img src={s.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="eyebrow text-muted-foreground">{s.brand}</div>
                      <div className="font-display font-bold truncate group-hover:text-neon">{s.name}</div>
                    </div>
                    <div className="font-mono-num text-sm text-neon">
                      {new Intl.NumberFormat("fa-IR").format(s.sale_price ?? s.price)}
                    </div>
                  </Link>
                )) : query.length > 1 ? (
                  <div className="text-center py-12 text-muted-foreground font-fa">نتیجه‌ای پیدا نشد</div>
                ) : (
                  <div>
                    <div className="eyebrow text-muted-foreground mb-3">پیشنهادها</div>
                    <div className="flex flex-wrap gap-2">
                      {["Air Max", "Jordan 1", "Yeezy", "Samba", "Dunk Low"].map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuery(q)}
                          className="text-xs font-display font-semibold px-3 py-1.5 rounded-full bg-surface border border-border hover:border-neon"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { Heart };
