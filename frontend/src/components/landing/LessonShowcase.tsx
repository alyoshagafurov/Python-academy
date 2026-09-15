import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/*
 * Source: backend/_bot/content/python/beginner/stage_1.json — lesson 5
 * «bool и условия: if / elif / else» (API id 5 in course python_beginner).
 * `association` quoted verbatim with its leading emoji removed; `example`
 * verbatim. Highlighting is pre-tokenised by hand so the home page never
 * loads Shiki; colours are the same --shiki-token-* variables CodeBlock uses.
 */
const LESSON_URL = "/courses/python_beginner/lessons/5";
const ANALOGY = "Условие — светофор: if зелёный — идём, else красный — стоим.";

type Kind = "plain" | "keyword" | "constant" | "string" | "function" | "punct";
type Token = [text: string, kind: Kind];

const CODE: Token[][] = [
  [["age", "plain"], [" = ", "punct"], ["15", "constant"]],
  [["if", "keyword"], [" age ", "plain"], [">=", "punct"], [" ", "plain"], ["18", "constant"], [":", "punct"]],
  [["    ", "plain"], ["print", "function"], ["(", "punct"], ["'взрослый'", "string"], [")", "punct"]],
  [["elif", "keyword"], [" age ", "plain"], [">=", "punct"], [" ", "plain"], ["13", "constant"], [":", "punct"]],
  [["    ", "plain"], ["print", "function"], ["(", "punct"], ["'подросток'", "string"], [")", "punct"]],
  [["else", "keyword"], [":", "punct"]],
  [["    ", "plain"], ["print", "function"], ["(", "punct"], ["'ребёнок'", "string"], [")", "punct"]],
];

/** The branch that actually runs for age = 15 — the one line that matters. */
const RUNS = new Set([3, 4]);

const tokenClass: Record<Kind, string> = {
  plain: "text-[var(--shiki-foreground)]",
  keyword: "text-[var(--shiki-token-keyword)]",
  constant: "text-[var(--shiki-token-constant)]",
  string: "text-[var(--shiki-token-string)]",
  function: "text-[var(--shiki-token-function)]",
  punct: "text-[var(--shiki-token-punctuation)]",
};

export function LessonShowcase() {
  return (
    <figure className="mx-auto w-full max-w-[980px] rounded-3xl bg-surface px-6 py-8 text-left sm:px-10 sm:py-12 md:px-16 md:py-16">
      <figcaption>
        <p className="text-caption text-fg-muted">Аналогия</p>
        <p className="mt-2 max-w-[44ch] text-title3 text-fg">{ANALOGY}</p>
      </figcaption>

      <pre className="mt-8 overflow-x-auto font-mono text-[0.9375rem] leading-[1.75] sm:mt-10 sm:text-body">
        <code className="grid min-w-max">
          {CODE.map((line, i) => (
            <span
              key={i}
              className={cn(
                "-mx-3 flex gap-5 rounded-lg px-3",
                RUNS.has(i) && "bg-surface-hover",
              )}
            >
              <span
                aria-hidden="true"
                className={cn("w-4 select-none text-right tabular", RUNS.has(i) ? "text-fg" : "text-fg-muted")}
              >
                {i + 1}
              </span>
              <span>
                {line.map(([text, kind], j) => (
                  <span key={j} className={tokenClass[kind]}>
                    {text}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </code>
      </pre>

      <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-caption text-fg-muted">
          Вывод: <span className="text-fg">подросток</span>
        </p>
        <Link
          to={LESSON_URL}
          className="inline-flex min-h-11 items-center text-body font-medium text-link hover:underline"
        >
          Открыть урок
        </Link>
      </div>
    </figure>
  );
}
