import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CodeLang } from "@/lib/codeLang";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  lang?: CodeLang;
  className?: string;
}

/** Code on the showcase surface (surface token, 12px radius). Shiki is
 *  imported on demand so it never ships with pages that show no code. */
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

  return (
    <div className={cn("rounded-xl bg-surface", className)}>
      <div className="flex items-center justify-between pl-5 pr-1">
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
        <div
          className="shiki-host shiki-numbered overflow-x-auto px-5 pb-6 text-[0.9375rem] leading-[1.75] sm:px-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto px-5 pb-5 font-mono text-[0.9375rem] leading-[1.7] text-fg">
          {code}
        </pre>
      )}
    </div>
  );
}
