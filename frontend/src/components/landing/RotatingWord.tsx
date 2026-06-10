import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Cycles through words with a slide/blur transition (gradient-styled). */
export function RotatingWord({ words, interval = 2200 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);

  return (
    <span className="relative inline-grid">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={words[i]}
          initial={{ y: "0.5em", opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-0.5em", opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="animate-gradient-text bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent [grid-area:1/1]"
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
