import { Truck, RotateCcw, ShieldCheck, CreditCard } from "lucide-react";

const items = [
  { icon: Truck, fa: "ارسال رایگان", sub: "بالای ۳ میلیون" },
  { icon: RotateCcw, fa: "بازگشت ۷ روزه", sub: "بدون قید و شرط" },
  { icon: ShieldCheck, fa: "اصالت تضمینی", sub: "۱۰۰٪ اورجینال" },
  { icon: CreditCard, fa: "پرداخت امن", sub: "درگاه رسمی" },
];

export function TrustBadges() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(({ icon: Icon, fa, sub }, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-neon transition-colors">
            <div className="w-12 h-12 rounded-xl bg-neon/10 text-neon flex items-center justify-center shrink-0">
              <Icon size={22} />
            </div>
            <div className="min-w-0">
              <div className="font-fa font-bold text-foreground truncate">{fa}</div>
              <div className="font-fa text-xs text-muted-foreground truncate">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
