import type { ReactNode } from "react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}

/** Nothing to show yet: one sentence of what happened and one way forward. */
export function EmptyState({ title, text, action, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-xl bg-surface px-6 py-10 text-center", className)}>
      <p className="text-body font-semibold text-fg">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-[46ch] text-caption text-fg-muted">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  onRetry?: () => void;
  title?: string;
  text?: string;
  className?: string;
}

/** API unavailable: name the problem and offer a retry. */
export function ErrorState({
  onRetry,
  title = "Не удалось загрузить данные",
  text = "Сервер не отвечает. Проверь подключение и попробуй ещё раз.",
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn("rounded-xl bg-surface px-6 py-10 text-center", className)}>
      <p className="text-body font-semibold text-fg">{title}</p>
      <p className="mx-auto mt-1 max-w-[46ch] text-caption text-fg-muted">{text}</p>
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" onClick={onRetry}>
            Повторить
          </Button>
        </div>
      )}
    </div>
  );
}
