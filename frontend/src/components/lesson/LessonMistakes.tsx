import { useState } from "react";
import { m } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { TheoryRenderer } from "@/components/TheoryRenderer";
import { DURATION, EASE_OUT, useDuration } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * «Частые ошибки», collapsed by default to reduce overwhelm. Its open state lives
 * here, not in LessonPage, so toggling re-renders only this list (a page-level
 * state made the tap take ~400 ms on a throttled phone). Key it by lesson.
 */
export function LessonMistakes({ mistakes }: { mistakes: string[] }) {
  const [open, setOpen] = useState(false);
  const d = useDuration();

  return (
    <div className="mt-12 border-y border-line">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? "lesson-mistakes" : undefined}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-14 w-full items-center gap-3 text-left"
        >
          <span className="flex-1 text-body font-semibold text-fg">Частые ошибки</span>
          <span className="text-caption text-fg-muted tabular">{mistakes.length}</span>
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={cn("shrink-0 text-fg-muted transition-transform duration-200 ease-out", open && "rotate-180")}
          />
        </button>
      </h2>
      {open && (
        <m.ul
          id="lesson-mistakes"
          className="space-y-3 pb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: d(DURATION.accordion), ease: EASE_OUT }}
        >
          {mistakes.map((mistake, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-fg-muted" />
              <TheoryRenderer html={mistake} />
            </li>
          ))}
        </m.ul>
      )}
    </div>
  );
}
