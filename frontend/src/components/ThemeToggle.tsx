import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Сменить тему"
      className="relative grid h-10 w-10 place-items-center rounded-xl border border-border text-fg-muted transition-colors hover:bg-card-hover hover:text-fg"
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
      </motion.span>
    </button>
  );
}
