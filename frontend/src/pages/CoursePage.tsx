import { useId, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { m } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { LessonBrief, StageNode } from "@/lib/types";
import { DURATION, EASE_OUT, useDuration } from "@/lib/motion";
import { cn, pluralize } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { GroupedList, GroupedRow } from "@/components/ui/GroupedList";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/State";
import { PageTransition } from "@/components/PageTransition";

export function CoursePage() {
  const { courseId = "" } = useParams();
  const { data: course, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api.course(courseId),
  });

  const firstLesson = useMemo(() => course?.stages[0]?.lessons[0] ?? null, [course]);

  if (isError) {
    // A missing course is not a server problem: say so, and don't offer a retry that cannot help.
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <Container size="text" className="py-20">
        <ErrorState
          title={missing ? "Такого курса нет" : "Не удалось открыть курс"}
          text={
            missing
              ? "Возможно, в ссылке опечатка. Открой список курсов и выбери нужный."
              : "Сервер не отвечает. Проверь подключение и попробуй ещё раз."
          }
          onRetry={missing ? undefined : () => refetch()}
        />
      </Container>
    );
  }

  if (isLoading || !course) {
    return (
      <Container size="text" className="min-h-dvh pb-24 pt-12 md:pt-20" aria-busy="true">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-4 h-6 w-full" />
        <Skeleton className="mt-8 h-12 w-40 rounded-full" />
        <div className="mt-14 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[52px] w-full" />
          ))}
        </div>
      </Container>
    );
  }

  const meta = [
    course.level,
    `${course.stages_count} ${pluralize(course.stages_count, "трек", "трека", "треков")}`,
    `${course.total_lessons} ${pluralize(course.total_lessons, "тема", "темы", "тем")}`,
  ];

  return (
    <PageTransition>
      <Container size="text" className="pb-24 pt-8 md:pt-12">
        <Link
          to="/courses"
          className="-ml-1 inline-flex min-h-11 items-center gap-1 text-caption text-link hover:underline"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Все курсы
        </Link>

        <title>{`${course.title} — Python Academy`}</title>
        <h1 className="mt-6 text-title1 font-bold tracking-[-0.025em] text-fg">{course.title}</h1>
        {course.description && (
          <p className="mt-4 max-w-[60ch] text-body text-fg-muted md:text-title3">{course.description}</p>
        )}
        <p className="mt-4 text-caption text-fg-muted">{meta.join(" · ")}</p>

        {firstLesson && (
          <ButtonLink
            to={`/courses/${course.id}/lessons/${firstLesson.id}`}
            size="lg"
            pill
            className="mt-8"
          >
            Начать
          </ButtonLink>
        )}

        <h2 className="mt-16 text-title2 font-semibold text-fg">Программа</h2>
        <div className="mt-6 space-y-6">
          {course.stages.map((stage, i) => (
            <StageGroup
              key={stage.id}
              stage={stage}
              courseId={course.id}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      </Container>
    </PageTransition>
  );
}

function StageGroup({
  stage,
  courseId,
  defaultOpen,
}: {
  stage: StageNode;
  courseId: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const d = useDuration();

  return (
    <section aria-labelledby={`${id}-title`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-14 w-full items-center gap-3 rounded-xl text-left"
      >
        <span className="min-w-0 flex-1">
          <span id={`${id}-title`} className="block text-body font-semibold text-fg">
            {stage.title}
          </span>
          {stage.subtitle && (
            <span className="mt-0.5 block text-caption text-fg-muted">{stage.subtitle}</span>
          )}
        </span>
        <span className="shrink-0 text-caption text-fg-muted tabular">
          {stage.total} {pluralize(stage.total, "тема", "темы", "тем")}
        </span>
        <ChevronDown
          size={20}
          aria-hidden="true"
          className={cn("shrink-0 text-fg-muted transition-transform duration-200 ease-out", open && "rotate-180")}
        />
      </button>

      {open && (
        <m.div
          id={`${id}-list`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: d(DURATION.accordion), ease: EASE_OUT }}
        >
          <GroupedList className="mt-2">
            {stage.lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} courseId={courseId} />
            ))}
          </GroupedList>
        </m.div>
      )}
    </section>
  );
}

function LessonRow({ lesson, courseId }: { lesson: LessonBrief; courseId: string }) {
  return (
    <GroupedRow
      to={`/courses/${courseId}/lessons/${lesson.id}`}
      trailing={<ChevronRight size={18} aria-hidden="true" />}
    >
      <span className="line-clamp-2">{lesson.title}</span>
    </GroupedRow>
  );
}
