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
 *  pages that show no code. */
export function CodeBlock({ code, lang = "python", className }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    import("@/lib/shiki")
      .then(({ highlight }) => highlight(code, lang))
      .then((out) => active && setHtml(out))
      .catch(() => active && setHtml(null));
    return () => {
      active = false;
    };
  }, [code, lang]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const body = "overflow-x-auto px-6 pb-7 pt-2 text-[0.9375rem] leading-[1.75] sm:px-8 sm:pb-8 sm:text-body";

  return (
    <div className={cn("rounded-xl bg-surface", className)}>
      <div className="flex items-center justify-between pl-6 pr-2 pt-2 sm:pl-8">
        <span className="font-mono text-caption text-fg-muted">{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-caption text-fg-muted transition-colors duration-150 ease-out hover:text-fg"
        >
          {copied ? <Check size={16} className="text-success" aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          <span aria-live="polite">{copied ? "Скопировано" : "Копировать"}</span>
        </button>
      </div>
      {html ? (
        <div className={cn("shiki-host shiki-numbered", body)} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className={cn("font-mono text-fg", body)}>{code}</pre>
      )}
    </div>
  );
}
