import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";
import type { MentorPoint } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { PageTransition } from "@/components/PageTransition";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/State";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** Internal validation dashboard for the zero-token mentor experiment (admins only;
 *  the server answers 404 to everyone else, and so does this page). */
export function InsightsPage() {
  const { user, loading } = useAuth();
  const isAdmin = !!user?.is_admin;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mentor-analytics"],
    queryFn: api.mentorAnalytics,
    refetchInterval: 15_000,
    enabled: isAdmin,
  });

  if (!loading && !isAdmin) return <NotFoundPage />;

  if (isError) {
    return (
      <Container size="text" className="py-20">
        <ErrorState onRetry={() => refetch()} />
      </Container>
    );
  }

  if (isLoading || !data) {
    return (
      <Container className="pb-24 pt-12 md:pt-20" aria-busy="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-10 h-32 w-full" />
        <Skeleton className="mt-12 h-56 w-full" />
      </Container>
    );
  }

  const t = data.totals;
  const kpis = [
    { label: "CTR ментора", value: `${data.mentor_ctr_percent}%`, hint: "из просмотренных тем" },
    { label: "Recovery", value: `${data.recovery_rate_percent}%`, hint: "решили после подсказок" },
    { label: "Retry rate", value: `${data.retry_rate_percent}%`, hint: "повторных попыток" },
    { label: "Эскалации к ИИ", value: `${t.escalation_candidates ?? 0}`, hint: "спрос на ИИ-наставника" },
  ];

  return (
    <PageTransition>
      <Container className="pb-24 pt-8 md:pt-12">
        <Link to="/courses" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-caption text-link hover:underline">
          <ChevronLeft size={16} aria-hidden="true" />К курсам
        </Link>
        <h1 className="mt-6 text-title1 font-bold tracking-[-0.025em] text-fg">Mentor Insights</h1>
        <p className="mt-3 max-w-[60ch] text-body text-fg-muted">
          Валидация zero-token наставника. Обновляется каждые 15 секунд. Всего событий:{" "}
          <span className="tabular">{t.events ?? 0}</span>.
        </p>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-line py-8 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="flex flex-col-reverse">
              <dt className="mt-1">
                <span className="block text-caption font-medium text-fg">{k.label}</span>
                <span className="block text-caption text-fg-muted">{k.hint}</span>
              </dt>
              <dd className="text-title1 font-semibold tracking-[-0.015em] text-fg tabular">{k.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <StatTable
            title="Воронка"
            rows={[
              ["Просмотрено тем", t.lessons_viewed],
              ["Прочитано (завершено)", t.lessons_read],
              ["Открыли наставника", t.mentor_opens],
              ["Запросов подсказок", t.hint_requests],
              ["Открыли объяснятель", t.explain_opens],
            ]}
          />
          <div>
            <StatTable
              title="Completion delta"
              rows={[
                ["С ментором", `${data.completion_delta_percent.with_mentor}%`],
                ["Без ментора", `${data.completion_delta_percent.without_mentor}%`],
              ]}
            />
            <p className="mt-3 text-caption text-fg-muted">
              Доля завершённых тем среди тех, кто пользовался ментором, в сравнении с остальными.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-3">
          <PointTable title="Confusion points" valueLabel="Индекс" points={data.confusion_points} metric="score" />
          <PointTable title="Где жмут помощь" valueLabel="Клики" points={data.help_hotspots} metric="clicks" />
          <PointTable title="Drop-off" valueLabel="Уходы" points={data.dropoff_points} metric="count" />
        </div>
      </Container>
    </PageTransition>
  );
}

function StatTable({ title, rows }: { title: string; rows: [string, number | string | undefined][] }) {
  return (
    <section>
      <h2 className="text-body font-semibold text-fg">{title}</h2>
      <div className="mt-3 overflow-x-auto rounded-xl bg-surface">
        <table className="w-full text-body">
          <caption className="sr-only">{title}</caption>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-t border-line first:border-t-0">
                <th scope="row" className="px-4 py-3 text-left font-normal text-fg-muted">
                  {label}
                </th>
                <td className="px-4 py-3 text-right font-semibold text-fg tabular">{value ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PointTable({
  title,
  valueLabel,
  points,
  metric,
}: {
  title: string;
  valueLabel: string;
  points: MentorPoint[];
  metric: "score" | "clicks" | "count";
}) {
  return (
    <section>
      <h2 className="text-body font-semibold text-fg">{title}</h2>
      <div className="mt-3 overflow-x-auto rounded-xl bg-surface">
        {points.length === 0 ? (
          <p className="px-4 py-4 text-caption text-fg-muted">Пока нет данных.</p>
        ) : (
          <table className="w-full text-caption">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="text-fg-muted">
                <th scope="col" className="px-4 py-3 text-left font-normal">
                  Тема
                </th>
                <th scope="col" className="px-4 py-3 text-right font-normal">
                  {valueLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={`${p.course_id}-${p.lesson_id}`} className="border-t border-line">
                  <td className="px-4 py-3 text-fg">
                    <span className="line-clamp-2">{p.title || `#${p.lesson_id}`}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-fg tabular">{p[metric] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
