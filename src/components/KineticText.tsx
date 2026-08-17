import { motion, useReducedMotion } from "framer-motion";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import { motionTransition, motionTransitions } from "@/lib/motion-system";

interface Props {
  text: string;
  mode?: "chars" | "words";
  className?: string;
  delay?: number;
  stagger?: number;
  as?: "span" | "div" | "h1" | "h2" | "h3";
}

export function KineticText({
  text,
  mode = "words",
  className,
  delay = 0,
  stagger = 0.035,
  as = "span",
}: Props) {
  const { ref, inView } = useScrollReveal(0.2);
  const reduced = useReducedMotion();
  const items = mode === "chars" ? Array.from(text) : text.split(" ");
  const Wrapper = motion[as] as typeof motion.span;

  return (
    <Wrapper
      ref={ref as never}
      data-motion="kinetic-text"
      initial={reduced ? false : "hidden"}
      animate={reduced ? "visible" : inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: reduced
            ? { duration: 0 }
            : { staggerChildren: stagger, delayChildren: delay },
        },
      }}
      className={className}
      aria-label={text}
    >
      {items.map((item, index) => (
        <motion.span
          key={`${item}-${index}`}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={motionTransition(reduced, motionTransitions.reveal)}
          aria-hidden="true"
        >
          {item}
          {mode === "words" && index < items.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </Wrapper>
  );
}
