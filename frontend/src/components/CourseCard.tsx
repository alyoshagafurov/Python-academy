import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";
import type { CourseCard as CourseCardType } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { courseCover } from "@/lib/covers";

export function CourseCard({ course, index = 0 }: { course: CourseCardType; index?: number }) {
  const pct = course.progress?.percent ?? 0;
  const started = (course.progress?.done ?? 0) > 0;
  const cover = courseCover(course.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to={`/courses/${course.id}`} className="group block h-full">
        <div
          className={cn(
            "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card",
            "transition-all duration-300 hover:-translate-y-1 hover:border-transparent",
            "hover:shadow-[0_24px_60px_-30px_var(--primary)]",
          )}
        >
          {/* Cover */}
          <div
            className="relative h-40 overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${course.gradient[0]}, ${course.gradient[1]})` }}
          >
            {cover && (
              <img
                src={cover}
                alt={course.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
              />
            )}
            {/* Fade into the card body for a seamless look */}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/15 to-transparent" />
            <Badge className="absolute right-3 top-3 bg-black/40 text-white backdrop-blur-sm" tone="default">
              {course.level}
            </Badge>
            <span className="absolute bottom-3 left-3 grid h-10 w-10 place-items-center rounded-xl bg-black/40 text-2xl shadow-lg backdrop-blur-sm">
              {course.emoji}
            </span>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col p-5">
            <h3 className="text-lg font-bold text-fg">{course.title}</h3>
            <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-fg-muted">
              {course.description || "Теория с ассоциациями, примеры и режим «объяснить проще»."}
            </p>

            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-fg-subtle">
              <BookOpen size={14} />
              {course.total_lessons} тем · {course.stages_count} треков
            </div>

            {course.progress && started ? (
              <div className="mt-3">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-fg-muted">Прогресс</span>
                  <span className="font-semibold text-fg">{pct}%</span>
                </div>
                <ProgressBar value={pct} color={course.accent} />
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Начать <ArrowRight size={15} />
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
