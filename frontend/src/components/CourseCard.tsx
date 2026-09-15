import { Link } from "react-router-dom";
import type { CourseCard as CourseCardType } from "@/lib/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { pluralize } from "@/lib/utils";

interface CourseCardProps {
  course: CourseCardType;
  /** Heading level that fits the page outline (h2 under a page H1, h3 under a section H2). */
  as?: "h2" | "h3";
}

/** Typographic course card: title, one line, meta; a 2px progress line once started. */
export function CourseCard({ course, as: Heading = "h3" }: CourseCardProps) {
  const pct = course.progress?.percent ?? 0;
  const started = (course.progress?.done ?? 0) > 0;
  const meta = [
    course.level,
    `${course.stages_count} ${pluralize(course.stages_count, "трек", "трека", "треков")}`,
    `${course.total_lessons} ${pluralize(course.total_lessons, "тема", "темы", "тем")}`,
  ];
  if (started) meta.push(`пройдено ${pct}%`);

  return (
    <Link
      to={`/courses/${course.id}`}
      className="flex h-full min-h-44 flex-col rounded-3xl bg-surface p-6 transition-colors duration-150 ease-out hover:bg-surface-hover md:p-8"
    >
      <Heading className="line-clamp-2 text-title3 font-semibold text-fg">{course.title}</Heading>
      {course.description && (
        <p className="mt-2 line-clamp-1 text-body text-fg-muted" title={course.description}>
          {course.description}
        </p>
      )}
      <p className="mt-auto pt-6 text-caption text-fg-muted">{meta.join(" · ")}</p>
      {started && <ProgressBar value={pct} label={`Курс пройден на ${pct}%`} className="mt-4" />}
    </Link>
  );
}
