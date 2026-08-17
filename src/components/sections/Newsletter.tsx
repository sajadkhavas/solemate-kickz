import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function Newsletter() {
  return (
    <section
      data-testid="home-final-cta"
      aria-labelledby="home-final-cta-title"
      className="relative overflow-hidden bg-neon py-[var(--space-section)] text-ink"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,#0a0a0a_1px,transparent_0)] [background-size:26px_26px]"
      />
      <div className="page-container-wide relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-4xl">
          <p className="eyebrow mb-4 text-ink/65">NEXT STEP</p>
          <h2
            id="home-final-cta-title"
            className="font-fa text-[clamp(2.5rem,7vw,6.5rem)] font-black leading-[1.05] tracking-[-0.04em]"
          >
            از کاتالوگ شروع کن.
          </h2>
          <p className="mt-5 max-w-2xl font-fa text-base leading-8 text-ink/75 sm:text-lg">
            مدل‌ها، دسته‌ها و برندهای موجود را بررسی کن. اطلاعات این نسخه برای ارزیابی تجربه
            Frontend هستند و نباید به‌عنوان پیشنهاد تجاری نهایی تلقی شوند.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <Link
            to="/products"
            search={{ sort: "newest" }}
            data-f3-touch-target="true"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 font-fa font-bold text-white transition-colors hover:bg-surface-elevated"
          >
            ورود به محصولات
            <ArrowLeft aria-hidden="true" size={17} />
          </Link>
          <Link
            to="/brands"
            data-f3-touch-target="true"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/35 px-6 font-fa font-bold text-ink transition-colors hover:bg-ink hover:text-white"
          >
            مشاهده برندها
          </Link>
        </div>
      </div>
    </section>
  );
}
