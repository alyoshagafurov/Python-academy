// Shapes mirror the FastAPI responses (see backend/app).
// The site has no accounts: nothing here describes a reader.

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
}

export interface LessonBrief {
  id: number;
  course_id: string;
  stage_id: number;
  title: string;
  topic: string;
  topic_name: string;
  placeholder: boolean;
}

export interface StageNode {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  total: number;
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
  courses: number;
  lessons: number;
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

export type MentorEvent =
  | "lesson_view"
  | "check_attempt"
  | "check_recovered"
  | "retry_after_hint"
  | "mentor_open"
  | "explain_not_helpful";
