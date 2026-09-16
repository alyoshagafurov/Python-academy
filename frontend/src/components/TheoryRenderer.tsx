import { useMemo } from "react";
import { sanitizeLessonHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

/**
 * Renders the bot's lightweight lesson HTML (<b>, <code>, <i>, escaped tags).
 * Newlines become <br>. The result is sanitized with an allowlist of exactly
 * those tags, so nothing interactive can reach the page even if content changes.
 */
export function TheoryRenderer({ html, className }: { html: string; className?: string }) {
  const safe = useMemo(() => sanitizeLessonHtml((html || "").replace(/\n/g, "<br/>")), [html]);
  return <div className={cn("prose-theory", className)} dangerouslySetInnerHTML={{ __html: safe }} />;
}
