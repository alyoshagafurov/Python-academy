import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, LogOut, LayoutDashboard, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/hooks/useLoginModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/courses", label: "Курсы" },
  { to: "/search", label: "Поиск" },
  { to: "/pro", label: "PRO" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { open } = useLoginModal();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-xl">🐍</span>
          <span className="hidden sm:inline">
            Python <span className="text-primary">Knowledge Hub</span>
          </span>
        </Link>

        <div className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "text-fg" : "text-fg-muted hover:text-fg",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate("/search")}
            aria-label="Поиск"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border text-fg-muted transition-colors hover:bg-card-hover hover:text-fg sm:hidden"
          >
            <Search size={18} />
          </button>
          <ThemeToggle />

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="secondary" size="md" onClick={() => navigate("/dashboard")}>
                <LayoutDashboard size={16} />
                Кабинет
              </Button>
              <button
                onClick={logout}
                aria-label="Выйти"
                className="grid h-10 w-10 place-items-center rounded-xl border border-border text-fg-muted hover:bg-card-hover hover:text-fg"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Button className="hidden md:inline-flex" onClick={open}>
              Войти
            </Button>
          )}

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Меню"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border text-fg-muted md:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="border-t border-border bg-bg md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted hover:bg-card-hover hover:text-fg"
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="mt-2 flex gap-2">
                {user ? (
                  <>
                    <Button
                      className="flex-1"
                      variant="secondary"
                      onClick={() => {
                        navigate("/dashboard");
                        setMobileOpen(false);
                      }}
                    >
                      <LayoutDashboard size={16} /> Кабинет
                    </Button>
                    <Button variant="outline" onClick={logout}>
                      <LogOut size={16} />
                    </Button>
                  </>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      open();
                      setMobileOpen(false);
                    }}
                  >
                    Войти через Telegram
                  </Button>
                )}
              </div>
              {user?.is_pro ? null : (
                <button
                  onClick={() => {
                    navigate("/pro");
                    setMobileOpen(false);
                  }}
                  className="mt-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-accent"
                >
                  <Crown size={15} /> Открыть PRO
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
