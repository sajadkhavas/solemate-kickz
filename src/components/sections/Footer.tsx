import { Instagram, Send, ChevronDown, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Section {
  id: string;
  title: string;
  links: { label: string; to?: string; href?: string }[];
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
      { label: "ارسال و پرداخت", href: "#" },
      { label: "بازگشت کالا", href: "#" },
      { label: "گارانتی اصالت", href: "#" },
      { label: "راهنمای سایز", href: "#" },
      { label: "سوالات متداول", href: "#" },
    ],
  },
  {
    id: "about",
    title: "درباره SOLE",
    links: [
      { label: "درباره ما", to: "/about" },
      { label: "تماس با ما", to: "/about" },
      { label: "فرصت‌های شغلی", href: "#" },
      { label: "همکاری با ما", href: "#" },
    ],
  },
];

function FooterCol({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border md:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 md:py-0 md:pointer-events-none md:mb-4"
      >
        <span className="eyebrow text-neon">{section.title}</span>
        <ChevronDown size={16} className={`md:hidden transition ${open ? "rotate-180" : ""}`} />
      </button>
      <div className="md:!h-auto md:!opacity-100">
        <AnimatePresence initial={false}>
          {(open || typeof window === "undefined") && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden md:!h-auto md:!opacity-100 space-y-2 font-fa text-sm text-muted-foreground pb-4 md:pb-0"
            >
              {section.links.map((l, i) => (
                <li key={i}>
                  {l.to ? (
                    <Link to={l.to} className="hover:text-neon transition-colors">{l.label}</Link>
                  ) : (
                    <a href={l.href} className="hover:text-neon transition-colors">{l.label}</a>
                  )}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
        {/* Always-visible on desktop */}
        <ul className="hidden md:block space-y-2 font-fa text-sm text-muted-foreground">
          {section.links.map((l, i) => (
            <li key={i}>
              {l.to ? (
                <Link to={l.to} className="hover:text-neon transition-colors">{l.label}</Link>
              ) : (
                <a href={l.href} className="hover:text-neon transition-colors">{l.label}</a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer id="about" className="bg-ink border-t-2 border-neon mt-12">
      <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          <div className="pb-6 md:pb-0">
            <Link to="/" className="font-display font-black text-3xl tracking-tighter">
              SOLE<span className="text-neon">.</span>
            </Link>
            <p className="font-fa text-muted-foreground mt-3 text-sm leading-relaxed">
              قدم بعدی تو. بهترین کفش‌های دنیا، یک کلیک فاصله.
            </p>
            <div className="flex gap-2 mt-5">
              <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-neon hover:text-ink hover:border-neon transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" aria-label="Telegram" className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-neon hover:text-ink hover:border-neon transition-colors">
                <Send size={16} />
              </a>
            </div>
          </div>

          {SECTIONS.map((s) => <FooterCol key={s.id} section={s} />)}
        </div>

        <div className="mt-10 pt-6 border-t border-border grid sm:grid-cols-3 gap-4 text-sm font-fa text-muted-foreground">
          <div className="flex items-center gap-2"><MapPin size={14} className="text-neon" /> تهران، خیابان ولیعصر</div>
          <div className="flex items-center gap-2"><Phone size={14} className="text-neon" /><span className="font-mono-num">۰۲۱-۸۸۸۸۸۸۸۸</span></div>
          <div className="flex items-center gap-2"><Mail size={14} className="text-neon" /> hello@sole.shop</div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© ۲۰۲۶ SOLE. تمامی حقوق محفوظ است.</span>
          <span className="font-mono-num tracking-wider">SHAPARAK · ZARINPAL · VISA · MASTERCARD</span>
        </div>
      </div>
    </footer>
  );
}
