import { ChevronDown, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface FooterLink {
  label: string;
  to?: string;
  unavailable?: boolean;
}

interface Section {
  id: string;
  title: string;
  links: FooterLink[];
}

const SECTIONS: Section[] = [
  {
    id: "shop",
    title: "فروشگاه",
    links: [
      { label: "خانه", to: "/" },
      { label: "همه محصولات", to: "/products" },
      { label: "برندها", to: "/brands" },
      { label: "سبد خرید", to: "/cart" },
    ],
  },
  {
    id: "help",
    title: "راهنما",
    links: [
      { label: "ارسال و پرداخت", unavailable: true },
      { label: "بازگشت کالا", unavailable: true },
      { label: "راهنمای سایز", unavailable: true },
      { label: "سوالات متداول", unavailable: true },
    ],
  },
  {
    id: "about",
    title: "درباره SOLE",
    links: [
      { label: "درباره نمونه", to: "/about" },
      { label: "اطلاعات تماس", unavailable: true },
      { label: "فرصت‌های شغلی", unavailable: true },
      { label: "همکاری با ما", unavailable: true },
    ],
  },
];

function FooterItem({ item }: { item: FooterLink }) {
  if (item.to) {
    return (
      <Link to={item.to} className="transition-colors hover:text-neon">
        {item.label}
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground/70" aria-disabled="true">
      {item.label}
      <span className="text-[0.65rem]">به‌زودی</span>
    </span>
  );
}

function FooterCol({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const contentId = `footer-section-${section.id}`;

  return (
    <div className="border-b border-border md:border-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex min-h-11 w-full items-center justify-between py-4 md:hidden"
      >
        <span className="eyebrow text-neon">{section.title}</span>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className={`transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>

      <h2 className="eyebrow mb-4 hidden text-neon md:block">{section.title}</h2>

      <div id={contentId} className="md:hidden">
        <AnimatePresence initial={false}>
          {open ? (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-2 overflow-hidden pb-4 font-fa text-sm text-muted-foreground motion-reduce:transition-none"
            >
              {section.links.map((item) => (
                <li key={item.label}>
                  <FooterItem item={item} />
                </li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>

      <ul className="hidden space-y-2 font-fa text-sm text-muted-foreground md:block">
        {section.links.map((item) => (
          <li key={item.label}>
            <FooterItem item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer id="about" className="mt-12 border-t-2 border-neon bg-ink">
      <div className="mx-auto max-w-[1400px] px-6 py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-2 md:gap-10 lg:grid-cols-4">
          <div className="pb-6 md:pb-0">
            <Link to="/" className="font-display text-3xl font-black tracking-tighter">
              SOLE<span className="text-neon">.</span>
            </Link>
            <p className="mt-3 font-fa text-sm leading-relaxed text-muted-foreground">
              نمونه فرانت‌اند فروشگاه کفش با رابط فارسی و راست‌به‌چپ.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <FooterCol key={section.id} section={section} />
          ))}
        </div>

        <div className="mt-10 flex items-start gap-3 border-t border-border pt-6 font-fa text-sm text-muted-foreground">
          <Info aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-neon" />
          <p>
            نشانی، شماره تماس، شبکه‌های اجتماعی و روش‌های پرداخت پس از تأیید اطلاعات رسمی کسب‌وکار
            نمایش داده می‌شوند.
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-6 py-5 text-xs text-muted-foreground">
          <span>© ۲۰۲۶ SOLE. نمونه نمایشی فرانت‌اند.</span>
          <span>اطلاعات تجاری این نسخه تأیید نشده است.</span>
        </div>
      </div>
    </footer>
  );
}
