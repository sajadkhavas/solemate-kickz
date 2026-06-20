import { Instagram, Send } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer id="about" className="bg-ink border-t-2 border-neon">
      <div className="max-w-[1400px] mx-auto px-6 py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Link to="/" className="font-display font-black text-3xl tracking-tighter">
            SOLE<span className="text-neon">.</span>
          </Link>
          <p className="font-fa text-muted-foreground mt-3 text-sm leading-relaxed">
            قدم بعدی تو. بهترین کفش‌های دنیا، یک کلیک فاصله.
          </p>
          <div className="flex gap-2 mt-5">
            <a href="#" className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-neon hover:text-ink transition-colors"><Instagram size={15} /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-neon hover:text-ink transition-colors"><Send size={15} /></a>
          </div>
        </div>

        <div>
          <div className="eyebrow text-neon mb-4">Shop</div>
          <ul className="space-y-2 font-fa text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">خانه</Link></li>
            <li><Link to="/products" className="hover:text-foreground">محصولات</Link></li>
            <li><a href="#brands" className="hover:text-foreground">برندها</a></li>
            <li><a href="#" className="hover:text-foreground">سبد خرید</a></li>
          </ul>
        </div>

        <div>
          <div className="eyebrow text-neon mb-4">Help</div>
          <ul className="space-y-2 font-fa text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">ارسال و پرداخت</a></li>
            <li><a href="#" className="hover:text-foreground">بازگشت کالا</a></li>
            <li><a href="#" className="hover:text-foreground">گارانتی اصالت</a></li>
            <li><a href="#" className="hover:text-foreground">راهنمای سایز</a></li>
          </ul>
        </div>

        <div>
          <div className="eyebrow text-neon mb-4">Contact</div>
          <ul className="space-y-2 font-fa text-sm text-muted-foreground">
            <li>تهران، ولیعصر</li>
            <li className="font-mono-num">۰۲۱-۸۸۸۸۸۸۸۸</li>
            <li>hello@sole.shop</li>
            <li>شنبه تا پنجشنبه ۱۰-۲۲</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© 2026 SOLE. All rights reserved.</span>
          <span className="font-mono-num">SHAPARAK · ZARINPAL · VISA</span>
        </div>
      </div>
    </footer>
  );
}
