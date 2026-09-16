import type { ReactNode } from "react";

/** Home sections render in place, visible from the first frame. Sections that
 *  slide in on scroll are ruled out by the design (and left blank bands in link
 *  previews and full-page captures), so this is a plain wrapper kept for layout. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
