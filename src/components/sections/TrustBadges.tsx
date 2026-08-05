import { Database, LayoutGrid, Ruler, ShoppingBag } from "lucide-react";

const items = [
  {
    icon: Ruler,
    title: "سایز در صفحه محصول",
    description: "سایزهای هر مدل از Dataset فعلی نمایش داده می‌شوند و انتخاب نهایی هنوز نمایشی است.",
  },
  {
    icon: Database,
    title: "قیمت و موجودی نمونه",
    description: "این فاز به Backend، موجودی زنده، پرداخت یا سفارش واقعی متصل نیست.",
  },
  {
    icon: LayoutGrid,
    title: "مسیرهای واقعی رابط",
    description: "کاتالوگ، فیلتر دسته، برند و صفحه محصول به Routeهای موجود پروژه متصل‌اند.",
  },
  {
    icon: ShoppingBag,
    title: "تجربه پایه قابل استفاده",
    description: "محتوای ضروری بدون Hover، بدون 3D و با Reduced Motion در دسترس می‌ماند.",
  },
];

export function TrustBadges() {
  return (
    <section
      data-testid="home-trust"
      aria-labelledby="home-trust-title"
      className="border-b border-border py-[var(--space-section)]"
    >
      <div className="page-container-wide">
        <div className="mb-8 max-w-3xl">
          <p className="eyebrow mb-3 text-neon">COMMERCE CLARITY</p>
          <h2
            id="home-trust-title"
            className="font-fa text-[clamp(2rem,5vw,4rem)] font-black leading-tight"
          >
            قبل از ادامه، وضعیت این نسخه را بدان
          </h2>
          <p className="mt-3 font-fa leading-7 text-muted-foreground">
            به‌جای اعتمادسازی با وعده‌های تأییدنشده، محدودیت‌ها و امکانات واقعی Frontend شفاف
            نمایش داده می‌شوند.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="grid size-11 place-items-center rounded-xl bg-neon/10 text-neon">
                <Icon aria-hidden="true" size={21} />
              </div>
              <h3 className="mt-5 font-fa text-lg font-black leading-7">{title}</h3>
              <p className="mt-2 font-fa text-sm leading-7 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
