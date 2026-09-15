import { useState } from "react";
import { Check } from "lucide-react";
import type { CodeLang } from "@/lib/codeLang";

/**
 * Closure: recall in your own words (Galperin / Badmaev). The text lives here, so
 * typing re-renders only this box instead of the whole lesson. Key it by lesson.
 */
export function OwnWords({ lang }: { lang: CodeLang }) {
  const [text, setText] = useState("");

  return (
    <div className="mt-12">
      <label htmlFor="own-words" className="text-body font-semibold text-fg">
        Закрепи: объясни тему своими словами
      </label>
      <p id="own-words-hint" className="mt-1 text-caption text-fg-muted">
        Если получилось сформулировать — значит, ты правда понял. Это для тебя, никто не проверяет.
      </p>
      <textarea
        id="own-words"
        aria-describedby="own-words-hint"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={
          lang === "math"
            ? "Например: процент — это сотая часть, поэтому 10% от 250 — это 25…"
            : "Например: переменная — это коробка с именем, в которую кладёшь значение…"
        }
        className="mt-3 w-full resize-y rounded-xl border border-line bg-bg px-4 py-3 text-body text-fg placeholder:text-fg-muted"
      />
      {text.trim().length > 12 && (
        <p className="mt-2 flex items-center gap-2 text-caption text-fg">
          <Check size={16} strokeWidth={2.5} className="text-success" aria-hidden="true" />
          Своими словами запоминается лучше. Вернись к этой формулировке, когда будешь повторять.
        </p>
      )}
    </div>
  );
}
