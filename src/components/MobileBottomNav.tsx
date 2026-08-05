import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingBag, Store, User } from "lucide-react";
import { useEffect, useState } from "react";

import { useCartCount, useStore } from "@/store";

const LINKS = [
  { to: "/", icon: Home, label: "خانه", exact: true },
  { to: "/products", icon: Store, label: "فروشگاه" },
] as const;

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const setCartOpen = useStore((state) => state.setCartOpen);
  const setSearchOpen = useStore((state) => state.setSearchOpen);
  const cartCount = useCartCount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const active = (to: string, exact = false) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const visibleCartCount = mounted ? cartCount : 0;
  const cartDescriptionId = "mobile-cart-count-description";

  return (
    <>
      <div className="h-[calc(4.5rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden="true" />
      <nav
        aria-label="ناوبری پایین موبایل"
        className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-border-strong bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid h-[4.5rem] max-w-md grid-cols-5 items-stretch px-1">
          {LINKS.map((item) => {
            const Icon = item.icon;
            const isActive = active(item.to, "exact" in item ? item.exact : false);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive ? "page" : undefined}
                className="relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-md font-fa text-[10px] text-muted-foreground transition-colors hover:bg-interactive focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-1 h-0.5 w-5 rounded-full bg-primary ${isActive ? "opacity-100" : "opacity-0"}`}
                />
                <Icon aria-hidden="true" className={`size-5 ${isActive ? "text-primary" : ""}`} />
                <span className={isActive ? "font-bold text-foreground" : ""}>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            aria-label="Cart"
            aria-describedby={visibleCartCount ? cartDescriptionId : undefined}
            data-testid="mobile-cart-trigger"
            data-cart-trigger="true"
            onClick={() => setCartOpen(true)}
            className="relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-md font-fa text-[10px] text-muted-foreground transition-colors hover:bg-interactive focus-visible:outline-none"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-elevated)]">
              <ShoppingBag aria-hidden="true" className="size-5" />
            </span>
            {visibleCartCount > 0 ? (
              <>
                <span id={cartDescriptionId} className="sr-only">
                  تعداد کالاهای سبد: {visibleCartCount}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute end-2 top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 font-mono-num text-[10px] font-bold text-white"
                >
                  {visibleCartCount}
                </span>
              </>
            ) : null}
          </button>

          <button
            type="button"
            aria-label="بازکردن جستجو"
            data-testid="mobile-search-trigger"
            data-search-trigger="true"
            onClick={() => setSearchOpen(true)}
            className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-md font-fa text-[10px] text-muted-foreground transition-colors hover:bg-interactive focus-visible:outline-none"
          >
            <Search aria-hidden="true" className="size-5" />
            <span>جستجو</span>
          </button>

          <Link
            to="/auth"
            aria-current={active("/auth") ? "page" : undefined}
            className="relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-md font-fa text-[10px] text-muted-foreground transition-colors hover:bg-interactive focus-visible:outline-none"
          >
            <span
              aria-hidden="true"
              className={`absolute top-1 h-0.5 w-5 rounded-full bg-primary ${active("/auth") ? "opacity-100" : "opacity-0"}`}
            />
            <User
              aria-hidden="true"
              className={`size-5 ${active("/auth") ? "text-primary" : ""}`}
            />
            <span className={active("/auth") ? "font-bold text-foreground" : ""}>حساب</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
