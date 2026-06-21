import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingBag, Heart, Grid3x3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore, useCartCount } from "@/store";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const setCartOpen = useStore((s) => s.setCartOpen);
  const wishlist = useStore((s) => s.wishlist);
  const cartCount = useCartCount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = [
    { to: "/", icon: Home, label: "خانه" },
    { to: "/products", icon: Grid3x3, label: "فروشگاه" },
    { to: "/auth", icon: Heart, label: "علاقه", badge: mounted ? wishlist.length : 0 },
    { to: "/auth", icon: Search, label: "حساب", isAccount: true },
  ];

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <>
      <div className="md:hidden h-20" aria-hidden />
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-ink/95 backdrop-blur-xl border-t border-border">
        <div className="grid grid-cols-5 items-end h-16 px-2 max-w-md mx-auto">
          {items.slice(0, 2).map((it) => {
            const Icon = it.icon;
            const active = isActive(it.to);
            return (
              <Link
                key={it.label}
                to={it.to}
                className={`flex flex-col items-center gap-1 py-2 transition-colors ${active ? "text-neon" : "text-muted-foreground"}`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="font-fa text-[10px]">{it.label}</span>
              </Link>
            );
          })}

          {/* Center cart FAB */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex flex-col items-center justify-center -mt-6"
            aria-label="Cart"
          >
            <span className="w-14 h-14 rounded-full bg-neon text-ink grid place-items-center shadow-[0_8px_24px_-6px_rgba(200,241,53,0.6)] ring-4 ring-ink">
              <ShoppingBag size={22} strokeWidth={2.5} />
            </span>
            {mounted && cartCount > 0 && (
              <span className="absolute top-0 right-2 bg-neon-orange text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-mono-num">
                {cartCount}
              </span>
            )}
          </button>

          {items.slice(2).map((it) => {
            const Icon = it.icon;
            const active = isActive(it.to);
            return (
              <Link
                key={it.label}
                to={it.to}
                className={`relative flex flex-col items-center gap-1 py-2 transition-colors ${active ? "text-neon" : "text-muted-foreground"}`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="font-fa text-[10px]">{it.label}</span>
                {"badge" in it && it.badge ? (
                  <span className="absolute top-1 right-2 bg-neon-orange text-white text-[9px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-mono-num">
                    {it.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
