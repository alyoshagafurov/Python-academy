import DOMPurify from "dompurify";

/**
 * Tags lesson content really renders as HTML: <b>, <i>, <code> from the bot and
 * <br> added by TheoryRenderer. backend/tests/test_launch.py checks every lesson
 * of every course against this list, so sanitizing never changes real content.
 * Escaped markup inside code (&lt;p&gt;) is text and stays text.
 */
export const ALLOWED_TAGS = ["b", "i", "code", "br"];

export function sanitizeLessonHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] });
}
