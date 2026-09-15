import type { CodeLang } from "./codeLang";

type Pending = { resolve: (html: string) => void; reject: (error: Error) => void };

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, Pending>();

function getWorker(): Worker | null {
  if (worker) return worker;
  if (typeof Worker === "undefined") return null;
  worker = new Worker(new URL("./shiki.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<{ id: number; html?: string; error?: string }>) => {
    const { id, html, error } = event.data;
    const request = pending.get(id);
    if (!request) return;
    pending.delete(id);
    if (error !== undefined || html === undefined) request.reject(new Error(error ?? "empty highlight"));
    else request.resolve(html);
  };
  worker.onerror = () => {
    pending.forEach((request) => request.reject(new Error("highlight worker failed")));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

/** Highlighted HTML for lesson code, computed in one shared Web Worker.
 *  Without worker support it falls back to highlighting on the main thread. */
export function highlightOffThread(code: string, lang: CodeLang): Promise<string> {
  const target = getWorker();
  if (!target) return import("./shiki").then(({ highlight }) => highlight(code, lang));
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    target.postMessage({ id, code, lang });
  });
}
