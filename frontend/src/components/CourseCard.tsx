import { Link } from "react-router-dom";
import type { CourseCard as CourseCardType } from "@/lib/types";
import { pluralize } from "@/lib/utils";

interface CourseCardProps {
  course: CourseCardType;
  /** Heading level that fits the page outline (h2 under a page H1, h3 under a section H2). */
  as?: "h2" | "h3";
}

/** Typographic course card: title, one line, meta. */
export function CourseCard({ course, as: Heading = "h3" }: CourseCardProps) {
  const meta = [
    course.level,
    `${course.stages_count} ${pluralize(course.stages_count, "трек", "трека", "треков")}`,
    `${course.total_lessons} ${pluralize(course.total_lessons, "тема", "темы", "тем")}`,
  ];

  return (
    <Link
      to={`/courses/${course.id}`}
      className="flex h-full min-h-44 flex-col rounded-3xl bg-surface p-6 transition-colors duration-150 ease-out hover:bg-surface-hover md:p-8"
    >
      <Heading className="line-clamp-2 text-title3 font-semibold text-fg">{course.title}</Heading>
      {course.description && (
        <p className="mt-2 text-body text-fg-muted">
          {course.description}
        </p>
      )}
      <p className="mt-auto pt-6 text-caption text-fg-muted">{meta.join(" · ")}</p>
    </Link>
  );
}
