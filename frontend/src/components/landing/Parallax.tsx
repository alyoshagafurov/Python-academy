import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/** Moves its content vertically as it passes through the viewport — depth on scroll. */
export function Parallax({
  children,
  speed = 60,
  className,
}: {
  children: ReactNode;
  speed?: number; // px of travel
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
