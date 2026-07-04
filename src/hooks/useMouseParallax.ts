import { useEffect, useRef, useState } from "react";

interface ParallaxState {
  rotateX: number;
  rotateY: number;
  lightX: number;
  lightY: number;
}

const ZERO: ParallaxState = { rotateX: 0, rotateY: 0, lightX: 50, lightY: 50 };

/**
 * Tracks the mouse across the window and returns smooth, lerped tilt values.
 * - rotateX: vertical tilt in deg, clamped to ±maxX
 * - rotateY: horizontal tilt in deg, clamped to ±maxY
 * - lightX/lightY: 0-100% used to position a radial-gradient glow
 *
 * Disabled automatically on coarse pointers (touch) and when the user has
 * requested reduced motion.
 */
export function useMouseParallax(maxX = 12, maxY = 18) {
  const [state, setState] = useState<ParallaxState>(ZERO);
  const targetRef = useRef<ParallaxState>(ZERO);
  const currentRef = useRef<ParallaxState>(ZERO);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarse || reduced) return;

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1; // -1..1
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetRef.current = {
        rotateY: nx * maxY,
        rotateX: -ny * maxX,
        lightX: 50 + nx * 25,
        lightY: 50 + ny * 25,
      };
    };

    const onLeave = () => {
      targetRef.current = ZERO;
    };

    const tick = () => {
      const cur = currentRef.current;
      const tgt = targetRef.current;
      const f = 0.08;
      const next: ParallaxState = {
        rotateX: cur.rotateX + (tgt.rotateX - cur.rotateX) * f,
        rotateY: cur.rotateY + (tgt.rotateY - cur.rotateY) * f,
        lightX: cur.lightX + (tgt.lightX - cur.lightX) * f,
        lightY: cur.lightY + (tgt.lightY - cur.lightY) * f,
      };
      currentRef.current = next;
      // Only update React state when values move meaningfully.
      if (
        Math.abs(next.rotateX - cur.rotateX) > 0.01 ||
        Math.abs(next.rotateY - cur.rotateY) > 0.01
      ) {
        setState(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [maxX, maxY]);

  return state;
}
