// Language helpers kept apart from lib/shiki.ts so importing them never pulls
// the highlighter into a bundle (Shiki is loaded on demand by CodeBlock).

export type CodeLang =
  | "python"
  | "html"
  | "css"
  | "javascript"
  | "json"
  | "bash"
  | "text"
  // A step-by-step calculation, not code: plain monospace, never highlighted.
  | "math";

/** Pick a sensible language from a course id / track. */
export function langForCourse(courseId: string): CodeLang {
  if (courseId === "web_htmlcss") return "html";
  if (courseId.startsWith("math_")) return "math";
  return "python";
}
