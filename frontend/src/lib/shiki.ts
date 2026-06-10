import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import githubDark from "shiki/themes/github-dark-default.mjs";
import githubLight from "shiki/themes/github-light-default.mjs";
import python from "shiki/langs/python.mjs";
import html from "shiki/langs/html.mjs";
import css from "shiki/langs/css.mjs";
import javascript from "shiki/langs/javascript.mjs";
import json from "shiki/langs/json.mjs";
import bash from "shiki/langs/bash.mjs";

export type CodeLang =
  | "python"
  | "html"
  | "css"
  | "javascript"
  | "json"
  | "bash"
  | "text";

const LIGHT = "github-light-default";
const DARK = "github-dark-default";

let highlighterPromise: Promise<HighlighterCore> | null = null;

/** Single shared highlighter with only the languages/themes we use
 *  (fine-grained bundle + JS regex engine → no heavy wasm payload). */
export function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [githubLight, githubDark],
      langs: [python, html, css, javascript, json, bash],
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    });
  }
  return highlighterPromise;
}

/** Highlight code into dual-theme HTML (responds to the `.dark` class via CSS). */
export async function highlight(code: string, lang: CodeLang): Promise<string> {
  const hl = await getHighlighter();
  const safeLang = lang === "text" ? "python" : lang;
  return hl.codeToHtml(code, {
    lang: safeLang,
    themes: { light: LIGHT, dark: DARK },
    defaultColor: false,
  });
}

/** Pick a sensible language from a course id / track. */
export function langForCourse(courseId: string): CodeLang {
  if (courseId === "web_htmlcss") return "html";
  return "python";
}
