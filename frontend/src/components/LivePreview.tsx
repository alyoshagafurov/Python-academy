/**
 * Renders HTML/CSS example code live in a sandboxed iframe so HTML & CSS
 * learners SEE the result, not just read about it (their core motivation).
 */
export function LivePreview({ code }: { code: string }) {
  // Wrap so bare CSS or fragments still render reasonably on a clean page.
  // System colours (Canvas / CanvasText) keep the result looking like a plain browser page.
  const doc = `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{color-scheme:light}
    html{background:Canvas}
    body{font-family:system-ui,-apple-system,sans-serif;margin:16px;color:CanvasText;line-height:1.5}
  </style></head><body>${code}</body></html>`;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-line">
      <p className="border-b border-line px-5 py-3 text-caption text-fg-muted">Результат</p>
      <iframe title="Результат кода" sandbox="" srcDoc={doc} className="block h-48 w-full" />
    </div>
  );
}
