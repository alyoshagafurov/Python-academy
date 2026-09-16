import { useReducedMotion } from "framer-motion";

/** Strong ease-out, mirrors --ease-out in index.css. */
export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

/** Seconds. Everything the stage-1 motion budget allows, nothing more. */
export const DURATION = {
  hero: 0.3,
  reveal: 0.25,
  accordion: 0.22,
  enter: 0.2,
  exit: 0.15,
} as const;

/** Returns a duration picker that collapses to 0 under prefers-reduced-motion,
 *  so appearances become instant rather than merely shorter. */
export function useDuration() {
  const reduce = useReducedMotion();
  return (seconds: number) => (reduce ? 0 : seconds);
}
