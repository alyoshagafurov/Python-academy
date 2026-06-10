import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/** A slick dot + lagging ring cursor. Enabled only on fine-pointer (desktop). */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [down, setDown] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 320, damping: 28, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 320, damping: 28, mass: 0.5 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    document.documentElement.classList.add("cursor-none");

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      setHovering(!!t.closest?.("a, button, [role=button], input, [data-cursor]"));
    };
    const dn = () => setDown(true);
    const up = () => setDown(false);

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    window.addEventListener("mousedown", dn);
    window.addEventListener("mouseup", up);
    return () => {
      document.documentElement.classList.remove("cursor-none");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", dn);
      window.removeEventListener("mouseup", up);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div style={{ x, y }} className="pointer-events-none fixed left-0 top-0 z-[100]">
        <div className="h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary mix-blend-difference" />
      </motion.div>
      <motion.div style={{ x: ringX, y: ringY }} className="pointer-events-none fixed left-0 top-0 z-[100]">
        <motion.div
          className="-translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/60"
          animate={{
            width: hovering ? 56 : 34,
            height: hovering ? 56 : 34,
            opacity: down ? 0.4 : hovering ? 1 : 0.7,
            scale: down ? 0.85 : 1,
          }}
          transition={{ duration: 0.18 }}
        />
      </motion.div>
    </>
  );
}
