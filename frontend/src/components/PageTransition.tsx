import { useLayoutEffect, type ReactNode } from "react";

/** Route wrapper. Pages appear instantly — no route animation — and each page
 *  opens at the top instead of inheriting the previous page's scroll position. */
export function PageTransition({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return <>{children}</>;
}
