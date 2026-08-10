import type { Transition } from "framer-motion";

type MotionCategory =
  | "feedback"
  | "navigation"
  | "reveal"
  | "product"
  | "cart"
  | "dialog"
  | "storytelling";

type CubicBezier = [number, number, number, number];

export const motionDurations = {
  feedback: 0.14,
  navigation: 0.22,
  reveal: 0.36,
  product: 0.32,
  cart: 0.1,
  dialog: 0.24,
  storytelling: 0.64,
} as const;

export const motionEasings: Record<
  "standard" | "standardOut" | "emphasized" | "emphasizedOut",
  CubicBezier
> = {
  standard: [0.2, 0, 0, 1],
  standardOut: [0, 0, 0, 1],
  emphasized: [0.2, 0.8, 0.2, 1],
  emphasizedOut: [0.16, 1, 0.3, 1],
};

export const motionTransitions: Record<MotionCategory, Transition> = {
  feedback: { duration: motionDurations.feedback, ease: motionEasings.standardOut },
  navigation: { duration: motionDurations.navigation, ease: motionEasings.standard },
  reveal: { duration: motionDurations.reveal, ease: motionEasings.emphasizedOut },
  product: { duration: motionDurations.product, ease: motionEasings.emphasized },
  cart: { duration: motionDurations.cart, ease: motionEasings.standardOut },
  dialog: { duration: motionDurations.dialog, ease: motionEasings.emphasizedOut },
  storytelling: {
    duration: motionDurations.storytelling,
    ease: motionEasings.emphasizedOut,
  },
};

export function motionTransition(reduced: boolean | null, transition: Transition): Transition {
  return reduced ? { duration: 0 } : transition;
}
