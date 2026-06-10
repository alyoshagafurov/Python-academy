import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_40px_-24px_rgba(0,0,0,0.25)]",
        className,
      )}
      {...props}
    />
  );
}
