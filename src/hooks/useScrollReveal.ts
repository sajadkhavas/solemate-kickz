import { useRef } from "react";
import { useInView } from "framer-motion";

export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  return { ref, inView };
}
