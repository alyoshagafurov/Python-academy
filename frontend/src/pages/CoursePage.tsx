import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  PlayCircle,
  Star,
} from "lucide-react";
import { api } from "@/lib/api";
import { courseCover } from "@/lib/covers";
import type { LessonBrief, StageNode } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PageTransition } from "@/components/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";

export function CoursePage() {
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api.course(courseId),
  });

  const continueLesson = useMemo(() => {
    if (!course) return null;
    for (const s of course.stages)
      for (const l of s.lessons) if (l.status === "current") return l;
    return course.stages[0]?.lessons[0] ?? null;
  }, [course]);

  if (isLoading || !course) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Skeleton className="h-48 w-full" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const pct = course.progress?.percent ?? 0;
  const started = (course.progress?.done ?? 0) > 0;
  const cover = courseCover(course.id);

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          to="/courses"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft size={15} /> Все курсы
        </Link>

        {/* Header */}
        <div
          className="relative overflow-hidden rounded-3xl border border-border p-8 text-white"
          style={{
            background: `linear-gradient(135deg, ${course.gradient[0]}, ${course.gradient[1]})`,
          }}
        >
          {cover && (
            <img
              src={cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-45"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/25 to-transparent" />
          <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_20%_10%,white,transparent_50%)]" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="text-5xl">{course.emoji}</span>
              <Badge className="bg-black/25 text-white backdrop-blur">{course.level}</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{course.title}</h1>
            <p className="mt-2 max-w-2xl text-white/85">{course.description}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen size={15} /> {course.total_lessons} тем
              </span>
              <span>·</span>
              <span>{course.stages_count} треков</span>
            </div>

            {continueLesson && (
              <Button
                size="lg"
                className="mt-6 bg-white text-black hover:bg-white/90 shadow-none"
                onClick={() =>
                  navigate(`/courses/${course.id}/lessons/${continueLesson.id}`)
                }
              >
                {started ? "Продолжить" : "Начать курс"} <ArrowRight size={18} />
              </Button>
            )}
          </div>
        </div>

        {/* Progress */}
        {started && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold text-fg">Твой прогресс</span>
              <span className="text-fg-muted">
                {course.progress?.done} / {course.progress?.total} тем · {pct}%
              </span>
            </div>
            <ProgressBar value={pct} color={course.accent} height={10} />
          </div>
        )}

        {/* Curriculum */}
        <h2 className="mb-4 mt-10 text-2xl font-bold text-fg">Программа курса</h2>
        <div className="space-y-3">
          {course.stages.map((stage, i) => (
            <StageAccordion
              key={stage.id}
              stage={stage}
              courseId={course.id}
              defaultOpen={
                i === 0 || stage.lessons.some((l) => l.status === "current")
              }
            />
          ))}
        </div>
      </div>
    </PageTransition>
  );
}

function StageAccordion({
  stage,
  courseId,
  defaultOpen,
}: {
  stage: StageNode;
  courseId: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="text-xl">{stage.emoji}</span>
        <div className="flex-1">
          <div className="font-semibold text-fg">{stage.title}</div>
          <div className="text-xs text-fg-subtle">{stage.subtitle}</div>
        </div>
        <span className="text-xs text-fg-muted">
          {stage.done}/{stage.total}
        </span>
        <ChevronDown
          size={18}
          className={`text-fg-subtle transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="border-t border-border-soft">
              {stage.lessons.map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} courseId={courseId} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LessonRow({ lesson, courseId }: { lesson: LessonBrief; courseId: string }) {
  const Icon =
    lesson.status === "done"
      ? CheckCircle2
      : lesson.status === "current"
        ? PlayCircle
        : Circle;
  return (
    <Link
      to={`/courses/${courseId}/lessons/${lesson.id}`}
      className="flex items-center gap-3 border-b border-border-soft px-5 py-3 last:border-0 hover:bg-card-hover"
    >
      <Icon
        size={18}
        className={
          lesson.status === "done"
            ? "text-success"
            : lesson.status === "current"
              ? "text-primary"
              : "text-fg-subtle"
        }
      />
      <span className="flex-1 text-sm text-fg">{lesson.title}</span>
      {lesson.bookmarked && <Star size={14} className="fill-accent text-accent" />}
      <span className="text-xs text-fg-subtle">+{lesson.xp} XP</span>
    </Link>
  );
}
