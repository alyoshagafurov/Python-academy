import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, m } from "framer-motion";
import { LogOut, Menu, Search, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/hooks/useLoginModal";
import { useDialog } from "@/hooks/useDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { DURATION, EASE_OUT, useDuration } from "@/lib/motion";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

const links = [
  { to: "/courses", label: "Курсы" },
  { to: "/search", label: "Поиск" },
  { to: "/pro", label: "PRO" },
];

const iconButton = "grid h-11 w-11 place-items-center rounded-xl text-fg transition-colors duration-150 ease-out hover:bg-surface";

export function Navbar() {
  const { user, logout } = useAuth();
  const { open: openLogin } = useLoginModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
          <div className="hidden md:block">
            {user ? (
              <UserMenu user={user} onLogout={logout} />
            ) : (
              <button
                type="button"
                onClick={openLogin}
                className="inline-flex h-11 items-center rounded-xl px-3 text-caption font-medium text-link hover:underline"
              >
                Войти
              </button>
            )}
          </div>
          <Link to="/search" aria-label="Поиск" className={cn(iconButton, "md:hidden")}>
            <Search size={20} aria-hidden="true" />
          </Link>
          <button
            type="button"
            aria-label="Открыть меню"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
            className={cn(iconButton, "md:hidden")}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {menuOpen && (
          <MobileMenu
            user={user}
            onClose={() => setMenuOpen(false)}
            onLogin={openLogin}
            onLogout={logout}
          />
        )}
      </AnimatePresence>
    </header>
  );
}

function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  const name = user.username ? `@${user.username}` : `user_${user.id}`;

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const items = () =>
      Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    items()[0]?.focus();

    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    // ARIA menu pattern: arrows move between items, Escape returns to the button.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (e.key === "Tab") {
        setOpen(false);
        return;
      }
      const list = items();
      if (list.length === 0) return;
      const i = list.indexOf(document.activeElement as HTMLElement);
      const move: Record<string, number> = {
        ArrowDown: (i + 1) % list.length,
        ArrowUp: (i - 1 + list.length) % list.length,
        Home: 0,
        End: list.length - 1,
      };
      if (e.key in move) {
        e.preventDefault();
        list[move[e.key]].focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Меню профиля"
        onClick={() => setOpen((v) => !v)}
        className="grid h-11 w-11 place-items-center rounded-xl"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full border border-line bg-surface text-caption font-semibold text-fg">
          {name.replace("@", "").charAt(0).toUpperCase()}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Профиль"
          className="absolute right-0 top-full mt-1 w-60 overflow-hidden rounded-xl border border-line bg-bg py-1 shadow-popover"
        >
          <p className="truncate px-4 py-2 text-caption text-fg-muted">{name}</p>
          <Link
            role="menuitem"
            to="/dashboard"
            className="flex min-h-11 items-center px-4 text-body text-fg hover:bg-surface"
          >
            Кабинет
          </Link>
          {user.is_admin && (
            <Link
              role="menuitem"
              to="/insights"
              className="flex min-h-11 items-center px-4 text-body text-fg hover:bg-surface"
            >
              Аналитика
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex min-h-11 w-full items-center px-4 text-left text-body text-fg hover:bg-surface"
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}

interface MobileMenuProps {
  user: User | null;
  onClose: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

function MobileMenu({ user, onClose, onLogin, onLogout }: MobileMenuProps) {
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
          <ul role="list">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} onClick={onClose} className={rowClass}>
                  {l.label}
                </NavLink>
              </li>
            ))}
            {user && (
              <li>
                <NavLink to="/dashboard" onClick={onClose} className={rowClass}>
                  Кабинет
                </NavLink>
              </li>
            )}
            {user?.is_admin && (
              <li>
                <NavLink to="/insights" onClick={onClose} className={rowClass}>
                  Аналитика
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        <div className="mt-8 flex flex-col items-start gap-3">
          {user ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="inline-flex min-h-11 items-center gap-2 text-caption text-fg-muted hover:text-fg"
            >
              <LogOut size={16} aria-hidden="true" />
              Выйти
            </button>
          ) : (
            <Button
              size="lg"
              pill
              className="w-full"
              onClick={() => {
                onClose();
                onLogin();
              }}
            >
              Войти через Telegram
            </Button>
          )}
          <ThemeToggle withLabel />
        </div>
      </Container>
    </m.div>,
    document.body,
  );
}
