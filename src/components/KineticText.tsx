import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";

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
  stagger = 0.06,
  as = "span",
}: Props) {
  const { ref, inView } = useScrollReveal(0.2);
  const items = mode === "chars" ? Array.from(text) : text.split(" ");
  const Wrapper = motion[as] as typeof motion.span;

  return (
    <Wrapper
      ref={ref as never}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
      aria-label={text}
    >
      {items.map((item, i) => (
        <motion.span
          key={i}
          className="inline-block will-change-transform"
          variants={{
            hidden: { opacity: 0, y: "0.6em", rotateX: -60 },
            visible: { opacity: 1, y: 0, rotateX: 0 },
          }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden
        >
          {item}
          {mode === "words" && i < items.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </Wrapper>
  );
}
