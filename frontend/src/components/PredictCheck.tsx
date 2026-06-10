import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Sparkles, RotateCcw, GraduationCap } from "lucide-react";
import { api } from "@/lib/api";
import type { LessonCheck } from "@/lib/types";
import { CodeBlock } from "@/components/CodeBlock";
import type { CodeLang } from "@/lib/shiki";
import { MentorHintCoach } from "@/components/mentor/MentorHintCoach";
import { cn } from "@/lib/utils";

/**
 * Retrieval-practice step: "predict before you peek" (Make It Stick / Badmaev).
 * On a wrong answer we do NOT reveal the solution — we offer the Socratic
 * mentor instead, so the learner climbs to understanding rather than copying.
 */
export function PredictCheck({
  check,
  lang,
  courseId,
  lessonId,
}: {
  check: LessonCheck;
  lang: CodeLang;
  courseId: string;
  lessonId: number;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [usedMentor, setUsedMentor] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  const correct = picked === check.correct;
  const wrong = picked !== null && !correct;

  useEffect(() => {
    setPicked(null);
    setUsedMentor(false);
    setShowCoach(false);
  }, [check.question, lessonId]);

  const choose = (i: number) => {
    const isCorrect = i === check.correct;
    setPicked(i);
    api.mentorEvent("check_attempt", courseId, lessonId, { correct: isCorrect });
    if (isCorrect && usedMentor) api.mentorEvent("check_recovered", courseId, lessonId);
  };

  const retry = () => {
    setPicked(null);
    setShowCoach(false);
    if (usedMentor) api.mentorEvent("retry_after_hint", courseId, lessonId);
  };

  const openCoach = () => {
    setUsedMentor(true);
    setShowCoach(true);
    api.mentorEvent("mentor_open", courseId, lessonId);
  };

  return (
    <section className="mt-8">
      <div className="overflow-hidden rounded-2xl border border-primary/30 bg-primary-soft/30">
        <div className="flex items-center gap-2 px-5 pt-5 text-sm font-bold uppercase tracking-wide text-primary">
          <Sparkles size={15} /> Угадай, прежде чем смотреть
        </div>
        <div className="px-5 pb-5 pt-2">
          <p className="font-semibold text-fg">{check.question}</p>

          {check.code && (
            <div className="mt-3">
              <CodeBlock code={check.code} lang={lang} />
            </div>
          )}

          <div className="mt-4 grid gap-2">
            {check.options.map((opt, i) => {
              const isCorrect = i === check.correct;
              const isPicked = i === picked;
              const locked = correct; // only lock after the right answer
              return (
                <button
                  key={i}
                  disabled={locked}
                  onClick={() => choose(i)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                    !correct && "border-border bg-card hover:border-primary/50 hover:bg-card-hover",
                    correct && isCorrect && "border-success/50 bg-success/10 text-fg",
                    correct && !isCorrect && "border-border bg-card opacity-50",
                    wrong && isPicked && "border-red-400/50 bg-red-400/10 text-fg",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-md border text-xs font-bold",
                      correct && isCorrect
                        ? "border-success bg-success text-white"
                        : wrong && isPicked
                          ? "border-red-400 bg-red-400 text-white"
                          : "border-border text-fg-subtle",
                    )}
                  >
                    {correct && isCorrect ? (
                      <Check size={13} />
                    ) : wrong && isPicked ? (
                      <X size={13} />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="font-mono">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Correct → reveal + explanation */}
          <AnimatePresence>
            {correct && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-success/30 bg-card p-4"
              >
                <div className="font-semibold text-success">
                  {usedMentor ? "✅ Разобрался — это и есть учёба!" : "✅ В точку!"}
                </div>
                {check.explanation && (
                  <p className="mt-1.5 text-sm text-fg-muted">{check.explanation}</p>
                )}
                <button
                  onClick={() => setPicked(null)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <RotateCcw size={14} /> Ещё раз
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wrong → no answer; offer the Socratic mentor */}
          <AnimatePresence>
            {wrong && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
                  <span className="text-sm font-medium text-fg">🙂 Не сошлось — это нормально.</span>
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={retry}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-fg-muted hover:bg-card-hover hover:text-fg"
                    >
                      Попробовать снова
                    </button>
                    {!showCoach && (
                      <button
                        onClick={openCoach}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-fg hover:brightness-110"
                      >
                        <GraduationCap size={15} /> Разобрать вместе
                      </button>
                    )}
                  </div>
                </div>

                {showCoach && (
                  <MentorHintCoach courseId={courseId} lessonId={lessonId} onTryAgain={retry} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
