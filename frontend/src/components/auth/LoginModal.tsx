import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { X, Send, TerminalSquare } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Skeleton";
import { TelegramLoginButton } from "./TelegramLoginButton";
import { formatNumber } from "@/lib/utils";

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { devLogin, telegramLogin } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: config } = useQuery({ queryKey: ["authConfig"], queryFn: api.authConfig });
  const { data: devUsers } = useQuery({
    queryKey: ["devUsers"],
    queryFn: api.devUsers,
    enabled: open && !!config?.dev_auth_enabled,
  });

  useEffect(() => {
    if (!open) {
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const handleDev = async (userId: number, username?: string) => {
    setBusy(true);
    setError(null);
    try {
      await devLogin(userId, username);
      onClose();
    } catch {
      setError("Не удалось войти. Бэкенд запущен?");
    } finally {
      setBusy(false);
    }
  };

  const handleTelegram = async (user: Record<string, unknown>) => {
    setBusy(true);
    try {
      await telegramLogin(user);
      onClose();
    } catch {
      setError("Telegram-вход не прошёл проверку.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl"
            initial={{ scale: 0.94, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl text-fg-subtle hover:bg-card-hover hover:text-fg"
            >
              <X size={18} />
            </button>

            <div className="mb-1 text-3xl">🐍</div>
            <h2 className="text-xl font-bold text-fg">Вход в Knowledge Hub</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Прогресс, стрик и избранное синхронизируются с ботом по твоему
              Telegram-аккаунту.
            </p>

            {config?.telegram_enabled && (
              <div className="mt-5">
                <TelegramLoginButton
                  botUsername={config.telegram_bot_username}
                  onAuth={handleTelegram}
                />
              </div>
            )}

            {config?.dev_auth_enabled && (
              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                  <TerminalSquare size={14} />
                  Dev-вход (локально)
                </div>
                <div className="space-y-2">
                  {devUsers?.users.slice(0, 6).map((u) => (
                    <button
                      key={u.user_id}
                      disabled={busy}
                      onClick={() => handleDev(u.user_id, u.username ?? undefined)}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-bg-soft px-4 py-2.5 text-left text-sm transition-colors hover:bg-card-hover disabled:opacity-50"
                    >
                      <span className="font-medium text-fg">
                        @{u.username ?? `user_${u.user_id}`}
                      </span>
                      <span className="text-xs text-fg-subtle">
                        {formatNumber(u.xp)} XP
                      </span>
                    </button>
                  ))}
                </div>
                <CustomDevLogin onLogin={handleDev} busy={busy} />
              </div>
            )}

            {!config?.telegram_enabled && (
              <p className="mt-4 flex items-center gap-1.5 text-xs text-fg-subtle">
                <Send size={12} />
                Telegram-вход включится в проде (нужен TELEGRAM_BOT_TOKEN и домен).
              </p>
            )}

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            {busy && (
              <div className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
                <Spinner /> Входим…
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CustomDevLogin({
  onLogin,
  busy,
}: {
  onLogin: (id: number, username?: string) => void;
  busy: boolean;
}) {
  const [id, setId] = useState("");
  return (
    <form
      className="mt-2 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const n = parseInt(id, 10);
        if (!Number.isNaN(n)) onLogin(n);
      }}
    >
      <input
        value={id}
        onChange={(e) => setId(e.target.value)}
        inputMode="numeric"
        placeholder="свой user_id"
        className="h-10 flex-1 rounded-xl border border-border bg-bg-soft px-3 text-sm text-fg outline-none focus:border-primary"
      />
      <Button type="submit" size="md" variant="secondary" disabled={busy || !id}>
        Войти
      </Button>
    </form>
  );
}
