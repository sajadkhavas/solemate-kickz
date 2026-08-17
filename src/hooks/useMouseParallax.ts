import { useEffect, useRef, useState } from "react";

interface ParallaxState {
  rotateX: number;
  rotateY: number;
  lightX: number;
  lightY: number;
}

const ZERO: ParallaxState = { rotateX: 0, rotateY: 0, lightX: 50, lightY: 50 };

/**
 * Event-driven pointer parallax. Unlike the legacy hook, this never owns a
 * perpetual animation loop: at most one RAF is queued per pointer update.
 */
export function useMouseParallax(maxX = 6, maxY = 8, enabled = true) {
  const [state, setState] = useState<ParallaxState>(ZERO);
  const targetRef = useRef<ParallaxState>(ZERO);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) {
      setState(ZERO);
      return;
    }

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches || document.hidden) {
      setState(ZERO);
      return;
    }

    const flush = () => {
      rafRef.current = null;
      if (!document.hidden) setState(targetRef.current);
    };

    const schedule = () => {
      if (rafRef.current === null) rafRef.current = window.requestAnimationFrame(flush);
    };

    const onMove = (event: PointerEvent) => {
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      targetRef.current = {
        rotateY: nx * maxY,
        rotateX: -ny * maxX,
        lightX: 50 + nx * 20,
        lightY: 50 + ny * 20,
      };
      schedule();
    };

    const reset = () => {
      targetRef.current = ZERO;
      schedule();
    };

    const onVisibility = () => {
      if (document.hidden) reset();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", reset);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, maxX, maxY]);

  return state;
}
