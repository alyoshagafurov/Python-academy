// Highlights lesson code off the main thread. Compiling the grammar and tokenizing
// took one ~400 ms task on a throttled phone; in a worker the page stays responsive.
import { highlight } from "./shiki";
import type { CodeLang } from "./codeLang";

interface HighlightRequest {
  id: number;
  code: string;
  lang: CodeLang;
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<HighlightRequest>) => void) | null;
  postMessage: (message: unknown) => void;
};

scope.onmessage = (event) => {
  const { id, code, lang } = event.data;
  highlight(code, lang)
    .then((html) => scope.postMessage({ id, html }))
    .catch((error: unknown) => scope.postMessage({ id, error: String(error) }));
};
