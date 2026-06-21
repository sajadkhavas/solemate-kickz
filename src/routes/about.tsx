import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck, Truck, Sparkles, Users, Award, Heart, MapPin, Phone, Mail, Instagram, Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { BRANDS, SHOES } from "@/data/shoes";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "درباره SOLE — قصه‌ی ما" },
      { name: "description", content: "ما SOLE هستیم. فروشگاه کفش لوکس و استریت‌ویر برای کسانی که قدم متفاوت برمی‌دارند." },
      { property: "og:title", content: "درباره SOLE" },
      { property: "og:description", content: "قصه‌ی ما، ارزش‌ها و تیم پشت SOLE." },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { icon: ShieldCheck, title: "اصالت ۱۰۰٪", text: "هر جفت کفش از منابع رسمی، با ضمانت بازگشت پول در صورت تقلبی بودن." },
  { icon: Truck, title: "ارسال سریع", text: "سفارش‌ها در ۲۴ ساعت پردازش و در سراسر ایران ارسال می‌شوند." },
  { icon: Sparkles, title: "کیوریشن دقیق", text: "هیچ کفشی بی‌دلیل وارد فروشگاه نمی‌شود. هر مدل یک قصه دارد." },
  { icon: Heart, title: "خدمات بعد از فروش", text: "تیم پشتیبانی ۷ روز هفته در کنار شماست. مشاوره سایز و استایل رایگان." },
];

const STATS = [
  { value: `${SHOES.length}+`, label: "مدل کفش" },
  { value: `${BRANDS.length}`, label: "برند جهانی" },
  { value: "۱۲K+", label: "مشتری راضی" },
  { value: "۴.۹★", label: "امتیاز کاربران" },
];

const TIMELINE = [
  { year: "۱۴۰۰", title: "شروع", text: "SOLE با یک ایده شروع شد: کفش‌های اصل، با قیمت منصفانه، با حس درست." },
  { year: "۱۴۰۱", title: "گسترش", text: "اضافه شدن بیش از ۲۰ برند جهانی و راه‌اندازی سرویس ارسال سراسری." },
  { year: "۱۴۰۲", title: "هایپ", text: "ورود به دنیای کفش‌های لیمیتد و کالاب‌های اختصاصی." },
  { year: "۱۴۰۵", title: "حالا", text: "بیش از ۱۲ هزار خرید موفق و یک کامیونیتی واقعی از sneakerhead‌ها." },
];

