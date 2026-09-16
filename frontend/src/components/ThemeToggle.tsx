import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

/** Icon button in the navbar; `withLabel` renders a text row for the footer and mobile menu. */
export function ThemeToggle({ withLabel = false, className }: { withLabel?: boolean; className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;
  const action = isDark ? "Светлая тема" : "Тёмная тема";

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-xl text-caption text-fg-muted transition-colors duration-150 ease-out hover:text-fg",
          className,
        )}
      >
        <Icon size={16} aria-hidden="true" />
        {action}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      className={cn(
        "grid h-11 w-11 place-items-center rounded-xl text-fg-muted transition-colors duration-150 ease-out hover:bg-surface hover:text-fg",
        className,
      )}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
