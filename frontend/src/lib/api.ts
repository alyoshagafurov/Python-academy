import type {
  AuthConfig,
  BookmarkItem,
  CourseCard,
  CourseDetail,
  DevUser,
  ExplainView,
  LessonFull,
  LessonSimple,
  MentorAnalytics,
  MentorEvent,
  MentorHint,
  MentorStyle,
  Profile,
  ReadResult,
  Recommendation,
  RelatedItem,
  SearchHit,
  Stats,
  User,
} from "./types";
import { getAnonId } from "./anon";

/** Same-origin in dev (Vite proxies /api → backend). Override with VITE_API_BASE. */
const BASE = import.meta.env.VITE_API_BASE ?? "";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Anon-Id": getAnonId(),
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // meta
  stats: () => request<Stats>("/api/stats"),

  // auth
  authConfig: () => request<AuthConfig>("/api/auth/config"),
  session: () => request<{ user: User | null }>("/api/auth/session"),
  devUsers: () => request<{ users: DevUser[] }>("/api/auth/dev/users"),
  devLogin: (user_id: number, username?: string) =>
    request<{ user: User | null }>("/api/auth/dev", {
      method: "POST",
      body: JSON.stringify({ user_id, username }),
    }),
  telegramLogin: (payload: Record<string, unknown>) =>
    request<{ user: User | null }>("/api/auth/telegram", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  // courses
  courses: () => request<{ courses: CourseCard[] }>("/api/courses"),
  course: (id: string) => request<CourseDetail>(`/api/courses/${id}`),

  // lessons
  lesson: (courseId: string, lessonId: number) =>
    request<LessonFull>(`/api/courses/${courseId}/lessons/${lessonId}`),
  lessonSimple: (courseId: string, lessonId: number) =>
    request<LessonSimple>(`/api/courses/${courseId}/lessons/${lessonId}/simple`),
  lessonRelated: (courseId: string, lessonId: number) =>
    request<{ items: RelatedItem[] }>(
      `/api/courses/${courseId}/lessons/${lessonId}/related`,
    ),
  markRead: (courseId: string, lessonId: number) =>
    request<ReadResult>(`/api/courses/${courseId}/lessons/${lessonId}/read`, {
      method: "POST",
    }),

  // search
  search: (q: string, limit = 12) =>
    request<{ query: string; hits: SearchHit[] }>(
      `/api/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),

  // me
  profile: () => request<Profile>("/api/me"),
  bookmarks: () => request<{ items: BookmarkItem[] }>("/api/me/bookmarks"),
  recommendations: () =>
    request<{ items: Recommendation[] }>("/api/me/recommendations"),
  toggleBookmark: (course_id: string, lesson_id: number) =>
    request<{ bookmarked: boolean }>("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify({ course_id, lesson_id }),
    }),

  // mentor (validation MVP)
  mentorHint: (course_id: string, lesson_id: number) =>
    request<MentorHint>("/api/mentor/hint", {
      method: "POST",
      body: JSON.stringify({ course_id, lesson_id }),
    }),
  mentorExplain: (course_id: string, lesson_id: number, style: string) =>
    request<ExplainView>("/api/mentor/explain", {
      method: "POST",
      body: JSON.stringify({ course_id, lesson_id, style }),
    }),
  mentorStyles: () => request<{ styles: MentorStyle[] }>("/api/mentor/styles"),
  mentorAnalytics: () => request<MentorAnalytics>("/api/mentor/analytics"),
  // Fire-and-forget telemetry — never let logging break the UX.
  mentorEvent: (
    type: MentorEvent,
    course_id?: string,
    lesson_id?: number,
    meta?: Record<string, unknown>,
  ) =>
    request("/api/mentor/event", {
      method: "POST",
      body: JSON.stringify({ type, course_id, lesson_id, meta }),
    }).catch(() => undefined),
};

export { ApiError };
