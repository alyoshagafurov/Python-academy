import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, Star, Trophy, Sparkles, ArrowRight, BookMarked } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/hooks/useLoginModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PageTransition } from "@/components/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatNumber, pluralize } from "@/lib/utils";

export function DashboardPage() {
  const { user, loading } = useAuth();
  const { open } = useLoginModal();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: api.profile,
    enabled: !!user,
  });
  const { data: bookmarks } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: api.bookmarks,
    enabled: !!user,
  });
  const { data: recs } = useQuery({
    queryKey: ["recommendations"],
    queryFn: api.recommendations,
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
          <div className="text-5xl">🔐</div>
          <h1 className="mt-4 text-2xl font-bold text-fg">Войди, чтобы увидеть кабинет</h1>
          <p className="mt-2 text-fg-muted">
            Прогресс, стрик и избранное хранятся по твоему Telegram-аккаунту —
            тому же, что в боте.
          </p>
          <Button size="lg" className="mt-6" onClick={open}>
            Войти через Telegram
          </Button>
        </div>
      </PageTransition>
    );
  }

  const p = profile?.user;

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Profile header */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8">
          <div className="glow" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-2xl font-bold text-white">
                {(p?.username ?? "U")[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-fg">
                  @{p?.username ?? `user_${user.id}`}
                </h1>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone="primary">{p?.level_title}</Badge>
                  {p?.is_pro && <Badge tone="accent">PRO</Badge>}
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              <Metric icon={Trophy} value={p ? formatNumber(p.xp) : "0"} label="XP" />
              <Metric
                icon={Flame}
                value={`${p?.streak ?? 0}`}
                label={pluralize(p?.streak ?? 0, "день", "дня", "дней")}
                accent="text-orange-500"
              />
              <Metric
                icon={Star}
                value={`${profile?.bookmarks_count ?? 0}`}
                label="в избранном"
                accent="text-accent"
              />
            </div>
          </div>

          {/* Level progress */}
          {p && (
            <div className="relative mt-6">
              <div className="mb-1.5 flex justify-between text-xs text-fg-muted">
                <span>Уровень {p.level}</span>
                <span>{formatNumber(p.xp_to_next)} XP до следующего</span>
              </div>
              <ProgressBar value={p.level_percent} />
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Courses progress */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-bold text-fg">Прогресс по курсам</h2>
            <div className="space-y-3">
              {profile?.courses.map((c) => (
                <Link key={c.id} to={`/courses/${c.id}`}>
                  <Card className="flex items-center gap-4 p-4 transition-colors hover:bg-card-hover">
                    <span className="text-2xl">{c.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between">
                        <span className="truncate font-semibold text-fg">{c.title}</span>
                        <span className="text-sm text-fg-muted">{c.percent}%</span>
                      </div>
                      <ProgressBar value={c.percent} color={c.accent} className="mt-2" />
                      <div className="mt-1 text-xs text-fg-subtle">
                        {c.done} / {c.total} тем
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-8">
            {/* Recommendations */}
            <div>
              <h2 className="mb-4 flex items-center gap-1.5 text-xl font-bold text-fg">
                <Sparkles size={18} className="text-primary" /> Что учить дальше
              </h2>
              <div className="space-y-2">
                {recs?.items.length ? (
                  recs.items.map((r) => (
                    <Link
                      key={`${r.course_id}-${r.lesson_id}`}
                      to={`/courses/${r.course_id}/lessons/${r.lesson_id}`}
                      className="group block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-card-hover"
                    >
                      <div className="flex items-center gap-2 font-medium text-fg">
                        <span>{r.course_emoji}</span>
                        <span className="line-clamp-1">{r.title}</span>
                        <ArrowRight
                          size={15}
                          className="ml-auto text-fg-subtle transition-transform group-hover:translate-x-0.5"
                        />
                      </div>
                      <p className="mt-1 text-xs text-fg-subtle">{r.reason}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-fg-muted">
                    Начни любой курс — и здесь появятся рекомендации.
                  </p>
                )}
              </div>
            </div>

            {/* Bookmarks */}
            <div>
              <h2 className="mb-4 flex items-center gap-1.5 text-xl font-bold text-fg">
                <BookMarked size={18} className="text-accent" /> Избранное
              </h2>
              <div className="space-y-2">
                {bookmarks?.items.length ? (
                  bookmarks.items.map((b) => (
                    <Link
                      key={`${b.course_id}-${b.lesson_id}`}
                      to={`/courses/${b.course_id}/lessons/${b.lesson_id}`}
                      className="block rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-fg transition-colors hover:bg-card-hover"
                    >
                      <span className="mr-1">{b.course_emoji}</span>
                      {b.title}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-fg-muted">
                    Пока пусто. Жми ⭐ на темах, чтобы сохранить.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  accent = "text-primary",
}: {
  icon: typeof Trophy;
  value: string;
  label: string;
  accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <Icon className={`mx-auto mb-1 ${accent}`} size={20} />
      <div className="text-xl font-extrabold text-fg">{value}</div>
      <div className="text-xs text-fg-subtle">{label}</div>
    </motion.div>
  );
}
