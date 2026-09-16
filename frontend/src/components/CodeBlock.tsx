import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CodeLang } from "@/lib/codeLang";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  lang?: CodeLang;
  className?: string;
}

/** Lesson code in the showcase grammar: surface token, 12px radius, generous
 *  inset and line numbers. Shiki is imported on demand so it never ships with
 *  pages that show no code, and the code is readable as plain monospace until
 *  the highlight arrives. A math calculation keeps the same surface but stays
 *  plain monospace with tabular figures: no highlighter, no line numbers. */
export function CodeBlock({ code, lang = "python", className }: CodeBlockProps) {
  // The highlight is stored with the code it belongs to: the route keeps this
  // instance across lessons, and another lesson's code must never show.
  const [highlighted, setHighlighted] = useState<{ source: string; html: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const isCalc = lang === "math";
  const source = `${lang}\n${code}`;
  const html = !isCalc && highlighted?.source === source ? highlighted.html : null;

  useEffect(() => {
    if (isCalc) return;
    let active = true;
    const start = () => {
      import("@/lib/highlightClient")
        .then(({ highlightOffThread }) => highlightOffThread(code, lang))
        .then((out) => {
          if (active) setHighlighted({ source: `${lang}\n${code}`, html: out });
        })
        .catch(() => undefined); // plain monospace stays on screen
    };
    // The code is already readable in monospace: highlight once the browser is idle,
    // so the highlighter and its worker never compete with the lesson's first paint.
    const idle = typeof window.requestIdleCallback === "function";
    const handle = idle ? window.requestIdleCallback(start, { timeout: 2000 }) : window.setTimeout(start, 300);
    return () => {
      active = false;
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [code, lang, isCalc]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const body = "px-6 pb-7 pt-2 text-[0.9375rem] leading-[1.75] sm:px-8 sm:pb-8 sm:text-body";

  return (
    <div className={cn("rounded-xl bg-surface", className)}>
      <div className="flex items-center justify-between pl-6 pr-2 pt-2 sm:pl-8">
        <span className="font-mono text-caption text-fg-muted">{isCalc ? "" : lang}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Скопировано" : isCalc ? "Копировать расчёт" : "Копировать код"}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-caption text-fg-muted transition-colors duration-150 ease-out hover:text-fg"
        >
          {copied ? <Check size={16} className="text-success" aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          <span aria-live="polite">{copied ? "Скопировано" : "Копировать"}</span>
        </button>
      </div>
      {/* Long lines scroll inside this region on a narrow screen, so it must take keyboard focus (WCAG 2.1.1). */}
      {/* Code is English: lang="en" gives screen readers the right voice inside the Russian page. */}
      <div
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region has to be focusable
        tabIndex={0}
        role="region"
        aria-label={isCalc ? "Расчёт" : `Код, ${lang}`}
        lang={isCalc ? undefined : "en"}
        className="overflow-x-auto rounded-b-xl"
      >
        {isCalc ? (
          <pre className={cn("font-mono text-fg tabular", body)}>{code}</pre>
        ) : html ? (
          <div className={cn("shiki-host shiki-numbered", body)} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className={cn("font-mono text-fg", body)}>{code}</pre>
        )}
      </div>
    </div>
  );
}
