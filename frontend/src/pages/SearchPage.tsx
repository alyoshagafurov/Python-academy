import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search as SearchIcon, CornerDownLeft } from "lucide-react";
import { api } from "@/lib/api";
import { PageTransition } from "@/components/PageTransition";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Skeleton";

const SUGGESTIONS = ["функции", "списки", "словари", "async", "Flask", "декораторы", "CSS"];

export function SearchPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  // Debounce input → query.
  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 250);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search(query, 20),
    enabled: query.length > 0,
  });

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-center text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          Поиск по теории
        </h1>
        <p className="mt-2 text-center text-fg-muted">
          Одно поле — все 5 курсов и 200 тем.
        </p>

        <div className="relative mt-8">
          <SearchIcon
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle"
          />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Например: цикл for, генераторы, формы…"
            className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-4 text-lg text-fg shadow-sm outline-none transition-colors focus:border-primary"
          />
          {isFetching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Spinner />
            </div>
          )}
        </div>

        {!query && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="rounded-full border border-border px-3 py-1.5 text-sm text-fg-muted hover:bg-card-hover hover:text-fg"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 space-y-3">
          {data?.hits.map((hit, i) => (
            <motion.div
              key={`${hit.course_id}-${hit.lesson_id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
            >
              <Link
                to={`/courses/${hit.course_id}/lessons/${hit.lesson_id}`}
                className="group block rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-card-hover"
              >
                <div className="flex items-center gap-2">
                  <span>{hit.course_emoji}</span>
                  <span className="font-semibold text-fg group-hover:text-primary">
                    {hit.title}
                  </span>
                  <Badge tone="default" className="ml-auto">
                    {hit.topic_name}
                  </Badge>
                </div>
                {hit.snippet && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{hit.snippet}</p>
                )}
              </Link>
            </motion.div>
          ))}

          {query && data && data.hits.length === 0 && !isFetching && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-fg-muted">
              <CornerDownLeft className="mx-auto mb-2 opacity-40" />
              Ничего не нашлось по «{query}». Попробуй другой запрос.
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
