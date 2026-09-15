import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const LESSON_PATH = /^\/courses\/([\w-]+)\/lessons\/(\d+)$/;
// Long enough that a hover followed by a click reuses the data instead of refetching.
const PREFETCH_STALE_MS = 60_000;

/**
 * Starts loading a lesson and its course tree when a pointer rests on, a finger
 * touches or keyboard focus reaches a link to that lesson, so the lesson page
 * opens with its data already in the query cache. One delegated listener covers
 * every lesson link on the site; the query keys match LessonPage.
 */
export function LessonPrefetch() {
  const qc = useQueryClient();

  useEffect(() => {
    const prefetch = (event: Event) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.origin !== window.location.origin) return;
      const match = LESSON_PATH.exec(link.pathname);
      if (!match) return;
      const courseId = match[1];
      const lessonId = Number(match[2]);
      void qc.prefetchQuery({
        queryKey: ["lesson", courseId, lessonId],
        queryFn: () => api.lesson(courseId, lessonId),
        staleTime: PREFETCH_STALE_MS,
      });
      void qc.prefetchQuery({
        queryKey: ["course", courseId],
        queryFn: () => api.course(courseId),
        staleTime: PREFETCH_STALE_MS,
      });
    };

    const options: AddEventListenerOptions = { capture: true, passive: true };
    document.addEventListener("pointerover", prefetch, options);
    document.addEventListener("touchstart", prefetch, options);
    document.addEventListener("focusin", prefetch, options);
    return () => {
      document.removeEventListener("pointerover", prefetch, options);
      document.removeEventListener("touchstart", prefetch, options);
      document.removeEventListener("focusin", prefetch, options);
    };
  }, [qc]);

  return null;
}
