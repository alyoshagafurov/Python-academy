import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";
import { formatNumber } from "@/lib/utils";

/** Counts up to `value` when scrolled into view. */
export function CountUp({
  value,
  suffix = "",
  duration = 1.4,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = formatNumber(Math.round(v)) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix, duration]);

  return <span ref={ref}>0{suffix}</span>;
}
