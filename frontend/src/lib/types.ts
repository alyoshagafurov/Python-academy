// Shapes mirror the FastAPI responses (see backend/app).

export interface Progress {
  done: number;
  total: number;
  percent: number;
}

export interface CourseCard {
  id: string;
  title: string;
  emoji: string;
  description: string;
  language: string;
  track: string;
  level: string;
  level_order: number;
  accent: string;
  gradient: [string, string];
  total_lessons: number;
  stages_count: number;
  progress: Progress | null;
}

export type LessonStatus = "done" | "current" | "todo";

export interface LessonBrief {
  id: number;
  course_id: string;
  stage_id: number;
  title: string;
  topic: string;
  topic_name: string;
  xp: number;
  status: LessonStatus;
  bookmarked: boolean;
  placeholder: boolean;
}

export interface StageNode {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  status: string;
  done: number;
  total: number;
  percent: number;
  lessons: LessonBrief[];
}

export interface CourseDetail extends CourseCard {
  stages: StageNode[];
}

export interface LessonNav {
  prev_id: number | null;
  next_id: number | null;
}

export interface LessonCheck {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  code: string;
}

export interface LessonFull extends LessonBrief {
  course_title: string;
  course_emoji: string;
  theory: string;
  association: string;
  real_example: string;
  example: string;
  code_explained: string;
  common_mistakes: string[];
  check: LessonCheck | null;
  nav: LessonNav;
}

export interface LessonSimple {
  title: string;
  analogy: string;
  gist: string;
  example: string;
  pitfall: string;
}

export interface RelatedItem {
  course_id: string;
  course_title: string;
  course_emoji: string;
  lesson_id: number;
  title: string;
  topic_name: string;
}

export interface SearchHit {
  course_id: string;
  course_title: string;
  course_emoji: string;
  lesson_id: number;
  title: string;
  topic: string;
  topic_name: string;
  score: number;
  snippet: string;
}

export interface Stats {
  students: number;
  students_real: number;
  courses: number;
  lessons: number;
}

export interface User {
  id: number;
  username: string | null;
  xp: number;
  is_pro: boolean;
}

export interface ProfileCourse {
  id: string;
  title: string;
  emoji: string;
  accent: string;
  percent: number;
  done: number;
  total: number;
}

export interface Profile {
  user: {
    id: number;
    username: string | null;
    xp: number;
    level: number;
    level_title: string;
    level_percent: number;
    xp_to_next: number;
    streak: number;
    best_streak: number;
    is_pro: boolean;
  } | null;
  courses: ProfileCourse[];
  bookmarks_count: number;
}

export interface BookmarkItem {
  course_id: string;
  course_title: string;
  course_emoji: string;
  lesson_id: number;
  title: string;
  topic_name: string;
}

export interface Recommendation extends BookmarkItem {
  reason: string;
}

export interface AuthConfig {
  telegram_enabled: boolean;
  telegram_bot_username: string;
  dev_auth_enabled: boolean;
}

export interface DevUser {
  user_id: number;
  username: string | null;
  xp: number;
}

export interface ReadResult {
  awarded: boolean;
  xp_gain: number;
  already_done: boolean;
  progress: Progress;
  current_lesson: number | null;
}

// ── Mentor (validation MVP) ──
export interface MentorHint {
  rung: number;
  total: number;
  kind: "question" | "hint" | "reasoning" | "solution";
  text: string;
  is_solution: boolean;
  can_escalate: boolean;
  ai_available: boolean;
}

export interface ExplainBlock {
  kind: "text" | "code";
  text: string;
}
export interface ExplainView {
  style: string;
  blocks: ExplainBlock[];
  ai_available: boolean;
}
export interface MentorStyle {
  id: string;
  label: string;
}

export interface MentorPoint {
  course_id: string;
  lesson_id: number;
  title: string;
  score?: number;
  clicks?: number;
  count?: number;
}
export interface MentorAnalytics {
  totals: Record<string, number>;
  mentor_ctr_percent: number;
  retry_rate_percent: number;
  recovery_rate_percent: number;
  completion_delta_percent: { with_mentor: number; without_mentor: number };
  confusion_points: MentorPoint[];
  help_hotspots: MentorPoint[];
  dropoff_points: MentorPoint[];
}

export type MentorEvent =
  | "lesson_view"
  | "lesson_read"
  | "check_attempt"
  | "check_recovered"
  | "retry_after_hint"
  | "mentor_open"
  | "explain_not_helpful";
