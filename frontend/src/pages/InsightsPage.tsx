import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { MentorPoint } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { PageTransition } from "@/components/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";

/** Internal validation dashboard for the zero-token mentor experiment. */
export function InsightsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["mentor-analytics"],
    queryFn: api.mentorAnalytics,
    refetchInterval: 15_000,
  });

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Skeleton className="h-40 w-full" />
      </div>
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
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg">Mentor Insights</h1>
        <p className="mt-2 text-fg-muted">
          Валидация zero-token наставника. Обновляется каждые 15 сек. Всего событий: {t.events}.
        </p>

        {/* KPIs */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="p-5">
              <div className="text-3xl font-extrabold text-fg">{k.value}</div>
              <div className="mt-1 text-sm font-semibold text-fg">{k.label}</div>
              <div className="text-xs text-fg-subtle">{k.hint}</div>
            </Card>
          ))}
        </div>

        {/* Funnel + completion delta */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-3 font-bold text-fg">Воронка</h2>
            <Row label="Просмотрено тем" value={t.lessons_viewed} />
            <Row label="Прочитано (завершено)" value={t.lessons_read} />
            <Row label="Открыли наставника" value={t.mentor_opens} />
            <Row label="Запросов подсказок" value={t.hint_requests} />
            <Row label="Открыли объяснятель" value={t.explain_opens} />
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-bold text-fg">Completion delta</h2>
            <Row label="С ментором" value={`${data.completion_delta_percent.with_mentor}%`} />
            <Row label="Без ментора" value={`${data.completion_delta_percent.without_mentor}%`} />
            <p className="mt-3 text-xs text-fg-subtle">
              Доля завершённых тем среди тех, кто пользовался ментором, vs остальных.
            </p>
          </Card>
        </div>

        {/* Point lists */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PointList title="🔥 Confusion points" points={data.confusion_points} metric="score" />
          <PointList title="🖱 Где жмут помощь" points={data.help_hotspots} metric="clicks" />
          <PointList title="🚪 Drop-off" points={data.dropoff_points} metric="count" />
        </div>

        <Link to="/courses" className="mt-8 inline-block text-sm font-semibold text-primary hover:underline">
          ← К курсам
        </Link>
      </div>
    </PageTransition>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-soft py-2 last:border-0 text-sm">
      <span className="text-fg-muted">{label}</span>
      <span className="font-semibold text-fg">{value}</span>
    </div>
  );
}

function PointList({
  title,
  points,
  metric,
}: {
  title: string;
  points: MentorPoint[];
  metric: "score" | "clicks" | "count";
}) {
  return (
    <Card className="p-5">
      <h2 className="mb-3 font-bold text-fg">{title}</h2>
      {points.length === 0 ? (
        <p className="text-sm text-fg-subtle">Пока нет данных.</p>
      ) : (
        <div className="space-y-1.5">
          {points.map((p) => (
            <div key={`${p.course_id}-${p.lesson_id}`} className="flex items-center justify-between gap-2 text-sm">
              <span className="line-clamp-1 text-fg">{p.title || `#${p.lesson_id}`}</span>
              <span className="shrink-0 rounded-md bg-card-hover px-2 py-0.5 text-xs font-semibold text-fg-muted">
                {p[metric] ?? 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
