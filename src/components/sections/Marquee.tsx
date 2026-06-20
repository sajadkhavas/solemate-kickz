import { BRANDS } from "@/data/shoes";

export function Marquee() {
  const items = [...BRANDS, ...BRANDS];
  return (
    <div className="bg-neon overflow-hidden py-4 border-y-2 border-ink">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((b, i) => (
          <span key={i} className="font-display font-black text-ink text-2xl uppercase tracking-tight mx-8 inline-flex items-center gap-8">
            {b} <span className="text-ink/40">👟</span>
          </span>
        ))}
      </div>
    </div>
  );
}
