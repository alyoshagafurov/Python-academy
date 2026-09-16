import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Check, ChevronLeft, ChevronRight, Clock, ListOrdered } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/hooks/useLoginModal";
import { langForCourse } from "@/lib/codeLang";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { GroupedList, GroupedRow } from "@/components/ui/GroupedList";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/State";
import { PageTransition } from "@/components/PageTransition";
import { CodeBlock } from "@/components/CodeBlock";
import { TheoryRenderer } from "@/components/TheoryRenderer";
import { PredictCheck } from "@/components/PredictCheck";
import { LivePreview } from "@/components/LivePreview";
import { AdaptiveExplainer } from "@/components/mentor/AdaptiveExplainer";
import { LessonToc } from "@/components/lesson/LessonToc";
import { LessonMistakes } from "@/components/lesson/LessonMistakes";
import { OwnWords } from "@/components/lesson/OwnWords";

/** Result of «Понятно, отметить»; currentId is set when the lesson is ahead of the current one. */
interface ReadNote {
  text: string;
  currentId?: number;
  /** Set when the lesson was just counted and a next lesson exists. */
  nextId?: number;
}

function readMinutes(...texts: string[]): number {
  const chars = texts.join(" ").replace(/<[^>]+>/g, "").length;
  return Math.max(1, Math.round(chars / 700));
}

