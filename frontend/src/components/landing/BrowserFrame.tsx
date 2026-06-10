import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wand2, Check } from "lucide-react";

/** A realistic app/browser window frame — gives the mock depth & polish. */
export function BrowserFrame({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="gradient-ring overflow-hidden rounded-2xl border border-border bg-card shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-2 border-b border-border-soft bg-bg-soft/60 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex-1 truncate rounded-md bg-card-hover px-3 py-1 text-center text-[11px] text-fg-subtle">
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * Interactive lesson preview: the "Объяснить проще" button actually works,
 * toggling the analogy between a formal definition and a plain-language one.
 * A live mini-demo right in the hero — the 2026 product-first pattern.
 */
export function LessonPreviewBody() {
  const [simple, setSimple] = useState(false);

  return (
    <div className="p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
          Переменные
        </span>
        <span className="ml-auto text-xs text-fg-subtle">Тема 2 · Python Beginner</span>
      </div>
      <h3 className="mt-3 text-lg font-bold text-fg">Переменные и комментарии</h3>

      {/* Analogy box — crossfades between formal & simple */}
      <div className="mt-3 min-h-[76px] rounded-xl border border-primary/25 bg-primary-soft/50 p-3 text-sm">
        <AnimatePresence mode="wait">
          {simple ? (
            <motion.p
              key="simple"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-fg"
            >
              <span className="font-semibold text-primary">🔗 Проще. </span>
              Переменная — это <b>коробка с наклейкой</b> 📦. Кладёшь значение, берёшь по имени.
            </motion.p>
          ) : (
            <motion.p
              key="formal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-fg-muted"
            >
              <span className="font-semibold text-primary">💡 Аналогия. </span>
              Именованная ссылка, связывающая идентификатор со значением в памяти.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
        <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
          <code>
            <span className="text-sky-300">name</span> <span className="text-slate-400">=</span>{" "}
            <span className="text-emerald-300">'Алекс'</span>{" "}
            <span className="text-slate-500"># имя игрока</span>
            {"\n"}
            <span className="text-sky-300">score</span> <span className="text-slate-400">=</span>{" "}
            <span className="text-amber-300">0</span> <span className="text-slate-500"># очки</span>
            {"\n"}
            <span className="text-violet-300">print</span>
            <span className="text-slate-400">(</span>
            <span className="text-sky-300">name</span>
            <span className="text-slate-400">, </span>
            <span className="text-sky-300">score</span>
            <span className="text-slate-400">)</span>
          </code>
        </pre>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          onClick={() => setSimple((s) => !s)}
          className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
            simple
              ? "bg-success/15 text-success"
              : "bg-primary text-primary-fg hover:brightness-110"
          }`}
        >
          {simple ? <Check size={14} /> : <Wand2 size={14} />}
          {simple ? "Понятно!" : "Объяснить проще"}
          {!simple && (
            <span className="absolute -inset-0.5 -z-10 animate-ping rounded-full bg-primary/40" />
          )}
        </button>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
          <Check size={15} /> +20 XP
        </span>
      </div>
    </div>
  );
}
