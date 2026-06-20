import { ArrowRight } from "lucide-react";

export function Newsletter() {
  return (
    <section className="py-24 px-6 bg-neon text-ink relative overflow-hidden">
      <div className="absolute -top-20 -right-20 text-[20rem] opacity-10 animate-spin-slow">👟</div>
      <div className="relative max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="eyebrow opacity-60 mb-3">Newsletter</div>
          <h2 className="font-display font-black uppercase leading-[0.9] text-5xl md:text-7xl">
            First to know.<br />
            Last to miss out.
          </h2>
          <p className="font-fa text-lg mt-5 max-w-md opacity-80">
            اول از همه از دراپ‌های جدید باخبر شو. دسترسی زودهنگام به کلکسیون‌های محدود.
          </p>
        </div>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row gap-3 bg-ink rounded-full p-2 max-w-lg lg:justify-self-end w-full"
        >
          <input
            type="email"
            placeholder="ایمیلت رو وارد کن..."
            className="flex-1 bg-transparent text-white px-5 py-3 outline-none font-fa placeholder:text-white/40"
          />
          <button className="bg-neon text-ink font-display font-bold uppercase tracking-wider px-6 py-3 rounded-full hover:bg-white transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap">
            Subscribe <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </section>
  );
}
