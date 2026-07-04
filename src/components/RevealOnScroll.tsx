import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

type Direction = "up" | "left" | "right" | "scale";

interface Props {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
  threshold?: number;
}

const VARIANTS: Record<Direction, Variants> = {
  up:    { hidden: { opacity: 0, y: 60 },  visible: { opacity: 1, y: 0 } },
  left:  { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 60 },  visible: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1 } },
};

export function RevealOnScroll({ children, delay = 0, direction = "up", className, threshold = 0.15 }: Props) {
  const { ref, inView } = useScrollReveal(threshold);
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={VARIANTS[direction]}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
