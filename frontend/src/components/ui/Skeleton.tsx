import { cn } from "@/lib/utils";

/** Loading placeholder in the surface tone — no shimmer. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("rounded-xl bg-surface", className)} />;
}

const spinnerClass = "inline-block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-fg-muted";

/**
 * Loading indicator. On its own it is a status with a label; inside text that
 * already says what is loading (and a live region that announces it), pass
 * `decorative` so it is not announced a second time.
 */
export function Spinner({
  className,
  label = "Загрузка",
  decorative = false,
}: {
  className?: string;
  label?: string;
  decorative?: boolean;
}) {
  if (decorative) return <span aria-hidden="true" className={cn(spinnerClass, className)} />;
  return <span role="status" aria-label={label} className={cn(spinnerClass, className)} />;
}
