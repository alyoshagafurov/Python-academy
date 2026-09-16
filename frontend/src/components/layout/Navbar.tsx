import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, m } from "framer-motion";
import { Menu, Search, X } from "lucide-react";
import { useDialog } from "@/hooks/useDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Container } from "@/components/ui/Container";
import { DURATION, EASE_OUT, useDuration } from "@/lib/motion";
import { cn } from "@/lib/utils";

const links = [
  { to: "/courses", label: "Курсы" },
  { to: "/search", label: "Поиск" },
  { to: "/pro", label: "PRO" },
];

const iconButton = "grid h-11 w-11 place-items-center rounded-xl text-fg transition-colors duration-150 ease-out hover:bg-surface";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Navigating closes the mobile menu (adjusted during render, not in an effect).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-nav backdrop-blur-[20px] backdrop-saturate-[180%]">
      <Container size="wide" className="flex h-[52px] items-center gap-6">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center text-body font-semibold tracking-tight text-fg"
        >
          Python Academy
        </Link>

        <nav aria-label="Основная навигация" className="hidden items-center md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "inline-flex h-11 items-center rounded-xl px-3 text-caption transition-colors duration-150 ease-out",
                  isActive ? "text-fg" : "text-fg-muted hover:text-fg",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link to="/search" aria-label="Поиск" className={cn(iconButton, "md:hidden")}>
            <Search size={20} aria-hidden="true" />
          </Link>
          <button
            type="button"
            aria-label="Открыть меню"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? "mobile-menu" : undefined}
            onClick={() => setMenuOpen(true)}
            className={cn(iconButton, "md:hidden")}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>
    </header>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const d = useDuration();
  useDialog(panelRef, onClose);

  const rowClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex min-h-14 items-center border-b border-line text-title3 font-semibold",
      isActive ? "text-fg" : "text-fg-muted",
    );

  return createPortal(
    <m.div
      ref={panelRef}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Меню"
      className="fixed inset-0 z-50 flex origin-top flex-col overflow-y-auto bg-bg md:hidden"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: d(DURATION.enter), ease: EASE_OUT } }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: d(DURATION.exit), ease: EASE_OUT } }}
    >
      <Container size="wide" className="flex h-[52px] shrink-0 items-center justify-between">
        <Link
          to="/"
          onClick={onClose}
          className="inline-flex min-h-11 items-center text-body font-semibold tracking-tight text-fg"
        >
          Python Academy
        </Link>
        <button type="button" data-autofocus aria-label="Закрыть меню" onClick={onClose} className={iconButton}>
          <X size={22} aria-hidden="true" />
        </button>
      </Container>

      <Container size="wide" className="flex flex-1 flex-col pb-10 pt-4">
        <nav aria-label="Разделы">
          <ul>
            {links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} onClick={onClose} className={rowClass}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8 flex flex-col items-start gap-3">
          <ThemeToggle withLabel />
        </div>
      </Container>
    </m.div>,
    document.body,
  );
}
