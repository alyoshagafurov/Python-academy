import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { useDialog } from "@/hooks/useDialog";
import { DURATION, EASE_OUT, useDuration } from "@/lib/motion";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Bottom sheet for narrow screens: overlay fade, panel opacity + scale 0.97→1. */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <SheetPanel onClose={onClose} title={title}>
          {children}
        </SheetPanel>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function SheetPanel({ onClose, title, children }: Omit<SheetProps, "open">) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const d = useDuration();
  useDialog(ref, onClose);

  const enter = { duration: d(DURATION.enter), ease: EASE_OUT };
  const exit = { duration: d(DURATION.exit), ease: EASE_OUT };

  return (
    <div className="fixed inset-0 z-50">
      <m.div
        aria-hidden="true"
        className="absolute inset-0 bg-overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: enter }}
        exit={{ opacity: 0, transition: exit }}
      />
      <m.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] origin-bottom flex-col rounded-t-3xl bg-bg dark:bg-surface"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1, transition: enter }}
        exit={{ opacity: 0, scale: 0.97, transition: exit }}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-5 pr-2">
          <h2 id={titleId} className="text-body font-semibold text-fg">
            {title}
          </h2>
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            aria-label="Закрыть"
            className="grid h-11 w-11 place-items-center rounded-xl text-fg-muted hover:bg-surface-hover hover:text-fg"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {children}
        </div>
      </m.div>
    </div>
  );
}
