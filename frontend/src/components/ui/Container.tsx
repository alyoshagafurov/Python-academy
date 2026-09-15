import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const widths = {
  narrow: "max-w-[680px]",
  text: "max-w-[760px]",
  default: "max-w-[1080px]",
  wide: "max-w-[1200px]",
} as const;

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof widths;
}

/** Centered column with the page gutter (16px mobile, 24px from sm). */
export function Container({ size = "default", className, ...props }: ContainerProps) {
  return <div className={cn("mx-auto w-full px-4 sm:px-6", widths[size], className)} {...props} />;
}