function AboutPage() {
  return (
    <div className="bg-ink text-foreground min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative px-6 pt-16 pb-24 overflow-hidden border-b border-border">
        <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,#c8f135_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-neon/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-hype/20 rounded-full blur-3xl" />

        <div className="max-w-[1400px] mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="eyebrow text-neon mb-4">About Us</div>
            <h1 className="font-display font-black uppercase text-5xl md:text-8xl leading-[0.9] tracking-tight">
              ما <span className="text-neon">SOLE</span> هستیم
            </h1>
            <p className="font-fa text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl leading-relaxed">
              یه فروشگاه ساده برای کفش نیستیم. ما یه کامیونیتی هستیم برای کسایی که می‌دونن یه جفت کفش خوب، فقط کفش نیست — یه استایلیه که با خودت حمل می‌کنی.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="btn-hype">فروشگاه را ببین</Link>
              <Link to="/brands" className="btn-ghost-neon">برندها</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-14 border-b border-border">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center p-6 rounded-2xl bg-surface border border-border hover:border-neon transition"
            >
              <div className="font-display font-black text-4xl md:text-5xl text-neon font-mono-num">{s.value}</div>
              <div className="font-fa text-sm text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="px-6 py-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="eyebrow text-neon mb-3">Our Values</div>
          <h2 className="font-display font-black uppercase text-4xl md:text-5xl mb-10">به چی پایبندیم</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="p-6 rounded-2xl bg-surface border border-border hover:border-neon transition group"
                >
                  <div className="w-12 h-12 rounded-xl bg-neon/10 text-neon grid place-items-center mb-4 group-hover:bg-neon group-hover:text-ink transition">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{v.title}</h3>
                  <p className="font-fa text-sm text-muted-foreground leading-relaxed">{v.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 py-20 bg-surface/40 border-y border-border">
        <div className="max-w-[1400px] mx-auto">
          <div className="eyebrow text-neon mb-3">Our Journey</div>
          <h2 className="font-display font-black uppercase text-4xl md:text-5xl mb-10">قصه‌ی ما</h2>
          <div className="relative grid md:grid-cols-4 gap-6">
            <div className="hidden md:block absolute top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon to-transparent" />
            {TIMELINE.map((t, i) => (
              <motion.div
                key={t.year}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <div className="w-3 h-3 rounded-full bg-neon mb-4 relative z-10 shadow-[0_0_0_4px_rgba(200,241,53,0.2)]" />
                <div className="font-mono-num text-neon text-2xl font-bold">{t.year}</div>
                <div className="font-display font-bold mt-1">{t.title}</div>
                <p className="font-fa text-sm text-muted-foreground mt-2 leading-relaxed">{t.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team blurb */}
      <section className="px-6 py-20">
        <div className="max-w-[900px] mx-auto text-center">
          <Users size={36} className="text-neon mx-auto mb-4" />
          <h2 className="font-display font-black uppercase text-3xl md:text-4xl">تیم پشت SOLE</h2>
          <p className="font-fa text-muted-foreground mt-4 leading-relaxed">
            یه تیم کوچیک از sneakerhead‌های واقعی. ما همه‌ی کفش‌هایی رو که می‌فروشیم، اول خودمون می‌پوشیم. به همین سادگی.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2">
            <Award size={18} className="text-neon" />
            <span className="eyebrow text-muted-foreground">Curated with love in Tehran</span>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="px-6 py-16 bg-gradient-to-b from-surface to-ink border-t border-border">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="eyebrow text-neon mb-3">Contact</div>
            <h2 className="font-display font-black uppercase text-4xl md:text-5xl mb-4">در تماس باش</h2>
            <p className="font-fa text-muted-foreground leading-relaxed">
              سوال، پیشنهاد، انتقاد یا فقط یه سلام — ما هستیم.
            </p>
            <div className="mt-6 space-y-3 font-fa">
              <div className="flex items-center gap-3"><MapPin size={18} className="text-neon" /> تهران، خیابان ولیعصر</div>
              <div className="flex items-center gap-3"><Phone size={18} className="text-neon" /><span className="font-mono-num">۰۲۱-۸۸۸۸۸۸۸۸</span></div>
              <div className="flex items-center gap-3"><Mail size={18} className="text-neon" /> hello@sole.shop</div>
            </div>
            <div className="flex gap-2 mt-6">
              <a href="#" className="w-11 h-11 rounded-full bg-surface border border-border grid place-items-center hover:bg-neon hover:text-ink"><Instagram size={18} /></a>
              <a href="#" className="w-11 h-11 rounded-full bg-surface border border-border grid place-items-center hover:bg-neon hover:text-ink"><Send size={18} /></a>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); alert("پیامت رسید! به زودی جواب می‌دیم 🙌"); }}
            className="bg-surface border border-border rounded-2xl p-6 space-y-4"
          >
            <div>
              <label className="eyebrow text-muted-foreground">نام</label>
              <input required className="w-full mt-1 bg-ink border border-border rounded-xl px-4 py-3 outline-none focus:border-neon font-fa" />
            </div>
            <div>
              <label className="eyebrow text-muted-foreground">ایمیل</label>
              <input required type="email" className="w-full mt-1 bg-ink border border-border rounded-xl px-4 py-3 outline-none focus:border-neon font-mono-num" />
            </div>
            <div>
              <label className="eyebrow text-muted-foreground">پیام</label>
              <textarea required rows={4} className="w-full mt-1 bg-ink border border-border rounded-xl px-4 py-3 outline-none focus:border-neon font-fa resize-none" />
            </div>
            <button type="submit" className="btn-hype w-full justify-center">ارسال پیام</button>
          </form>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
