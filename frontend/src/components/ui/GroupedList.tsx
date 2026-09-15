import type { HTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/** Inset grouped list (iOS Settings): one surface, 12px radius, hairline dividers. */
export function GroupedList({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      className={cn("overflow-hidden rounded-xl bg-surface", className)}
      {...props}
    />
  );
}

interface GroupedRowProps {
  children: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  /** Router link target — renders the row as a link. */
  to?: string;
  /** Renders the row as a button. */
  onClick?: () => void;
  disabled?: boolean;
  current?: boolean;
  pressed?: boolean;
  label?: string;
}

const rowBase = "flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left text-body text-fg";
const rowInteractive =
  "transition-colors duration-150 ease-out hover:bg-surface-hover active:bg-surface-hover " +
  "focus-visible:-outline-offset-2 disabled:pointer-events-none disabled:opacity-40";

export function GroupedRow({
  children,
  leading,
  trailing,
  className,
  to,
  onClick,
  disabled,
  current,
  pressed,
  label,
}: GroupedRowProps) {
  const content = (
    <>
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      {trailing && (
        <span className="flex shrink-0 items-center gap-2 text-caption text-fg-muted">{trailing}</span>
      )}
    </>
  );

  let row: ReactNode;
  if (to) {
    row = (
      <Link
        to={to}
        aria-current={current ? "page" : undefined}
        aria-label={label}
        className={cn(rowBase, rowInteractive, className)}
      >
        {content}
      </Link>
    );
  } else if (onClick) {
    row = (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={pressed}
        aria-label={label}
        className={cn(rowBase, rowInteractive, className)}
      >
        {content}
      </button>
    );
  } else {
    row = <div className={cn(rowBase, className)}>{content}</div>;
  }

  return <li className="border-t border-line first:border-t-0">{row}</li>;
}
