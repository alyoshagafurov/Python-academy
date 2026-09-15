import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { MentorHint } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/**
 * Socratic hint ladder UI. The server owns the rung — each request advances
 * exactly one step, so the learner climbs question → hint → reasoning →
 * solution and can never jump straight to the answer.
 */
export function MentorHintCoach({
  courseId,
  lessonId,
  onTryAgain,
}: {
  courseId: string;
  lessonId: number;
  onTryAgain: () => void;
}) {
  const [hint, setHint] = useState<MentorHint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNext = async () => {
    setLoading(true);
    setError(null);
    try {
      setHint(await api.mentorHint(courseId, lessonId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось получить подсказку.");
    } finally {
      setLoading(false);
    }
  };

  // First rung on open (state is set only when the request settles).
  useEffect(() => {
    let active = true;
    api
      .mentorHint(courseId, lessonId)
      .then((next) => {
        if (active) setHint(next);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof ApiError ? e.message : "Не удалось получить подсказку.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [courseId, lessonId]);

  return (
    <div className="mt-4 rounded-xl bg-surface">
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-line px-5">
        <span className="text-caption font-semibold text-fg">Наставник</span>
        {hint && (
          <span className="flex items-center gap-1.5">
            <span className="sr-only">
              Шаг {hint.rung} из {hint.total}
            </span>
            {Array.from({ length: hint.total }).map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={cn("h-1.5 w-1.5 rounded-full", i < hint.rung ? "bg-accent" : "bg-line")}
              />
            ))}
          </span>
        )}
      </div>

      <div className="p-5" aria-live="polite">
        {loading ? (
          <p className="flex items-center gap-2 text-body text-fg-muted">
            <Spinner label="Загрузка подсказки" /> Думаю, как подсказать…
          </p>
        ) : error ? (
          <p role="alert" className="text-body text-danger">
            {error}
          </p>
        ) : hint ? (
          <>
            <p className="whitespace-pre-line text-body text-fg">{hint.text}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={onTryAgain}>Понял, попробую</Button>
              {hint.can_escalate && (
                <Button variant="secondary" onClick={fetchNext} className="bg-bg hover:bg-surface-hover">
                  Ещё намёк
                </Button>
              )}
            </div>
            {hint.is_solution && !hint.ai_available && (
              <p className="mt-4 text-caption text-fg-muted">
                Это полный разбор. Перечитай шаги выше — и попробуй похожее сам.
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
