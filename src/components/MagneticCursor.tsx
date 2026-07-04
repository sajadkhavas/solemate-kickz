import { useEffect, useRef } from "react";

export function MagneticCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isCoarse || prefersReduced) return;

    document.body.style.cursor = "none";
    document.body.classList.add("has-magnetic-cursor");

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { x: pos.x, y: pos.y };
    let raf = 0;

    const move = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;
      }
    };

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.15;
      pos.y += (target.y - pos.y) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${pos.x - 20}px, ${pos.y - 20}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    const enter = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-magnetic]");
      if (!el || !ringRef.current) return;
      ringRef.current.style.width = "56px";
      ringRef.current.style.height = "56px";
      ringRef.current.style.borderColor = "#c8f135";
      ringRef.current.style.backgroundColor = "rgba(200,241,53,0.12)";
    };

    const leave = (e: MouseEvent) => {
      const rel = (e.relatedTarget as HTMLElement | null);
      if (rel?.closest?.("[data-magnetic]")) return;
      if (!ringRef.current) return;
      ringRef.current.style.width = "40px";
      ringRef.current.style.height = "40px";
      ringRef.current.style.borderColor = "rgba(200,241,53,0.55)";
      ringRef.current.style.backgroundColor = "transparent";
    };

    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseover", enter);
    document.addEventListener("mouseout", leave);
    raf = requestAnimationFrame(tick);

    return () => {
      document.body.style.cursor = "";
      document.body.classList.remove("has-magnetic-cursor");
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", enter);
      document.removeEventListener("mouseout", leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[9999] w-10 h-10 rounded-full border-2 hidden md:block"
        style={{
          borderColor: "rgba(200,241,53,0.55)",
          transition: "width 0.2s ease, height 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
          mixBlendMode: "difference",
        }}
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[9999] w-1.5 h-1.5 rounded-full bg-neon hidden md:block"
      />
    </>
  );
}
