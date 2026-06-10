import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Check, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { MentorHint } from "@/lib/types";
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

  // First rung on open.
  useEffect(() => {
    void fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-4 overflow-hidden rounded-2xl border border-primary/30 bg-card"
    >
      <div className="flex items-center gap-2 border-b border-border-soft px-4 py-2.5">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary-soft text-primary">
          <GraduationCap size={16} />
        </div>
        <span className="text-sm font-semibold text-fg">Наставник</span>
        {hint && (
          <span className="ml-auto flex items-center gap-1">
            {Array.from({ length: hint.total }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i < hint.rung ? "bg-primary" : "bg-border",
                )}
              />
            ))}
          </span>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <Loader2 size={15} className="animate-spin" /> Думаю, как подсказать…
          </div>
        ) : error ? (
          <p className="text-sm text-amber-500">{error}</p>
        ) : hint ? (
          <>
            <p className="whitespace-pre-line text-fg">{hint.text}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={onTryAgain}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-fg hover:brightness-110"
              >
                <Check size={15} /> Понял, попробую
              </button>
              {hint.can_escalate && (
                <button
                  onClick={fetchNext}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-fg-muted hover:bg-card-hover hover:text-fg"
                >
                  Ещё намёк <ArrowRight size={14} />
                </button>
              )}
            </div>
            {hint.is_solution && !hint.ai_available && (
              <p className="mt-3 text-xs text-fg-subtle">
                Это полный разбор. Перечитай шаги выше — и попробуй похожее сам.
              </p>
            )}
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
