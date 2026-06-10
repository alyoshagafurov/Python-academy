import { Eye } from "lucide-react";

/**
 * Renders HTML/CSS example code live in a sandboxed iframe so HTML & CSS
 * learners SEE the result, not just read about it (their core motivation).
 */
export function LivePreview({ code }: { code: string }) {
  // Wrap so bare CSS or fragments still render reasonably on a clean page.
  const doc = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Inter,system-ui,sans-serif;margin:14px;color:#14141c;background:#fff;line-height:1.5}
  </style></head><body>${code}</body></html>`;

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border">
      <div className="flex items-center gap-1.5 border-b border-border-soft bg-bg-soft/60 px-4 py-2 text-xs font-semibold text-fg-subtle">
        <Eye size={14} className="text-primary" /> Результат вживую
      </div>
      <iframe
        title="Превью"
        sandbox=""
        srcDoc={doc}
        className="h-48 w-full bg-white"
      />
    </div>
  );
}
