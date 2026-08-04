import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Accessibility, Database, Gauge, Info, Languages, Users } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { BRANDS, SHOES } from "@/data/shoes";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "درباره نمونه SOLE" },
      {
        name: "description",
        content: "معرفی وضعیت نمونه فرانت‌اند SOLE و اصول تجربه کاربری آن.",
      },
      { property: "og:title", content: "درباره نمونه SOLE" },
      {
        property: "og:description",
        content: "این نسخه یک نمونه فرانت‌اند است و اطلاعات تجاری آن تأیید نشده است.",
      },
    ],
  }),
  component: AboutPage,
});

const PRINCIPLES = [
  {
    icon: Database,
    title: "داده شفاف",
    text: "محصول، موجودی، قیمت، امتیاز و ادعاهای تجاری باید از منبع معتبر دریافت شوند.",
  },
  {
    icon: Languages,
    title: "فارسی و RTL",
    text: "فارسی و راست‌به‌چپ از ریشه سند و کامپوننت‌ها پشتیبانی می‌شوند.",
  },
  {
    icon: Accessibility,
    title: "دسترسی‌پذیری",
    text: "کیبورد، Focus، Reduced Motion و ساختار معنایی بخشی از تعریف محصول هستند.",
  },
  {
    icon: Gauge,
    title: "عملکرد کنترل‌شده",
    text: "رسانه، انیمیشن و مدل سه‌بعدی نباید مسیر خرید یا محتوای اصلی را مسدود کنند.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-ink text-foreground">
      <Navbar />

      <main className="outline-none">
        <section className="relative overflow-hidden border-b border-border px-6 pb-24 pt-16">
          <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,#c8f135_1px,transparent_0)] [background-size:32px_32px]" />
          <div className="absolute -left-20 -top-20 size-96 rounded-full bg-neon/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 size-96 rounded-full bg-purple-hype/20 blur-3xl" />

          <div className="relative mx-auto max-w-[1400px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="motion-reduce:transform-none"
            >
              <div className="eyebrow mb-4 text-neon">About the prototype</div>
              <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-tight md:text-8xl">
                درباره <span className="text-neon">SOLE</span>
              </h1>
              <p className="mt-6 max-w-2xl font-fa text-lg leading-relaxed text-muted-foreground md:text-xl">
                نسخه فعلی SOLE یک نمونه فرانت‌اند برای تجربه فروشگاه کفش است. هویت تجاری، اطلاعات
                تماس، سیاست‌های فروش، موجودی، پرداخت و ادعاهای اعتماد هنوز به منبع رسمی متصل
                نشده‌اند و نباید واقعی تلقی شوند.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/products" className="btn-hype">
                  مشاهده محصولات نمونه
                </Link>
                <Link to="/brands" className="btn-ghost-neon">
                  مشاهده برندهای نمونه
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section aria-labelledby="demo-data-heading" className="border-b border-border px-6 py-14">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-8 flex max-w-3xl items-start gap-3 rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm text-muted-foreground">
              <Info aria-hidden="true" className="mt-0.5 shrink-0 text-warning" size={20} />
              <div>
                <h2 id="demo-data-heading" className="font-semibold text-foreground">
                  داده‌های این صفحه نمایشی‌اند
                </h2>
                <p className="mt-1">
                  شمارنده‌های زیر فقط اندازه Dataset فعلی پروژه را نشان می‌دهند و آمار فروشگاه،
                  مشتری یا بازار نیستند.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface p-6 text-center">
                <div className="font-mono-num text-4xl font-black text-neon md:text-5xl">
                  {SHOES.length}
                </div>
                <div className="mt-1 font-fa text-sm text-muted-foreground">رکورد محصول نمونه</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-6 text-center">
                <div className="font-mono-num text-4xl font-black text-neon md:text-5xl">
                  {BRANDS.length}
                </div>
                <div className="mt-1 font-fa text-sm text-muted-foreground">برند در داده نمونه</div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="principles-heading" className="px-6 py-20">
          <div className="mx-auto max-w-[1400px]">
            <div className="eyebrow mb-3 text-neon">Frontend principles</div>
            <h2
              id="principles-heading"
              className="mb-10 font-display text-4xl font-black uppercase md:text-5xl"
            >
              اصول این نسخه
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PRINCIPLES.map((principle, index) => {
                const Icon = principle.icon;
                return (
                  <motion.article
                    key={principle.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: index * 0.06 }}
                    className="group rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-neon motion-reduce:transform-none"
                  >
                    <div className="mb-4 grid size-12 place-items-center rounded-xl bg-neon/10 text-neon transition-colors group-hover:bg-neon group-hover:text-ink">
                      <Icon aria-hidden="true" size={22} />
                    </div>
                    <h3 className="font-display text-lg font-bold">{principle.title}</h3>
                    <p className="mt-2 font-fa text-sm leading-relaxed text-muted-foreground">
                      {principle.text}
                    </p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="contact"
          aria-labelledby="contact-heading"
          className="border-t border-border bg-gradient-to-b from-surface to-ink px-6 py-16"
        >
          <div className="mx-auto max-w-[900px] rounded-2xl border border-border bg-surface p-6 text-center md:p-10">
            <Users aria-hidden="true" size={36} className="mx-auto mb-4 text-neon" />
            <h2
              id="contact-heading"
              className="font-display text-3xl font-black uppercase md:text-4xl"
            >
              اطلاعات رسمی کسب‌وکار
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-fa leading-relaxed text-muted-foreground">
              تیم، نشانی، شماره تماس، شبکه‌های اجتماعی و فرم تماس هنوز تأیید یا به سرویس واقعی متصل
              نشده‌اند؛ بنابراین در این نسخه قابلیت نمایشی یا اطلاعات آزمایشی به کاربر ارائه
              نمی‌شود.
            </p>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
