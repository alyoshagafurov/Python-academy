import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wand2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { ExplainView, MentorStyle } from "@/lib/types";
import type { CodeLang } from "@/lib/shiki";
import { CodeBlock } from "@/components/CodeBlock";
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
    <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary-soft/30 p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <Wand2 size={18} />
        </div>
        <div>
          <div className="font-semibold text-fg">Запутался?</div>
          <div className="text-sm text-fg-muted">Объясню эту тему так, как тебе удобнее.</div>
        </div>
      </div>

      {/* Style chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {styles.map((s) => (
          <button
            key={s.id}
            onClick={() => pick(s.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
              active === s.id
                ? "border-transparent bg-primary text-primary-fg"
                : "border-border bg-card text-fg-muted hover:bg-card-hover hover:text-fg",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 text-sm text-fg-muted"
          >
            <Loader2 size={15} className="animate-spin" /> Подбираю объяснение…
          </motion.div>
        )}

        {!loading && view && (
          <motion.div
            key={view.style}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 space-y-3 border-t border-primary/20 pt-4"
          >
            {view.blocks.map((b, i) =>
              b.kind === "code" ? (
                <CodeBlock key={i} code={b.text} lang={lang} />
              ) : (
                <p key={i} className="whitespace-pre-line text-fg">
                  {b.text}
                </p>
              ),
            )}

            {!escalated ? (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
                <span className="text-fg-subtle">Стало понятнее?</span>
                <button
                  onClick={notHelpful}
                  className="font-medium text-primary hover:underline"
                >
                  Всё равно непонятно
                </button>
              </div>
            ) : (
              <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-fg-muted">
                Спасибо — записал, что тут стоит объяснить глубже. 🙏 Скоро добавим
                живое объяснение от ИИ-наставника. А пока попробуй другой стиль выше
                или раздел «Разбор темы».
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
