import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { createCssVariablesTheme } from "shiki/theme-css-variables";
import python from "shiki/langs/python.mjs";
import html from "shiki/langs/html.mjs";
import css from "shiki/langs/css.mjs";
import javascript from "shiki/langs/javascript.mjs";
import json from "shiki/langs/json.mjs";
import bash from "shiki/langs/bash.mjs";
import type { CodeLang } from "./codeLang";

/** Token colours come from `--shiki-*` variables in index.css, so one theme
 *  serves light and dark and every token keeps ≥ 4.5:1 contrast.
 *  Import this module dynamically only — it must never land in the home bundle. */
const THEME = createCssVariablesTheme({
  name: "vitrine",
  variablePrefix: "--shiki-",
  fontStyle: true,
});

let highlighterPromise: Promise<HighlighterCore> | null = null;

/** Single shared highlighter with only the languages we use
 *  (fine-grained bundle + JS regex engine → no heavy wasm payload). */
export function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [THEME],
      langs: [python, html, css, javascript, json, bash],
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    });
  }
  return highlighterPromise;
}

/** Highlight code into HTML whose colours follow the active theme via CSS variables. */
export async function highlight(code: string, lang: CodeLang): Promise<string> {
  const hl = await getHighlighter();
  const safeLang = lang === "text" ? "python" : lang;
  return hl.codeToHtml(code, { lang: safeLang, theme: "vitrine" });
}
