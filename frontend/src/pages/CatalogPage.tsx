import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CourseCard } from "@/components/CourseCard";
import { PageTransition } from "@/components/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const LEVELS = ["Все", "Новичок", "Средний", "Продвинутый"] as const;

export function CatalogPage() {
  const { data } = useQuery({ queryKey: ["courses"], queryFn: api.courses });
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("Все");

  const filtered = useMemo(() => {
    if (!data) return [];
    if (level === "Все") return data.courses;
    return data.courses.filter((c) => c.level === level);
  }, [data, level]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          Каталог курсов
        </h1>
        <p className="mt-2 text-fg-muted">
          От «Установки Python» до Flask и backend-архитектуры.
        </p>

        {/* Level filter */}
        <div className="mt-7 flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                level === l
                  ? "border-transparent bg-primary text-primary-fg"
                  : "border-border text-fg-muted hover:bg-card-hover hover:text-fg",
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data
            ? filtered.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)
            : Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>

        {data && filtered.length === 0 && (
          <p className="mt-10 text-center text-fg-muted">Курсов этого уровня пока нет.</p>
        )}
      </div>
    </PageTransition>
  );
}
