import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CourseCard } from "@/components/CourseCard";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/State";
import { cn } from "@/lib/utils";

const LEVELS = ["Все", "Новичок", "Средний", "Продвинутый"] as const;

export function CatalogPage() {
  const { data, isError, refetch } = useQuery({ queryKey: ["courses"], queryFn: api.courses });
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("Все");

  const filtered = useMemo(() => {
    if (!data) return [];
    if (level === "Все") return data.courses;
    return data.courses.filter((c) => c.level === level);
  }, [data, level]);

  return (
    <PageTransition>
      <Container className="pb-24 pt-12 md:pt-20">
        <h1 className="text-title1 font-bold tracking-[-0.025em] text-fg">Курсы</h1>
        <p className="mt-3 max-w-[52ch] text-body text-fg-muted">
          От установки Python до Flask и backend-архитектуры. Начни с курса своего уровня.
        </p>

        <div
          role="group"
          aria-label="Уровень"
          className="mt-8 inline-flex max-w-full rounded-xl bg-surface p-1"
        >
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={level === l}
              onClick={() => setLevel(l)}
              className={cn(
                "min-h-11 rounded-lg px-3 text-caption font-medium transition-colors duration-150 ease-out sm:px-4 sm:text-body",
                level === l ? "bg-bg text-fg shadow-sm" : "text-fg-muted hover:text-fg",
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="mt-10">
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : data && filtered.length === 0 ? (
            <EmptyState
              title="Курсов этого уровня пока нет"
              text="Новые курсы появятся позже. А пока посмотрите остальные."
              action={
                <Button variant="secondary" onClick={() => setLevel("Все")}>
                  Показать все курсы
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data
                ? filtered.map((c) => <CourseCard key={c.id} course={c} as="h2" />)
                : Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-3xl" />)}
            </div>
          )}
        </div>
      </Container>
    </PageTransition>
  );
}
