import { useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useDialog } from "@/hooks/useDialog";
import { Button } from "@/components/ui/Button";
import { GroupedList, GroupedRow } from "@/components/ui/GroupedList";
import { Spinner } from "@/components/ui/Skeleton";
import { TelegramLoginButton } from "./TelegramLoginButton";
import { DURATION, EASE_OUT, useDuration } from "@/lib/motion";
import { formatNumber } from "@/lib/utils";

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { devLogin, telegramLogin } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  const { data: config } = useQuery({ queryKey: ["authConfig"], queryFn: api.authConfig });
  const { data: devUsers } = useQuery({
    queryKey: ["devUsers"],
    queryFn: api.devUsers,
    enabled: open && !!config?.dev_auth_enabled,
  });

  // Closing clears the last attempt, so the next opening starts clean.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) {
      setError(null);
      setBusy(false);
    }
  }

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

  return createPortal(
    <AnimatePresence>
      {open && (
        <DialogFrame onClose={onClose} titleId={titleId}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-xl text-fg-muted transition-colors duration-150 ease-out hover:bg-surface hover:text-fg"
          >
            <X size={20} aria-hidden="true" />
          </button>

          <h2 id={titleId} className="pr-10 text-title3 font-semibold text-fg">
            Вход в Python Academy
          </h2>
          <p className="mt-2 text-caption text-fg-muted">
            Прогресс, стрик и избранное синхронизируются с ботом по твоему Telegram-аккаунту.
          </p>

          {config?.telegram_enabled && (
            <div className="mt-6">
              <TelegramLoginButton botUsername={config.telegram_bot_username} onAuth={handleTelegram} />
            </div>
          )}

          {config?.dev_auth_enabled && (
            <div className="mt-6">
              <h3 className="text-caption text-fg-muted">Dev-вход (локально)</h3>
              {devUsers && devUsers.users.length > 0 && (
                <GroupedList className="mt-2">
                  {devUsers.users.slice(0, 6).map((u) => (
                    <GroupedRow
                      key={u.user_id}
                      onClick={() => handleDev(u.user_id, u.username ?? undefined)}
                      disabled={busy}
                      trailing={<span className="tabular">{formatNumber(u.xp)} XP</span>}
                    >
                      <span className="block truncate">@{u.username ?? `user_${u.user_id}`}</span>
                    </GroupedRow>
                  ))}
                </GroupedList>
              )}
              <CustomDevLogin onLogin={handleDev} busy={busy} />
            </div>
          )}

          {!config?.telegram_enabled && (
            <p className="mt-6 text-caption text-fg-muted">
              Telegram-вход включится в проде (нужен TELEGRAM_BOT_TOKEN и домен).
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 text-caption text-danger">
              {error}
            </p>
          )}
          {busy && (
            <p role="status" className="mt-4 flex items-center gap-2 text-caption text-fg-muted">
              <Spinner label="Входим" /> Входим…
            </p>
          )}
        </DialogFrame>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function DialogFrame({ onClose, titleId, children }: { onClose: () => void; titleId: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const d = useDuration();
  useDialog(ref, onClose);

  const enter = { duration: d(DURATION.enter), ease: EASE_OUT };
  const exit = { duration: d(DURATION.exit), ease: EASE_OUT };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <m.div
        aria-hidden="true"
        className="absolute inset-0 bg-overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: enter }}
        exit={{ opacity: 0, transition: exit }}
      />
      <m.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[400px] overflow-y-auto rounded-3xl bg-bg p-6 shadow-popover sm:p-8 dark:bg-surface"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1, transition: enter }}
        exit={{ opacity: 0, scale: 0.97, transition: exit }}
      >
        {children}
      </m.div>
    </div>
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
  const inputId = useId();
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const n = parseInt(id, 10);
        if (!Number.isNaN(n)) onLogin(n);
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        user_id
      </label>
      <input
        id={inputId}
        value={id}
        onChange={(e) => setId(e.target.value)}
        inputMode="numeric"
        placeholder="свой user_id"
        className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-bg px-4 text-body text-fg placeholder:text-fg-muted"
      />
      <Button type="submit" variant="secondary" disabled={busy || !id}>
        Войти
      </Button>
    </form>
  );
}
