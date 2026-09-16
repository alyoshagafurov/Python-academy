import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { CourseDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LessonTocProps {
  course: CourseDetail;
  currentId: number;
  /** Called when a topic link is chosen (closes the mobile sheet). */
  onNavigate?: () => void;
}

/** Course tree for the lesson page: only the current track is open by default. */
export function LessonToc({ course, currentId, onNavigate }: LessonTocProps) {
  const currentStageId = useMemo(
    () => course.stages.find((s) => s.lessons.some((l) => l.id === currentId))?.id ?? course.stages[0]?.id,
    [course, currentId],
  );
  const [openStages, setOpenStages] = useState<Set<number>>(
    () => new Set(currentStageId !== undefined ? [currentStageId] : []),
  );

  // Moving to a lesson in another track opens that track too (adjusted during render).
  const [seenStageId, setSeenStageId] = useState(currentStageId);
  if (seenStageId !== currentStageId) {
    setSeenStageId(currentStageId);
    if (currentStageId !== undefined) setOpenStages((prev) => new Set(prev).add(currentStageId));
  }

  const toggle = (id: number) =>
    setOpenStages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <nav aria-label="Темы курса">
      <ul className="space-y-1">
        {course.stages.map((stage) => {
          const open = openStages.has(stage.id);
          const listId = `toc-stage-${stage.id}`;
          return (
            <li key={stage.id}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                onClick={() => toggle(stage.id)}
                className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-caption font-semibold text-fg transition-colors duration-150 ease-out hover:bg-surface"
              >
                <ChevronRight
                  size={16}
                  aria-hidden="true"
                  className={cn("shrink-0 text-fg-muted transition-transform duration-200 ease-out", open && "rotate-90")}
                />
                <span className="line-clamp-2 flex-1">{stage.title}</span>
                <span className="shrink-0 font-normal text-fg-muted tabular">{stage.total}</span>
              </button>

              {open && (
                <ul id={listId} className="mb-2 mt-1 space-y-0.5 pl-6">
                  {stage.lessons.map((l) => {
                    const active = l.id === currentId;
                    return (
                      <li key={l.id}>
                        <Link
                          to={`/courses/${course.id}/lessons/${l.id}`}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex min-h-11 items-center gap-2 rounded-lg px-2 py-1.5 text-caption transition-colors duration-150 ease-out",
                            active ? "bg-surface font-medium text-fg" : "text-fg-muted hover:bg-surface hover:text-fg",
                          )}
                        >
                          <span className="line-clamp-2">{l.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
