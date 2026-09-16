import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Shared across dialogs so that one closing never unlocks scroll under another.
let scrollLocks = 0;

/**
 * Modal behaviour for a mounted dialog node: moves focus inside (to
 * `[data-autofocus]` or the first focusable), traps Tab, closes on Escape,
 * locks page scroll and returns focus to the opener on unmount.
 */
export function useDialog(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));

    (node.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0] ?? node).focus();

    scrollLocks += 1;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      scrollLocks = Math.max(0, scrollLocks - 1);
      if (scrollLocks === 0) document.body.style.overflow = "";
      // Only hand focus back if it is not already inside another dialog.
      const active = document.activeElement;
      if (!active || active === document.body || node.contains(active)) opener?.focus?.();
    };
  }, [ref]);
}
