import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

// Enough for the new page's data and heading to render before it is read.
const ANNOUNCE_DELAY_MS = 600;

/**
 * Screen readers get no signal when a single-page app changes route. After each
 * navigation this polite live region reads the new page's heading (or title),
 * and focus moves to <main> so the next Tab starts inside the new page.
 */
export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [message, setMessage] = useState("");
  const firstPath = useRef(pathname);

  useEffect(() => {
    if (pathname === firstPath.current) return; // the initial load is announced by the browser
    firstPath.current = "";
    const timer = window.setTimeout(() => {
      const heading = document.querySelector("main h1")?.textContent?.trim();
      setMessage(`Открыта страница: ${heading || document.title}`);
      document.getElementById("main")?.focus({ preventScroll: true });
    }, ANNOUNCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </p>
  );
}
