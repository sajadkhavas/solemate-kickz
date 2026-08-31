export function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-[var(--space-page-gutter)] py-8 font-fa text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>ورود، نشست و اطلاعات حساب در Production توسط Backend SOLE مدیریت می‌شوند.</p>
        <a href="/" className="inline-flex min-h-11 items-center text-foreground hover:text-primary">
          بازگشت به فروشگاه
        </a>
      </div>
    </footer>
  );
}
