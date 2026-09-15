import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0..100
  className?: string;
  label?: string;
}

/** 2px line: hairline track, accent fill. Static — progress is never animated. */
export function ProgressBar({ value, className, label = "Прогресс" }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
      className={cn("h-0.5 w-full overflow-hidden rounded-full bg-line", className)}
    >
      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}
