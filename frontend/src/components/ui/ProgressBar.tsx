import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0..100
  className?: string;
  color?: string; // custom accent
  height?: number;
}

export function ProgressBar({ value, className, color, height = 8 }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-border-soft", className)}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{
          background: color
            ? `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 70%, white))`
            : "linear-gradient(90deg, var(--primary), color-mix(in oklab, var(--primary) 60%, var(--accent)))",
        }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
