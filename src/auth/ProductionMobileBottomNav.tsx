export function MobileBottomNav() {
  return (
    <nav
      aria-label="پیمایش موبایل حساب"
      className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] grid grid-cols-3 border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <a href="/" className="grid min-h-14 place-items-center font-fa text-xs text-muted-foreground">
        خانه
      </a>
      <a
        href="/products"
        className="grid min-h-14 place-items-center font-fa text-xs text-muted-foreground"
      >
        فروشگاه
      </a>
      <a
        href="/account"
        className="grid min-h-14 place-items-center font-fa text-xs text-foreground"
      >
        حساب
      </a>
    </nav>
  );
}

export { MobileBottomNav as ProductionMobileBottomNav };