export function LessonPage() {
  const { courseId = "", lessonId = "" } = useParams();
  const lid = parseInt(lessonId, 10);
  const qc = useQueryClient();
  const { user } = useAuth();
  const { open: openLogin } = useLoginModal();

  const [readFlash, setReadFlash] = useState<ReadNote | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);
  const [tocOpen, setTocOpen] = useState(false);
  const viewedRef = useRef("");

  const { data: lesson, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["lesson", courseId, lid],
    queryFn: () => api.lesson(courseId, lid),
  });
  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api.course(courseId),
  });
  const { data: related } = useQuery({
    queryKey: ["related", courseId, lid],
    queryFn: () => api.lessonRelated(courseId, lid),
  });
  // The route keeps this component mounted between lessons: a new lesson starts
  // with its own state (adjusted during render, not in an effect).
  const lessonKey = `${courseId}:${lid}`;
  const [shownLesson, setShownLesson] = useState(lessonKey);
  if (shownLesson !== lessonKey) {
    setShownLesson(lessonKey);
    setReadFlash(null);
    setTocOpen(false);
  }
  useEffect(() => {
    // Instant, not smooth: no motion on navigation.
    window.scrollTo(0, 0);
  }, [courseId, lid]);

  // Telemetry: one lesson_view per lesson once it loads (mentor analytics).
  useEffect(() => {
    const key = `${courseId}:${lid}`;
    if (lesson && viewedRef.current !== key) {
      viewedRef.current = key;
      api.mentorEvent("lesson_view", courseId, lid, { title: lesson.title });
    }
  }, [courseId, lid, lesson]);

  const stageInfo = useMemo(() => {
    if (!course || !lesson) return null;
    const stage = course.stages.find((s) => s.id === lesson.stage_id);
    if (!stage) return null;
    const pos = stage.lessons.findIndex((l) => l.id === lid) + 1;
    return { title: stage.title, pos, total: stage.lessons.length };
  }, [course, lesson, lid]);

  const titleById = useMemo(() => {
    const map = new Map<number, string>();
    course?.stages.forEach((s) => s.lessons.forEach((l) => map.set(l.id, l.title)));
    return map;
  }, [course]);

  const bookmarkMut = useMutation({
    mutationFn: () => api.toggleBookmark(courseId, lid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson", courseId, lid] });
      qc.invalidateQueries({ queryKey: ["course", courseId] });
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const readMut = useMutation({
    mutationFn: () => api.markRead(courseId, lid),
    onSuccess: (res) => {
      api.mentorEvent("lesson_read", courseId, lid, { title: lesson?.title });
      window.clearTimeout(flashTimer.current);
      qc.invalidateQueries({ queryKey: ["lesson", courseId, lid] });
      qc.invalidateQueries({ queryKey: ["course", courseId] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      // Progress is linear: a lesson ahead of the current one is not counted yet,
      // so say so and point to the lesson that is (this note stays on screen).
      if (res.ahead && res.current_lesson) {
        setReadFlash({ text: "Засчитается, когда дойдёшь сюда по порядку.", currentId: res.current_lesson });
        return;
      }
      // A counted lesson ends with a way forward, so this note stays until navigation.
      if (res.awarded) {
        setReadFlash({ text: `+${res.xp_gain} XP — тема пройдена.`, nextId: lesson?.nav.next_id ?? undefined });
        return;
      }
      setReadFlash({ text: "Отмечено прочитанным" });
      flashTimer.current = window.setTimeout(() => setReadFlash(null), 3500);
    },
  });

  const lang = useMemo(() => langForCourse(courseId), [courseId]);

  if (isError) {
    // A missing lesson is not a server problem: say so, and don't offer a retry that cannot help.
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <Container size="text" className="py-20">
        <ErrorState
          title={missing ? "Такой темы нет" : "Не удалось открыть урок"}
          text={
            missing
              ? "Возможно, в ссылке опечатка. Вернись к курсу и выбери тему из списка."
              : "Сервер не отвечает. Проверь подключение и попробуй ещё раз."
          }
          onRetry={missing ? undefined : () => refetch()}
        />
      </Container>
    );
  }

  if (isLoading || !lesson) {
    return (
      // Viewport-tall placeholder: the footer must not sit on screen and jump when the lesson arrives.
      <Container size="wide" className="min-h-dvh pb-24 pt-10" aria-busy="true">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="hidden space-y-2 lg:block">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
          <div className="max-w-[68ch]">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-6 h-10 w-3/4" />
            <Skeleton className="mt-8 h-28 w-full" />
            <Skeleton className="mt-12 h-64 w-full" />
          </div>
        </div>
      </Container>
    );
  }

  const handleBookmark = () => (user ? bookmarkMut.mutate() : openLogin());
  const handleRead = () => (user ? readMut.mutate() : openLogin());
  const mins = readMinutes(lesson.theory, lesson.code_explained);
  const meta = [
    stageInfo?.title,
    stageInfo && `Тема ${stageInfo.pos} из ${stageInfo.total}`,
    lesson.topic_name,
    `${mins} мин чтения`,
  ].filter(Boolean);

  return (
    <PageTransition>
      <title>{`${lesson.title} — Python Academy`}</title>
      <Container size="wide" className="pb-24 pt-6 md:pt-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_220px]">
          {course && (
            <aside aria-label="Содержание курса" className="hidden lg:block">
              <div className="sticky top-[76px] max-h-[calc(100dvh-100px)] overflow-y-auto overscroll-contain pb-8">
                <LessonToc course={course} currentId={lid} />
              </div>
            </aside>
          )}

          <article className="min-w-0 max-w-[68ch]">
            <div className="flex items-center justify-between gap-3">
              <Link
                to={`/courses/${courseId}`}
                className="-ml-1 inline-flex min-h-11 min-w-0 items-center gap-1 text-caption text-link hover:underline"
              >
                <ChevronLeft size={16} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{lesson.course_title}</span>
              </Link>
              {course && (
                <Button
                  variant="secondary"
                  className="shrink-0 px-4 text-caption lg:hidden"
                  aria-haspopup="dialog"
                  onClick={() => setTocOpen(true)}
                >
                  <ListOrdered size={16} aria-hidden="true" />
                  Содержание
                </Button>
              )}
            </div>

            <p className="mt-6 text-caption text-fg-muted">{meta.join(" · ")}</p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h1 className="text-title2 font-bold tracking-[-0.025em] text-fg md:text-title1">{lesson.title}</h1>
              <button
                type="button"
                onClick={handleBookmark}
                aria-pressed={lesson.bookmarked}
                aria-label={lesson.bookmarked ? "Убрать из избранного" : "Добавить в избранное"}
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors duration-150 ease-out hover:bg-surface",
                  lesson.bookmarked ? "text-accent" : "text-fg-muted hover:text-fg",
                )}
              >
                <Bookmark size={20} aria-hidden="true" className={cn(lesson.bookmarked && "fill-current")} />
              </button>
            </div>

            {lesson.association && (
              <div className="mt-8 rounded-xl bg-surface p-6">
                <p className="text-caption text-fg-muted">Аналогия</p>
                <p className="mt-2 text-title3 text-fg">{lesson.association}</p>
              </div>
            )}

            {lesson.theory && (
              <LessonSection title="Разбор темы">
                <TheoryRenderer html={lesson.theory} />
              </LessonSection>
            )}

            {lesson.real_example && (
              <p className="mt-6 max-w-[68ch] text-body leading-[1.65] text-fg-muted">
                <span className="font-semibold text-fg">Где пригодится: </span>
                {lesson.real_example}
              </p>
            )}

            {lesson.example && (
              <LessonSection title={lang === "math" ? "Расчёт" : "Пример кода"}>
                <CodeBlock code={lesson.example} lang={lang} />
                {lang === "html" && <LivePreview code={lesson.example} />}
                {lesson.code_explained && (
                  <div className="mt-6">
                    <h3 className="text-body font-semibold text-fg">
                      {lang === "math" ? "Разбор расчёта" : "Что здесь происходит"}
                    </h3>
                    <TheoryRenderer html={lesson.code_explained} className="mt-2" />
                  </div>
                )}
              </LessonSection>
            )}

            {/* Adaptive explainer (zero-token mentor): offered while the theory is fresh, before the check */}
            <AdaptiveExplainer courseId={courseId} lessonId={lid} lang={lang} />

            {/* Retrieval practice — predict before you peek (Make It Stick) */}
            {lesson.check && (
              <PredictCheck key={`${courseId}:${lid}`} check={lesson.check} lang={lang} courseId={courseId} lessonId={lid} />
            )}

            {/* Common mistakes — collapsed by default to reduce overwhelm */}
            {lesson.common_mistakes.length > 0 && (
              <LessonMistakes key={lessonKey} mistakes={lesson.common_mistakes} />
            )}


            {/* Closure: recall in your own words (Galperin / Badmaev) */}
            <OwnWords key={lessonKey} lang={lang} />

            <div className="mt-12 flex flex-wrap items-center gap-4">
              <Button size="lg" onClick={handleRead} disabled={readMut.isPending}>
                {lesson.status === "done" ? "Прочитано" : "Понятно, отметить"}
              </Button>
              <p role="status" className="flex flex-wrap items-center gap-x-2 text-caption text-fg">
                {readFlash && (
                  <>
                    {readFlash.currentId ? (
                      <Clock size={16} className="text-fg-muted" aria-hidden="true" />
                    ) : (
                      <Check size={16} strokeWidth={2.5} className="text-success" aria-hidden="true" />
                    )}
                    {readFlash.text}
                    {readFlash.currentId && (
                      <Link
                        to={`/courses/${courseId}/lessons/${readFlash.currentId}`}
                        className="inline-flex min-h-11 items-center text-link hover:underline"
                      >
                        К текущему уроку
                      </Link>
                    )}
                    {readFlash.nextId && (
                      <Link
                        to={`/courses/${courseId}/lessons/${readFlash.nextId}`}
                        className="inline-flex min-h-11 items-center font-medium text-link hover:underline"
                      >
                        Следующая тема: {titleById.get(readFlash.nextId) ?? "дальше"}
                      </Link>
                    )}
                  </>
                )}
              </p>
            </div>

            <nav aria-label="Соседние темы" className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NeighbourLink
                direction="prev"
                to={lesson.nav.prev_id ? `/courses/${courseId}/lessons/${lesson.nav.prev_id}` : null}
                title={lesson.nav.prev_id ? titleById.get(lesson.nav.prev_id) : undefined}
              />
              <NeighbourLink
                direction="next"
                to={lesson.nav.next_id ? `/courses/${courseId}/lessons/${lesson.nav.next_id}` : null}
                title={lesson.nav.next_id ? titleById.get(lesson.nav.next_id) : undefined}
              />
            </nav>

            {related && related.items.length > 0 && (
              <section className="mt-12 xl:hidden" aria-labelledby="related-title">
                <h2 id="related-title" className="text-body font-semibold text-fg">
                  Похожие темы
                </h2>
                <GroupedList className="mt-3">
                  {related.items.slice(0, 4).map((r) => (
                    <GroupedRow
                      key={`${r.course_id}-${r.lesson_id}`}
                      to={`/courses/${r.course_id}/lessons/${r.lesson_id}`}
                      trailing={<ChevronRight size={18} aria-hidden="true" />}
                    >
                      <span className="block">{r.title}</span>
                      <span className="mt-0.5 block text-caption text-fg-muted">{r.course_title}</span>
                    </GroupedRow>
                  ))}
                </GroupedList>
              </section>
            )}
          </article>

          <aside className="hidden xl:block" aria-label="Прогресс и похожие темы">
            <div className="sticky top-[76px] space-y-10">
              {course?.progress && (
                <div>
                  <p className="text-caption font-semibold text-fg">Прогресс курса</p>
                  <ProgressBar
                    value={course.progress.percent}
                    label={`Курс пройден на ${course.progress.percent}%`}
                    className="mt-3"
                  />
                  <p className="mt-2 text-caption text-fg-muted tabular">
                    {course.progress.done} из {course.progress.total} тем · {course.progress.percent}%
                  </p>
                </div>
              )}
              {related && related.items.length > 0 && (
                <div>
                  <p className="text-caption font-semibold text-fg">Похожие темы</p>
                  <ul className="mt-2">
                    {related.items.map((r) => (
                      <li key={`${r.course_id}-${r.lesson_id}`}>
                        <Link
                          to={`/courses/${r.course_id}/lessons/${r.lesson_id}`}
                          className="block py-2 text-caption text-fg-muted transition-colors duration-150 ease-out hover:text-fg"
                        >
                          {r.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </Container>

      {course && (
        <Sheet open={tocOpen} onClose={() => setTocOpen(false)} title="Содержание">
          <LessonToc course={course} currentId={lid} onNavigate={() => setTocOpen(false)} />
        </Sheet>
      )}
    </PageTransition>
  );
}

function LessonSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-title3 font-semibold text-fg">{title}</h2>
      {children}
    </section>
  );
}

function NeighbourLink({
  direction,
  to,
  title,
}: {
  direction: "prev" | "next";
  to: string | null;
  title?: string;
}) {
  const next = direction === "next";
  const label = next ? "Далее" : "Назад";
  const fallback = to ? (next ? "Следующая тема" : "Предыдущая тема") : next ? "Это последняя тема" : "Это первая тема";
  const cls = cn("flex min-h-[72px] min-w-0 items-center gap-3 rounded-xl bg-surface px-4 py-3", next && "sm:col-start-2");

  const inner = (
    <>
      {!next && <ChevronLeft size={20} className="shrink-0 text-fg-muted" aria-hidden="true" />}
      <span className={cn("min-w-0 flex-1", next && "text-right")}>
        <span className="block text-caption text-fg-muted">{label}</span>
        <span className="mt-0.5 line-clamp-2 block text-body text-fg">{title ?? fallback}</span>
      </span>
      {next && <ChevronRight size={20} className="shrink-0 text-fg-muted" aria-hidden="true" />}
    </>
  );

  if (!to) {
    return (
      // Informational, not a disabled control: full opacity keeps the text at 4.5:1.
      <div aria-disabled="true" className={cn(cls, "text-fg-muted")}>
        {inner}
      </div>
    );
  }
  return (
    <Link to={to} className={cn(cls, "transition-colors duration-150 ease-out hover:bg-surface-hover")}>
      {inner}
    </Link>
  );
}
