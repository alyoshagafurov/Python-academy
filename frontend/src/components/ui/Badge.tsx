import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "primary" | "success" | "accent";
}

const tones = {
  default: "bg-card-hover text-fg-muted border-border",
  primary: "bg-primary-soft text-primary border-transparent",
  success: "bg-success/10 text-success border-transparent",
  accent: "bg-accent/15 text-accent border-transparent",
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
