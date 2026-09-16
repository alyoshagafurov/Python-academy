import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "plain";
type Size = "md" | "lg";

interface StyleOptions {
  variant?: Variant;
  size?: Size;
  /** Fully rounded — reserved for the single main CTA of a screen. */
  pill?: boolean;
  className?: string;
}

const base =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium " +
  "transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover",
  secondary: "bg-surface text-fg hover:bg-surface-hover",
  plain: "text-link hover:underline",
};

const sizes: Record<Size, string> = {
  md: "h-11 rounded-xl px-5 text-body",
  lg: "h-12 rounded-xl px-7 text-body",
};

export function buttonClasses({ variant = "primary", size = "md", pill, className }: StyleOptions = {}) {
  return cn(
    base,
    variants[variant],
    sizes[size],
    variant === "plain" && "px-1",
    pill && "rounded-full",
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, Omit<StyleOptions, "className"> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, pill, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, pill, className })}
      {...props}
    />
  ),
);
Button.displayName = "Button";

interface ButtonLinkProps extends LinkProps, Omit<StyleOptions, "className"> {}

/** A router link that looks like a button (never nest <Button> inside <Link>). */
export function ButtonLink({ className, variant, size, pill, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, pill, className })} {...props} />;
}
