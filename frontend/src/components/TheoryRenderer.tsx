import { cn } from "@/lib/utils";

/**
 * Renders the bot's lightweight theory HTML (<b>, <code>, <i>, escaped tags).
 * Content is authored by us (not user input), so inline HTML is safe to render.
 * Newlines become <br> for readability.
 */
export function TheoryRenderer({ html, className }: { html: string; className?: string }) {
  const withBreaks = (html || "").replace(/\n/g, "<br/>");
  return (
    <div
      className={cn("prose-theory", className)}
      dangerouslySetInnerHTML={{ __html: withBreaks }}
    />
  );
}
