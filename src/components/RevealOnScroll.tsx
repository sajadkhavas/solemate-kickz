import { motion, useReducedMotion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import { motionTransition, motionTransitions } from "@/lib/motion-system";

type Direction = "up" | "left" | "right" | "scale";

interface Props {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
  threshold?: number;
}

const VARIANTS: Record<Direction, Variants> = {
  up: { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -18 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 18 }, visible: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.98 }, visible: { opacity: 1, scale: 1 } },
};

export function RevealOnScroll({
  children,
  delay = 0,
  direction = "up",
  className,
  threshold = 0.15,
}: Props) {
  const { ref, inView } = useScrollReveal(threshold);
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      data-motion="content-reveal"
      initial={reduced ? false : "hidden"}
      animate={reduced ? "visible" : inView ? "visible" : "hidden"}
      variants={VARIANTS[direction]}
      transition={motionTransition(reduced, { ...motionTransitions.reveal, delay })}
      className={className}
    >
      {children}
    </motion.div>
  );
}
