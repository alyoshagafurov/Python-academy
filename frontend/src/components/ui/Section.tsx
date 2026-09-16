import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: "default" | "surface";
}

/** Home-page rhythm: 80px vertical on mobile, 128px from md. */
export function Section({ tone = "default", className, ...props }: SectionProps) {
  return (
    <section
      className={cn("scroll-mt-14 py-20 md:py-32", tone === "surface" && "bg-surface", className)}
      {...props}
    />
  );
}
