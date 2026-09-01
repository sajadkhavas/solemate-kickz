export function Navbar() {
  return (
    <>
      <div className="border-b border-primary/30 bg-primary text-primary-foreground">
        <p className="mx-auto flex min-h-9 max-w-[1280px] items-center justify-center px-4 text-center font-fa text-[11px] font-semibold sm:text-xs">
          حساب کاربری Production از Backend امن SOLE دریافت می‌شود؛ قابلیت‌های متصل‌نشده fail-closed
          می‌مانند
        </p>
      </div>
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center gap-4 px-[var(--space-page-gutter)]">
          <a
            href="/"
            aria-label="SOLE — خانه"
            className="font-display text-2xl font-black tracking-tighter"
          >
            SOLE<span className="text-primary">.</span>
          </a>
          <nav aria-label="پیمایش حساب" className="ms-auto flex items-center gap-1 font-fa text-sm">
            <a
              href="/products"
              className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] px-3 text-muted-foreground transition-colors hover:bg-interactive hover:text-foreground"
            >
              فروشگاه
            </a>
            <a
              href="/account"
              className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] px-3 text-muted-foreground transition-colors hover:bg-interactive hover:text-foreground"
            >
              حساب من
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}

export { Navbar as ProductionNavbar };
