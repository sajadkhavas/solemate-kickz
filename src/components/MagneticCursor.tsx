import { useEffect, useRef } from "react";

export function MagneticCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isCoarse || prefersReduced || !ringRef.current || !dotRef.current) return;

    document.body.style.cursor = "none";
    document.body.classList.add("has-magnetic-cursor");

    const position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { x: position.x, y: position.y };
    let animationFrame = 0;

    const move = (event: MouseEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${event.clientX - 3}px, ${event.clientY - 3}px, 0)`;
      }
    };

    const tick = () => {
      position.x += (target.x - position.x) * 0.15;
      position.y += (target.y - position.y) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${position.x - 20}px, ${position.y - 20}px, 0)`;
      }
      animationFrame = window.requestAnimationFrame(tick);
    };

    const enter = (event: MouseEvent) => {
      const element = (event.target as HTMLElement | null)?.closest?.("[data-magnetic]");
      if (!element || !ringRef.current) return;
      ringRef.current.style.width = "56px";
      ringRef.current.style.height = "56px";
      ringRef.current.style.borderColor = "#c8f135";
      ringRef.current.style.backgroundColor = "rgba(200,241,53,0.12)";
    };

    const leave = (event: MouseEvent) => {
      const relatedTarget = event.relatedTarget as HTMLElement | null;
      if (relatedTarget?.closest?.("[data-magnetic]")) return;
      if (!ringRef.current) return;
      ringRef.current.style.width = "40px";
      ringRef.current.style.height = "40px";
      ringRef.current.style.borderColor = "rgba(200,241,53,0.55)";
      ringRef.current.style.backgroundColor = "transparent";
    };

    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseover", enter);
    document.addEventListener("mouseout", leave);
    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      document.body.style.cursor = "";
      document.body.classList.remove("has-magnetic-cursor");
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", enter);
      document.removeEventListener("mouseout", leave);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div
      data-foundation-cursor
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90] hidden overflow-hidden [contain:strict] md:block"
    >
      <div
        ref={ringRef}
        className="absolute left-0 top-0 size-10 rounded-full border-2 will-change-transform"
        style={{
          borderColor: "rgba(200,241,53,0.55)",
          transition:
            "width 0.2s ease, height 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
          mixBlendMode: "difference",
        }}
      />
      <div
        ref={dotRef}
        className="absolute left-0 top-0 size-1.5 rounded-full bg-neon will-change-transform"
      />
    </div>
  );
}
