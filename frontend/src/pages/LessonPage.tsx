import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  Briefcase,
  Lightbulb,
  PlayCircle,
  Star,
  TriangleAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import type { CourseDetail } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/hooks/useLoginModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/PageTransition";
import { CodeBlock } from "@/components/CodeBlock";
import { TheoryRenderer } from "@/components/TheoryRenderer";
import { PredictCheck } from "@/components/PredictCheck";
import { LivePreview } from "@/components/LivePreview";
import { AdaptiveExplainer } from "@/components/mentor/AdaptiveExplainer";
import { langForCourse } from "@/lib/shiki";
import { cn } from "@/lib/utils";

function readMinutes(...texts: string[]): number {
  const chars = texts.join(" ").replace(/<[^>]+>/g, "").length;
  return Math.max(1, Math.round(chars / 700));
}

export function LessonPage() {
  const { courseId = "", lessonId = "" } = useParams();
  const lid = parseInt(lessonId, 10);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { open: openLogin } = useLoginModal();

  const [showMistakes, setShowMistakes] = useState(false);
  const [readFlash, setReadFlash] = useState<string | null>(null);
  const [ownWords, setOwnWords] = useState("");
  const viewedRef = useRef("");

  const { data: lesson, isLoading } = useQuery({
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
  useEffect(() => {
    setShowMistakes(false);
    setReadFlash(null);
    setOwnWords("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    return { title: stage.title, emoji: stage.emoji, pos, total: stage.lessons.length };
  }, [course, lesson, lid]);

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
      setReadFlash(res.awarded ? `+${res.xp_gain} XP — тема пройдена!` : "Отмечено прочитанным");
      qc.invalidateQueries({ queryKey: ["lesson", courseId, lid] });
      qc.invalidateQueries({ queryKey: ["course", courseId] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      setTimeout(() => setReadFlash(null), 3500);
    },
  });

  const lang = useMemo(() => langForCourse(courseId), [courseId]);

  if (isLoading || !lesson) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Skeleton className="mb-4 h-8 w-2/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const handleBookmark = () => (user ? bookmarkMut.mutate() : openLogin());
  const handleRead = () => (user ? readMut.mutate() : openLogin());
  const mins = readMinutes(lesson.theory, lesson.code_explained);

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link
          to={`/courses/${courseId}`}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft size={15} /> {lesson.course_emoji} {lesson.course_title}
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[250px_minmax(0,1fr)_260px]">
          {/* ───── Left: collapsible tree ───── */}
          {course && <LessonSidebar course={course} currentId={lid} />}

          {/* ───── Center ───── */}
          <article className="min-w-0">
            {/* Friendly header */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-subtle">
              {stageInfo && (
                <span className="font-medium text-fg-muted">
                  {stageInfo.emoji} {stageInfo.title}
                </span>
              )}
              {stageInfo && (
                <span className="inline-flex items-center gap-1">
                  <BookOpen size={13} /> Тема {stageInfo.pos} из {stageInfo.total}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock size={13} /> {mins} мин чтения
              </span>
            </div>

            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <Badge tone="primary">{lesson.topic_name}</Badge>
                <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-fg sm:text-4xl">
                  {lesson.title}
                </h1>
              </div>
              <button
                onClick={handleBookmark}
                aria-label="В избранное"
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-colors",
                  lesson.bookmarked
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border text-fg-muted hover:bg-card-hover hover:text-fg",
                )}
              >
                <Star size={18} className={lesson.bookmarked ? "fill-accent" : ""} />
              </button>
            </div>

            {/* 💡 Analogy — the friendly hook */}
            {lesson.association && (
              <div className="mt-7 rounded-2xl border border-primary/25 bg-primary-soft/50 p-5">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
                  <Lightbulb size={14} /> Аналогия
                </div>
                <p className="text-lg leading-relaxed text-fg">{lesson.association}</p>
              </div>
            )}

            {/* 📖 Theory */}
            {lesson.theory && (
              <Section icon={BookOpen} label="Разбор темы">
                <TheoryRenderer html={lesson.theory} />
              </Section>
            )}

            {/* 💼 Where it's useful */}
            {lesson.real_example && (
              <div className="mt-5 flex gap-3 rounded-2xl border border-border bg-card-hover/50 p-4">
                <Briefcase size={18} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-fg-muted">
                  <span className="font-semibold text-fg">Где пригодится: </span>
                  {lesson.real_example}
                </p>
              </div>
            )}

            {/* 💻 Example + explanation */}
            {lesson.example && (
              <Section icon={Code2} label="Пример кода">
                <CodeBlock code={lesson.example} lang={lang} />
                {lang === "html" && <LivePreview code={lesson.example} />}
                {lesson.code_explained && (
                  <div className="mt-4 rounded-2xl border border-border bg-card p-5">
                    <div className="mb-2 text-sm font-semibold text-fg">🔑 Что здесь происходит</div>
                    <TheoryRenderer html={lesson.code_explained} className="text-[0.95rem]" />
                  </div>
                )}
              </Section>
            )}

            {/* Retrieval practice — predict before you peek (Make It Stick) */}
            {lesson.check && (
              <PredictCheck check={lesson.check} lang={lang} courseId={courseId} lessonId={lid} />
            )}

            {/* ⚠️ Common mistakes — collapsed by default to reduce overwhelm */}
            {lesson.common_mistakes.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  onClick={() => setShowMistakes((v) => !v)}
                  className="flex w-full items-center gap-2 px-5 py-4 text-left font-semibold text-fg"
                >
                  <TriangleAlert size={16} className="text-amber-500" />
                  Частые ошибки
                  <span className="ml-1 rounded-full bg-card-hover px-2 py-0.5 text-xs text-fg-subtle">
                    {lesson.common_mistakes.length}
                  </span>
                  <ChevronDown
                    size={18}
                    className={cn("ml-auto text-fg-subtle transition-transform", showMistakes && "rotate-180")}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {showMistakes && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ul className="space-y-2.5 border-t border-border-soft px-5 py-4">
                        {lesson.common_mistakes.map((m, i) => (
                          <li key={i} className="flex gap-2.5 text-sm text-fg-muted">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                            <TheoryRenderer html={m} className="text-sm leading-relaxed" />
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Adaptive explainer (zero-token mentor) */}
            <AdaptiveExplainer courseId={courseId} lessonId={lid} lang={lang} />

            {/* Closure: recall in your own words (Galperin / Badmaev) */}
            <div className="mt-8 rounded-2xl border border-border bg-card-hover/40 p-5">
              <label className="text-sm font-semibold text-fg">
                💬 Закрепи: объясни тему своими словами
              </label>
              <p className="mt-0.5 text-xs text-fg-subtle">
                Если получилось сформулировать — значит, ты правда понял. Это для тебя, никто не проверяет.
              </p>
              <textarea
                value={ownWords}
                onChange={(e) => setOwnWords(e.target.value)}
                rows={2}
                placeholder="Например: переменная — это коробка с именем, в которую кладёшь значение…"
                className="mt-3 w-full resize-none rounded-xl border border-border bg-bg-soft px-3 py-2 text-sm text-fg outline-none focus:border-primary"
              />
              {ownWords.trim().length > 12 && (
                <p className="mt-2 text-xs font-medium text-success">👏 Отлично — ты только что закрепил тему.</p>
              )}
            </div>

            {/* Next-step card */}
            <div className="mt-4 rounded-2xl border border-border bg-card p-5">
              <AnimatePresence>
                {readFlash && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success"
                  >
                    <Check size={16} /> {readFlash}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button onClick={handleRead} disabled={readMut.isPending}>
                  <CheckCircle2 size={17} />
                  {lesson.status === "done" ? "Прочитано" : "Понятно, отметить"}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!lesson.nav.prev_id}
                    onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.nav.prev_id}`)}
                  >
                    <ArrowLeft size={16} /> Назад
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={!lesson.nav.next_id}
                    onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.nav.next_id}`)}
                  >
                    Следующая тема <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Related — shown inline on mobile/tablet (sidebar is desktop-only) */}
            {related && related.items.length > 0 && (
              <div className="mt-8 lg:hidden">
                <div className="mb-3 text-sm font-semibold text-fg">Похожие темы</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {related.items.slice(0, 4).map((r) => (
                    <Link
                      key={`${r.course_id}-${r.lesson_id}`}
                      to={`/courses/${r.course_id}/lessons/${r.lesson_id}`}
                      className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-fg-muted hover:bg-card-hover hover:text-fg"
                    >
                      <span className="mr-1">{r.course_emoji}</span>
                      {r.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* ───── Right ───── */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-5">
              {course?.progress && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-2 text-sm font-semibold text-fg">Прогресс курса</div>
                  <ProgressBar value={course.progress.percent} color={course.accent} />
                  <div className="mt-2 text-xs text-fg-muted">
                    {course.progress.done} / {course.progress.total} тем · {course.progress.percent}%
                  </div>
                </div>
              )}

              {related && related.items.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-3 text-sm font-semibold text-fg">Похожие темы</div>
                  <div className="space-y-1">
                    {related.items.map((r) => (
                      <Link
                        key={`${r.course_id}-${r.lesson_id}`}
                        to={`/courses/${r.course_id}/lessons/${r.lesson_id}`}
                        className="block rounded-lg px-2 py-2 text-sm text-fg-muted transition-colors hover:bg-card-hover hover:text-fg"
                      >
                        <span className="mr-1">{r.course_emoji}</span>
                        {r.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function Section({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof BookOpen;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-fg-subtle">
        <Icon size={14} /> {label}
      </div>
      {children}
    </section>
  );
}

function LessonSidebar({ course, currentId }: { course: CourseDetail; currentId: number }) {
  // Only the stage with the current lesson is open by default → no wall of text.
  const currentStageId = useMemo(
    () => course.stages.find((s) => s.lessons.some((l) => l.id === currentId))?.id ?? course.stages[0]?.id,
    [course, currentId],
  );
  const [openStages, setOpenStages] = useState<Set<number>>(
    () => new Set(currentStageId !== undefined ? [currentStageId] : []),
  );

  useEffect(() => {
    if (currentStageId !== undefined) {
      setOpenStages((prev) => new Set(prev).add(currentStageId));
    }
  }, [currentStageId]);

  const toggle = (id: number) =>
    setOpenStages((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
        {course.stages.map((stage) => {
          const open = openStages.has(stage.id);
          return (
            <div key={stage.id} className="mb-1">
              <button
                onClick={() => toggle(stage.id)}
                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-xs font-bold uppercase tracking-wide text-fg-subtle hover:bg-card-hover"
              >
                <ChevronRight
                  size={13}
                  className={cn("shrink-0 transition-transform", open && "rotate-90")}
                />
                <span>{stage.emoji}</span>
                <span className="line-clamp-1 flex-1">{stage.title}</span>
                <span className="font-normal normal-case text-fg-subtle">
                  {stage.done}/{stage.total}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-2 space-y-0.5 border-l border-border-soft pl-2">
                      {stage.lessons.map((l) => {
                        const active = l.id === currentId;
                        const Icon =
                          l.status === "done" ? CheckCircle2 : l.status === "current" ? PlayCircle : Circle;
                        return (
                          <Link
                            key={l.id}
                            to={`/courses/${course.id}/lessons/${l.id}`}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                              active
                                ? "bg-primary-soft font-semibold text-primary"
                                : "text-fg-muted hover:bg-card-hover hover:text-fg",
                            )}
                          >
                            <Icon
                              size={14}
                              className={cn(
                                "shrink-0",
                                l.status === "done"
                                  ? "text-success"
                                  : active
                                    ? "text-primary"
                                    : "text-fg-subtle",
                              )}
                            />
                            <span className="line-clamp-1">{l.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
