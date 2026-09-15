import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ExplainView, MentorStyle } from "@/lib/types";
import type { CodeLang } from "@/lib/codeLang";
import { CodeBlock } from "@/components/CodeBlock";
import { Spinner } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/**
 * Adaptive explainer (zero-token). Re-cuts the lesson's own content into the
 * chosen style. "Всё равно непонятно" logs an escalation candidate so we can
 * measure real demand for a future AI explanation — no tokens spent now.
 */
export function AdaptiveExplainer({
  courseId,
  lessonId,
  lang,
}: {
  courseId: string;
  lessonId: number;
  lang: CodeLang;
}) {
  const [styles, setStyles] = useState<MentorStyle[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [view, setView] = useState<ExplainView | null>(null);
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);

  useEffect(() => {
    api.mentorStyles().then((d) => setStyles(d.styles)).catch(() => undefined);
  }, []);

  const pick = async (styleId: string) => {
    setActive(styleId);
    setLoading(true);
    setEscalated(false);
    try {
      setView(await api.mentorExplain(courseId, lessonId, styleId));
    } catch {
      setView(null);
    } finally {
      setLoading(false);
    }
  };

  const notHelpful = () => {
    setEscalated(true);
    api.mentorEvent("explain_not_helpful", courseId, lessonId, { last_style: active });
  };

  return (
    <section className="mt-12" aria-labelledby={`explain-${lessonId}`}>
      <h2 id={`explain-${lessonId}`} className="text-title3 font-semibold text-fg">
        Объяснить проще
      </h2>
      <p className="mt-1 text-body text-fg-muted">Запутался? Объясню эту тему так, как тебе удобнее.</p>

      <div role="group" aria-label="Стиль объяснения" className="mt-4 flex flex-wrap gap-2">
        {styles.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={active === s.id}
            onClick={() => pick(s.id)}
            className={cn(
              "min-h-11 rounded-xl px-4 text-caption font-medium transition-colors duration-150 ease-out active:scale-[0.98]",
              active === s.id
                ? "bg-accent text-accent-fg"
                : "bg-surface text-fg hover:bg-surface-hover",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {loading && (
          <p className="mt-5 flex items-center gap-2 text-body text-fg-muted">
            <Spinner label="Загрузка объяснения" /> Подбираю объяснение…
          </p>
        )}

        {!loading && view && (
          <div className="mt-6 space-y-4 border-t border-line pt-6">
            {view.blocks.map((b, i) =>
              b.kind === "code" ? (
                <CodeBlock key={i} code={b.text} lang={lang} />
              ) : (
                <p key={i} className="whitespace-pre-line text-body leading-[1.65] text-fg">
                  {b.text}
                </p>
              ),
            )}

            {!escalated ? (
              <p className="flex flex-wrap items-center gap-x-3 text-caption">
                <span className="text-fg-muted">Стало понятнее?</span>
                <button
                  type="button"
                  onClick={notHelpful}
                  className="inline-flex min-h-11 items-center font-medium text-link hover:underline"
                >
                  Всё равно непонятно
                </button>
              </p>
            ) : (
              <p className="rounded-xl bg-surface px-5 py-4 text-caption text-fg-muted">
                Спасибо — записал, что тут стоит объяснить глубже. Скоро добавим живое объяснение от
                ИИ-наставника. А пока попробуй другой стиль выше или раздел «Разбор темы».
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
