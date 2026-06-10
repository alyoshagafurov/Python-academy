import { useEffect } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

/**
 * Fixed, mouse-reactive ambient backdrop for the landing page:
 *  • a soft spotlight that follows the cursor,
 *  • two slow-floating gradient blobs,
 *  • a faint grid masked to fade at the edges.
 * Pointer-events disabled so it never blocks clicks.
 */
export function InteractiveBackground() {
  const mx = useMotionValue(50);
  const my = useMotionValue(22);
  const sx = useSpring(mx, { stiffness: 50, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 50, damping: 20, mass: 0.6 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth) * 100);
      my.set((e.clientY / window.innerHeight) * 100);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  const spotlight = useMotionTemplate`radial-gradient(38rem 38rem at ${sx}% ${sy}%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 60%)`;
  const blobX = useMotionTemplate`${sx}%`;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Static ambient wash */}
      <div className="absolute inset-0 [background:radial-gradient(50rem_30rem_at_80%_-5%,color-mix(in_oklab,var(--accent)_12%,transparent),transparent_60%)]" />
      {/* Mouse spotlight */}
      <motion.div className="absolute inset-0" style={{ background: spotlight }} />
      {/* Floating blobs */}
      <motion.div
        className="absolute h-[26rem] w-[26rem] rounded-full opacity-40 blur-[90px]"
        style={{
          left: blobX,
          top: "10%",
          x: "-50%",
          background: "radial-gradient(circle, var(--primary), transparent 70%)",
          animation: "floaty 14s ease-in-out infinite",
        }}
      />
      <div
        className="absolute right-[6%] top-[40%] h-[22rem] w-[22rem] rounded-full opacity-30 blur-[90px]"
        style={{
          background: "radial-gradient(circle, var(--accent), transparent 70%)",
          animation: "floaty 18s ease-in-out infinite reverse",
        }}
      />
      {/* Grid */}
      <div className="bg-grid absolute inset-0 opacity-60" />
    </div>
  );
}
