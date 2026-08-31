import { Link, useLocation } from "@tanstack/react-router";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";

import { DesktopNavigation } from "@/components/navigation/DesktopNavigation";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import { SearchDialog } from "@/components/navigation/SearchDialog";
import { SoleLogo } from "@/components/navigation/SoleLogo";
import { IconButton } from "@/components/ui/commerce-primitives";
import { useCartCount, useStore } from "@/store";

import "@/components/navigation/navigation.css";

function DemoDisclosure({ productionCustomerTruth }: { productionCustomerTruth: boolean }) {
  return (
    <div className="border-b border-primary/30 bg-primary text-primary-foreground">
      <p className="mx-auto flex min-h-9 max-w-[1400px] items-center justify-center px-4 text-center font-fa text-[11px] font-semibold sm:text-xs">
        {productionCustomerTruth
          ? "محیط Production — حساب کاربری از Backend امن SOLE دریافت می‌شود و قابلیت‌های متصل‌نشده به‌صورت fail-closed باقی می‌مانند"
          : "نسخه نمایشی فرانت‌اند — جستجو، Wishlist و Account از داده محلی مرورگر استفاده می‌کنند"}
      </p>
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const setCartOpen = useStore((state) => state.setCartOpen);
  const setSearchOpen = useStore((state) => state.setSearchOpen);
  const wishlistCount = useStore((state) => state.wishlist.length);
  const cartCount = useCartCount();
  const productionCustomerTruth =
    import.meta.env.PROD && (location.pathname === "/auth" || location.pathname === "/account");

  useEffect(() => {
    setMounted(true);
    let frame = 0;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => setScrolled(window.scrollY > 16));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const visibleCartCount = mounted ? cartCount : 0;
  const visibleWishlistCount = mounted ? wishlistCount : 0;
  const cartDescriptionId = "desktop-cart-count-description";
  const wishlistDescriptionId = "desktop-wishlist-count-description";

  return (
    <>
      <DemoDisclosure productionCustomerTruth={productionCustomerTruth} />
      <header
        data-testid="global-header"
        data-hydrated={mounted ? "true" : "false"}
        data-scrolled={scrolled ? "true" : "false"}
        className={`sticky top-0 z-[var(--z-sticky)] border-b transition-colors duration-[var(--motion-normal)] motion-reduce:transition-none ${
          scrolled
            ? "border-border-strong bg-background/95 shadow-[var(--shadow-surface)] backdrop-blur-xl"
            : "border-border bg-background/90 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex min-h-16 max-w-[1400px] items-center gap-2 px-3 sm:px-6">
          <MobileNavigation />
          <SoleLogo className="shrink-0" />
          <DesktopNavigation />

          <div className="ms-auto flex shrink-0 items-center gap-1">
            <NotificationCenter />
            <IconButton
              label="بازکردن جستجو"
              variant="ghost"
              data-testid="search-trigger"
              data-search-trigger="true"
              onClick={() => setSearchOpen(true)}
            >
              <Search aria-hidden="true" className="size-5" />
            </IconButton>

            <Link
              to="/wishlist"
              aria-label="علاقه‌مندی‌ها"
              aria-describedby={visibleWishlistCount ? wishlistDescriptionId : undefined}
              data-testid="wishlist-nav-link"
              className="relative hidden size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-interactive hover:text-foreground focus-visible:outline-none sm:inline-flex"
            >
              <Heart aria-hidden="true" className="size-5" />
              {visibleWishlistCount > 0 ? (
                <>
                  <span id={wishlistDescriptionId} className="sr-only">
                    تعداد علاقه‌مندی‌ها: {visibleWishlistCount}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute -end-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-mono-num text-[10px] font-bold text-primary-foreground"
                  >
                    {visibleWishlistCount}
                  </span>
                </>
              ) : null}
            </Link>

            <Link
              to="/account"
              search={{ section: "overview" }}
              aria-label={productionCustomerTruth ? "حساب کاربری" : "حساب کاربری نمایشی"}
              data-testid="account-nav-link"
              className="hidden size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-interactive hover:text-foreground focus-visible:outline-none sm:inline-flex"
            >
              <User aria-hidden="true" className="size-5" />
            </Link>

            <IconButton
              label="Cart"
              aria-describedby={visibleCartCount ? cartDescriptionId : undefined}
              variant="ghost"
              data-testid="cart-trigger"
              data-cart-trigger="true"
              className="relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag aria-hidden="true" className="size-5" />
              {visibleCartCount > 0 ? (
                <>
                  <span id={cartDescriptionId} className="sr-only">
                    تعداد کالاهای سبد: {visibleCartCount}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute -end-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-mono-num text-[10px] font-bold text-primary-foreground"
                  >
                    {visibleCartCount}
                  </span>
                </>
              ) : null}
            </IconButton>
          </div>
        </div>
      </header>
      <SearchDialog />
    </>
  );
}
