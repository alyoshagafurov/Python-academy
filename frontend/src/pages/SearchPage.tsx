import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Search as SearchIcon } from "lucide-react";
import { api } from "@/lib/api";
import { pluralize } from "@/lib/utils";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { GroupedList, GroupedRow } from "@/components/ui/GroupedList";
import { Skeleton, Spinner } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/State";

const SUGGESTIONS = ["функции", "списки", "словари", "async", "Flask", "декораторы", "CSS"];

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Marks the matched part by weight, not colour. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "ig"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <b key={i} className="font-semibold">
            {part}
          </b>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(() => params.get("q") ?? "");
  const [query, setQuery] = useState(() => (params.get("q") ?? "").trim());

  // Debounce input → query.
  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 250);
    return () => clearTimeout(t);
  }, [input]);

  // Keep ?q= in the address so a search can be shared or reopened.
  // Runs on query changes only, so it never fights a back/forward navigation.
  useEffect(() => {
    if ((params.get("q") ?? "") !== query) setParams(query ? { q: query } : {}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Back/forward or an edited address bar: follow the URL.
  const urlQuery = params.get("q") ?? "";
  useEffect(() => {
    if (urlQuery !== query) {
      setInput(urlQuery);
      setQuery(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search(query, 20),
    enabled: query.length > 0,
  });

  const hits = data?.hits ?? [];

  return (
    <PageTransition>
      <Container size="narrow" className="pb-24 pt-12 md:pt-20">
        <h1 className="text-title1 font-bold tracking-[-0.025em] text-fg">Поиск</h1>
        <p className="mt-3 text-body text-fg-muted">Ищи по названиям тем и теории всех курсов.</p>

        <form
          role="search"
          className="relative mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(input.trim());
          }}
        >
          <label htmlFor="search-input" className="sr-only">
            Поиск по темам
          </label>
          <SearchIcon
            size={20}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted"
          />
          <input
            id="search-input"
            type="search"
            autoFocus
            autoComplete="off"
            enterKeyHint="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Например: цикл for, словари, формы"
            className="h-12 w-full rounded-xl border border-line bg-bg pl-12 pr-12 text-body text-fg placeholder:text-fg-muted [&::-webkit-search-cancel-button]:hidden"
          />
          {isFetching && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2">
              <Spinner label="Ищем" />
            </span>
          )}
        </form>

        {!query && (
          <div className="mt-8">
            <p className="text-caption text-fg-muted">Часто ищут</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="min-h-11 rounded-xl bg-surface px-4 text-caption text-fg transition-colors duration-150 ease-out hover:bg-surface-hover active:scale-[0.98]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8" aria-live="polite">
          {query && isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : query && data && hits.length === 0 && !isFetching ? (
            <EmptyState
              title={`Ничего не нашлось по «${query}»`}
              text="Проверь написание или попробуй другое слово."
              action={
                <Button variant="secondary" onClick={() => setInput("")}>
                  Очистить поиск
                </Button>
              }
            />
          ) : query && data && hits.length > 0 ? (
            <>
              <p className="mb-3 text-caption text-fg-muted">
                {hits.length} {pluralize(hits.length, "результат", "результата", "результатов")}
              </p>
              <GroupedList>
                {hits.map((hit) => (
                  <GroupedRow
                    key={`${hit.course_id}-${hit.lesson_id}`}
                    to={`/courses/${hit.course_id}/lessons/${hit.lesson_id}`}
                    trailing={<ChevronRight size={18} aria-hidden="true" />}
                  >
                    <span className="block">
                      <Highlight text={hit.title} query={query} />
                    </span>
                    <span className="mt-0.5 block text-caption text-fg-muted">
                      {hit.course_title} · {hit.topic_name}
                    </span>
                    {hit.snippet && (
                      <span className="mt-1 line-clamp-2 block text-caption text-fg-muted">{hit.snippet}</span>
                    )}
                  </GroupedRow>
                ))}
              </GroupedList>
            </>
          ) : query && isFetching ? (
            <div className="space-y-2" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[72px] w-full" />
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </PageTransition>
  );
}
