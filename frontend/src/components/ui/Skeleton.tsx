import { cn } from "@/lib/utils";

/** Loading placeholder in the surface tone — no shimmer. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("rounded-xl bg-surface", className)} />;
}

export function Spinner({ className, label = "Загрузка" }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-fg-muted",
        className,
      )}
    />
  );
}
