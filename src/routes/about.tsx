import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Database, Layers3, ShieldCheck, Sparkles } from "lucide-react";

import heroShoe from "@/assets/hero-shoe.jpg";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "درباره SOLE — نمونه فرانت‌اند فروشگاه کفش" },
      {
        name: "description",
        content: "معرفی صادقانه نمونه فرانت‌اند SOLE، محدوده فعلی پروژه و اصول تجربه کاربری آن.",
      },
      { property: "og:title", content: "درباره SOLE" },
      {
        property: "og:description",
        content: "SOLE در وضعیت فعلی یک نمونه فرانت‌اند است و هنوز به زیرساخت تجاری متصل نیست.",
      },
    ],
  }),
  component: AboutPage,
});

const PRINCIPLES = [
  {
    icon: Database,
    title: "داده قابل ردیابی",
    text: "محصول، قیمت، موجودی، امتیاز و هر ادعای تجاری باید از یک منبع معتبر و قابل جایگزینی دریافت شود.",
  },
  {
    icon: ShieldCheck,
    title: "اعتماد بدون ادعا",
    text: "تا زمانی که کسب‌وکار، سیاست‌ها و سرویس‌های واقعی تأیید نشده‌اند، رابط کاربری آن‌ها را واقعی نمایش نمی‌دهد.",
  },
  {
    icon: Layers3,
    title: "تجربه محصول‌محور",
    text: "هویت بصری پرانرژی است، اما خوانایی، دسترسی‌پذیری و مسیر کشف محصول همیشه اولویت دارند.",
  },
] as const;

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="outline-none">
        <section className="border-b border-border px-[var(--space-page-gutter)] py-12 md:py-20">
          <div className="mx-auto grid max-w-[96rem] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
            <div className="max-w-3xl">
              <div className="eyebrow mb-4 inline-flex items-center gap-2 text-primary">
                <Sparkles aria-hidden="true" className="size-4" />
                Frontend prototype
              </div>
              <h1 className="font-display text-[length:var(--text-h1)] font-black leading-[1.05] tracking-tight">
                SOLE؛ یک تجربه نمایشی برای کشف کفش
              </h1>
              <p className="mt-6 max-w-2xl font-fa text-lg leading-8 text-muted-foreground">
                نسخه فعلی SOLE یک نمونه فرانت‌اند فارسی و راست‌به‌چپ است. این Repository هنوز به
                سرویس واقعی فروش، حساب کاربری، پرداخت، ارسال یا پشتیبانی متصل نشده و نباید به‌عنوان
                یک فروشگاه فعال تلقی شود.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/products">
                    مشاهده کاتالوگ نمونه
                    <ArrowLeft aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/brands">مرور برندهای Dataset</Link>
                </Button>
              </div>
            </div>

            <figure className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-[var(--shadow-elevated)]">
              <div className="aspect-[4/3] overflow-hidden bg-interactive">
                <img
                  src={heroShoe}
                  alt="نمای نزدیک یک کفش در فضای تصویری نمونه SOLE"
                  width={1200}
                  height={900}
                  className="h-full w-full object-cover"
                />
              </div>
              <figcaption className="border-t border-border px-5 py-4 font-fa text-sm leading-6 text-muted-foreground">
                تصویر بخشی از رسانه محلی Repository است و صرفاً جهت معرفی زبان بصری نمونه استفاده
                می‌شود.
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          aria-labelledby="about-status-heading"
          className="px-[var(--space-page-gutter)] py-[var(--space-section)]"
        >
          <div className="mx-auto max-w-[80rem]">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <div className="eyebrow mb-3 text-primary">Current status</div>
                <h2
                  id="about-status-heading"
                  className="font-display text-[length:var(--text-h2)] font-black leading-tight"
                >
                  این نسخه چه چیزی را اثبات می‌کند؟
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-[var(--radius-xl)] border border-border bg-surface p-[var(--space-card)]">
                  <h3 className="text-lg font-bold">آنچه موجود است</h3>
                  <ul className="mt-4 space-y-3 font-fa text-sm leading-7 text-muted-foreground">
                    <li>رابط کاربری فروشگاه کفش با داده نمایشی Repository</li>
                    <li>زبان فارسی، جهت RTL و پشتیبانی از محتوای ترکیبی</li>
                    <li>مسیرهای کشف محصول، برندها و صفحات پشتیبان فرانت‌اند</li>
                  </ul>
                </article>
                <article className="rounded-[var(--radius-xl)] border border-border bg-surface p-[var(--space-card)]">
                  <h3 className="text-lg font-bold">آنچه هنوز موجود نیست</h3>
                  <ul className="mt-4 space-y-3 font-fa text-sm leading-7 text-muted-foreground">
                    <li>هویت تجاری و اطلاعات تماس تأییدشده</li>
                    <li>Backend احراز هویت، سفارش، پرداخت یا پشتیبانی</li>
                    <li>سیاست قطعی ارسال، بازگشت، حریم خصوصی یا شرایط استفاده</li>
                  </ul>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="about-principles-heading"
          className="border-y border-border bg-surface/40 px-[var(--space-page-gutter)] py-[var(--space-section)]"
        >
          <div className="mx-auto max-w-[80rem]">
            <div className="max-w-2xl">
              <div className="eyebrow mb-3 text-primary">Design principles</div>
              <h2
                id="about-principles-heading"
                className="font-display text-[length:var(--text-h2)] font-black leading-tight"
              >
                سه اصل برای ادامه توسعه
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {PRINCIPLES.map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-[var(--radius-xl)] border border-border bg-background p-[var(--space-card)]"
                >
                  <div className="mb-5 grid size-12 place-items-center rounded-[var(--radius-lg)] bg-primary/10 text-primary">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="mt-3 font-fa text-sm leading-7 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="contact"
          aria-labelledby="about-contact-heading"
          className="px-[var(--space-page-gutter)] py-[var(--space-section)]"
        >
          <div className="mx-auto max-w-[40rem] rounded-[var(--radius-xl)] border border-warning/40 bg-warning/5 p-6 text-center md:p-10">
            <h2 id="about-contact-heading" className="text-2xl font-bold">
              راه ارتباط رسمی هنوز ثبت نشده است
            </h2>
            <p className="mt-4 font-fa leading-7 text-muted-foreground">
              Repository در حال حاضر نشانی، ایمیل، شماره تماس یا شبکه اجتماعی تأییدشده‌ای ارائه
              نمی‌کند. به همین دلیل هیچ اطلاعات آزمایشی یا فرم ارسال نمایشی در این صفحه قرار نگرفته
              است.
            </p>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
