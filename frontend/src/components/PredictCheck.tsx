import { useEffect, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { api } from "@/lib/api";
import type { LessonCheck } from "@/lib/types";
import type { CodeLang } from "@/lib/codeLang";
import { CodeBlock } from "@/components/CodeBlock";
import { MentorHintCoach } from "@/components/mentor/MentorHintCoach";
import { Button } from "@/components/ui/Button";
import { GroupedList, GroupedRow } from "@/components/ui/GroupedList";
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
    <section className="mt-12" aria-labelledby={`check-${lessonId}`}>
      <p className="text-caption text-fg-muted">Угадай, прежде чем смотреть</p>
      <h2 id={`check-${lessonId}`} className="mt-1 text-title3 font-semibold text-fg">
        {check.question}
      </h2>

      {check.code && <CodeBlock code={check.code} lang={lang} className="mt-4" />}

      <GroupedList className="mt-4" aria-label="Варианты ответа">
        {check.options.map((opt, i) => {
          const isCorrect = i === check.correct;
          const isPicked = i === picked;
          const showRight = correct && isCorrect;
          const showWrong = wrong && isPicked;
          return (
            <GroupedRow
              key={i}
              onClick={() => choose(i)}
              disabled={correct}
              pressed={isPicked}
              className={cn(showRight && "disabled:opacity-100")}
              leading={
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full border text-caption",
                    showRight
                      ? "border-success text-success"
                      : showWrong
                        ? "border-danger text-danger"
                        : "border-line text-fg-muted",
                  )}
                  aria-hidden="true"
                >
                  {showRight ? <Check size={16} strokeWidth={2.5} /> : showWrong ? <X size={16} strokeWidth={2.5} /> : String.fromCharCode(65 + i)}
                </span>
              }
              trailing={
                showRight ? <span className="text-fg">Верно</span> : showWrong ? <span className="text-fg">Неверно</span> : null
              }
            >
              <span className="font-mono">{opt}</span>
            </GroupedRow>
          );
        })}
      </GroupedList>

      <div aria-live="polite">
        {/* Correct → reveal + explanation */}
        {correct && (
          <div className="mt-4 rounded-xl bg-surface p-5">
            <p className="flex items-center gap-2 text-body font-semibold text-fg">
              <Check size={18} strokeWidth={2.5} className="text-success" aria-hidden="true" />
              {usedMentor ? "Разобрался — это и есть учёба!" : "В точку!"}
            </p>
            {check.explanation && <p className="mt-2 text-body text-fg-muted">{check.explanation}</p>}
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-body font-medium text-link hover:underline"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Ещё раз
            </button>
          </div>
        )}

        {/* Wrong → no answer; offer the Socratic mentor */}
        {wrong && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="mr-auto text-body text-fg">Не сошлось — это нормально.</p>
              <Button variant="secondary" onClick={retry}>
                Попробовать снова
              </Button>
              {!showCoach && <Button onClick={openCoach}>Разобрать вместе</Button>}
            </div>
            {showCoach && <MentorHintCoach courseId={courseId} lessonId={lessonId} onTryAgain={retry} />}
          </div>
        )}
      </div>
    </section>
  );
}
