import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/hooks/useLoginModal";
import { pluralize } from "@/lib/utils";
import { PageTransition } from "@/components/PageTransition";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { GroupedList, GroupedRow } from "@/components/ui/GroupedList";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/State";

export function DashboardPage() {
  const { user, loading } = useAuth();
  const { open } = useLoginModal();

  const profileQuery = useQuery({
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
      <Container className="pb-24 pt-12 md:pt-20" aria-busy="true">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-10 h-28 w-full" />
      </Container>
    );
  }

  if (!user) {
    return (
      <PageTransition>
        <Container size="narrow" className="py-24 text-center">
          <title>Кабинет — Python Academy</title>
          <h1 className="text-title2 font-bold text-fg">Войди, чтобы открыть кабинет</h1>
          <p className="mx-auto mt-3 max-w-[44ch] text-body text-fg-muted">
            Прогресс, стрик и избранное хранятся по твоему Telegram-аккаунту — тому же, что в боте.
          </p>
          <Button size="lg" pill className="mt-8" onClick={open}>
            Войти через Telegram
          </Button>
        </Container>
      </PageTransition>
    );
  }

  if (profileQuery.isError) {
    return (
      <Container size="text" className="py-20">
        <ErrorState onRetry={() => profileQuery.refetch()} />
      </Container>
    );
  }

  const profile = profileQuery.data;
  const p = profile?.user;
  const courses = profile?.courses ?? [];
  const done = courses.reduce((sum, c) => sum + c.done, 0);
  const total = courses.reduce((sum, c) => sum + c.total, 0);
  const overall = total ? Math.round((done / total) * 100) : 0;
  const streak = p?.streak ?? 0;
  const inProgress =
    [...courses].filter((c) => c.done > 0 && c.percent < 100).sort((a, b) => b.percent - a.percent)[0] ??
    courses.find((c) => c.done > 0);
  const name = p?.username ? `@${p.username}` : `user_${user.id}`;

  const stats = [
    { value: `${overall}%`, label: "общий прогресс" },
    { value: String(streak), label: pluralize(streak, "день подряд", "дня подряд", "дней подряд") },
    { value: String(done), label: pluralize(done, "тема пройдена", "темы пройдено", "тем пройдено") },
  ];

  return (
    <PageTransition>
      <Container className="pb-24 pt-12 md:pt-20">
        <title>Кабинет — Python Academy</title>
        <h1 className="break-words text-title2 font-bold tracking-[-0.025em] text-fg md:text-title1">Привет, {name}</h1>
        {p && (
          <p className="mt-2 text-caption text-fg-muted">
            {p.level_title} · уровень {p.level}
            {p.is_pro ? " · PRO" : ""}
          </p>
        )}

        {profile ? (
          <dl className="mt-10 grid grid-cols-3 divide-x divide-line border-y border-line">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse px-3 py-6 first:pl-0 sm:px-8">
                <dt className="mt-1 text-caption text-fg-muted">{s.label}</dt>
                <dd className="text-title2 font-semibold tracking-[-0.015em] text-fg tabular sm:text-title1">{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <Skeleton className="mt-10 h-28 w-full" />
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-12">
            <section aria-labelledby="continue-title">
              <h2 id="continue-title" className="text-title3 font-semibold text-fg">
                Продолжить
              </h2>
              {!profile ? (
                <Skeleton className="mt-4 h-40 w-full rounded-3xl" />
              ) : inProgress ? (
                <Link
                  to={`/courses/${inProgress.id}`}
                  className="mt-4 block rounded-3xl bg-surface p-6 transition-colors duration-150 ease-out hover:bg-surface-hover md:p-8"
                >
                  <p className="text-title3 font-semibold text-fg">{inProgress.title}</p>
                  <p className="mt-1 text-caption text-fg-muted tabular">
                    Пройдено {inProgress.done} из {inProgress.total} · {inProgress.percent}%
                  </p>
                  <ProgressBar value={inProgress.percent} label={`Курс пройден на ${inProgress.percent}%`} className="mt-4" />
                  <span className="mt-5 inline-block text-body font-medium text-link">Открыть курс</span>
                </Link>
              ) : (
                <EmptyState
                  className="mt-4"
                  title="Ты ещё не начал ни одного курса"
                  text="Выбери курс — и прогресс появится здесь."
                  action={<ButtonLink to="/courses">Выбрать курс</ButtonLink>}
                />
              )}
            </section>

            {courses.length > 0 && (
              <section aria-labelledby="courses-title">
                <h2 id="courses-title" className="text-title3 font-semibold text-fg">
                  Мои курсы
                </h2>
                <GroupedList className="mt-4">
                  {courses.map((c) => (
                    <GroupedRow
                      key={c.id}
                      to={`/courses/${c.id}`}
                      trailing={
                        <>
                          <span className="tabular">{c.percent}%</span>
                          <ChevronRight size={18} aria-hidden="true" />
                        </>
                      }
                    >
                      <span className="block truncate">{c.title}</span>
                      <span className="mt-0.5 block text-caption text-fg-muted tabular">
                        {c.done} из {c.total} тем
                      </span>
                      {c.done > 0 && <ProgressBar value={c.percent} label={`${c.title}: ${c.percent}%`} className="mt-2" />}
                    </GroupedRow>
                  ))}
                </GroupedList>
              </section>
            )}
          </div>

          <div className="space-y-12">
            <section aria-labelledby="bookmarks-title">
              <h2 id="bookmarks-title" className="text-title3 font-semibold text-fg">
                Избранное
              </h2>
              {!bookmarks ? (
                <Skeleton className="mt-4 h-32 w-full" />
              ) : bookmarks.items.length ? (
                <GroupedList className="mt-4">
                  {bookmarks.items.map((b) => (
                    <GroupedRow
                      key={`${b.course_id}-${b.lesson_id}`}
                      to={`/courses/${b.course_id}/lessons/${b.lesson_id}`}
                      trailing={<ChevronRight size={18} aria-hidden="true" />}
                    >
                      <span className="block">{b.title}</span>
                      <span className="mt-0.5 block text-caption text-fg-muted">{b.course_title}</span>
                    </GroupedRow>
                  ))}
                </GroupedList>
              ) : (
                <EmptyState
                  className="mt-4"
                  title="В избранном пока пусто"
                  text="Нажми значок закладки рядом с заголовком урока, чтобы сохранить тему."
                  action={
                    <ButtonLink to="/courses" variant="secondary" className="bg-bg">
                      Открыть курсы
                    </ButtonLink>
                  }
                />
              )}
            </section>

            <section aria-labelledby="recs-title">
              <h2 id="recs-title" className="text-title3 font-semibold text-fg">
                Что учить дальше
              </h2>
              {!recs ? (
                <Skeleton className="mt-4 h-32 w-full" />
              ) : recs.items.length ? (
                <GroupedList className="mt-4">
                  {recs.items.map((r) => (
                    <GroupedRow
                      key={`${r.course_id}-${r.lesson_id}`}
                      to={`/courses/${r.course_id}/lessons/${r.lesson_id}`}
                      trailing={<ChevronRight size={18} aria-hidden="true" />}
                    >
                      <span className="block">{r.title}</span>
                      <span className="mt-0.5 block text-caption text-fg-muted">{r.reason}</span>
                    </GroupedRow>
                  ))}
                </GroupedList>
              ) : (
                <p className="mt-4 text-body text-fg-muted">Начни любой курс — и здесь появятся рекомендации.</p>
              )}
            </section>
          </div>
        </div>
      </Container>
    </PageTransition>
  );
}
