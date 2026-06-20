import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Announcement */}
      <div className="bg-neon text-ink py-2 text-center text-xs font-display font-semibold tracking-wider overflow-hidden">
        <span className="inline-flex items-center gap-6">
          <span>🚚 ارسال رایگان بالای ۳ میلیون</span>
          <span className="opacity-50">·</span>
          <span>۷ روز ضمانت بازگشت 🔄</span>
          <span className="opacity-50">·</span>
          <span>اصالت تضمینی ✓</span>
        </span>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-ink/95 backdrop-blur-xl border-b border-border"
            : "bg-ink/50 backdrop-blur-md"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display font-black text-2xl tracking-tighter flex items-center">
            SOLE<span className="text-neon">.</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-display font-semibold text-sm tracking-wider uppercase">
            <Link to="/" className="hover:text-neon transition-colors">Home</Link>
            <Link to="/products" className="hover:text-neon transition-colors">Shop</Link>
            <Link to="/products" search={{ category: "luxury" } as never} className="hover:text-neon transition-colors">Drops</Link>
            <a href="#brands" className="hover:text-neon transition-colors">Brands</a>
            <a href="#about" className="hover:text-neon transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-1">
            <button className="p-2.5 hover:text-neon transition-colors" aria-label="Search"><Search size={18} /></button>
            <button className="p-2.5 hover:text-neon transition-colors hidden sm:block" aria-label="Account"><User size={18} /></button>
            <button className="p-2.5 hover:text-neon transition-colors relative" aria-label="Cart">
              <ShoppingBag size={18} />
              <span className="absolute -top-0.5 -right-0.5 bg-neon text-ink text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center font-mono-num">3</span>
            </button>
            <button
              className="p-2.5 md:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-border bg-ink">
            <nav className="flex flex-col p-6 gap-4 font-display uppercase tracking-wider">
              <Link to="/" onClick={() => setOpen(false)}>Home</Link>
              <Link to="/products" onClick={() => setOpen(false)}>Shop</Link>
              <a href="#brands" onClick={() => setOpen(false)}>Brands</a>
              <a href="#about" onClick={() => setOpen(false)}>About</a>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
