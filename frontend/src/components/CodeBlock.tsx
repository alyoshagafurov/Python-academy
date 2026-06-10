import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { highlight, type CodeLang } from "@/lib/shiki";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  lang?: CodeLang;
  className?: string;
}

export function CodeBlock({ code, lang = "python", className }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    highlight(code, lang)
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
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-bg-soft",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border-soft px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-xs text-fg-subtle">{lang}</span>
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-fg-subtle transition-colors hover:bg-card-hover hover:text-fg"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? "Скопировано" : "Копировать"}
        </button>
      </div>
      {html ? (
        <div
          className="shiki-host overflow-x-auto p-4 text-[0.9rem] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-4 font-mono text-[0.9rem] leading-relaxed text-fg">
          {code}
        </pre>
      )}
    </div>
  );
}
