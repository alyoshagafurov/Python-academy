import { motion } from "framer-motion";
import { Flame, Star, Trophy } from "lucide-react";
import { TiltCard } from "./TiltCard";
import { BrowserFrame, LessonPreviewBody } from "./BrowserFrame";

/** Hero centerpiece: a tilting app window with floating UI chips around it. */
export function HeroShowcase() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] opacity-50 blur-3xl"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
      />

      <TiltCard intensity={9}>
        <BrowserFrame url="knowledgehub.app/python/variables">
          <LessonPreviewBody />
        </BrowserFrame>
      </TiltCard>

      <FloatingChip className="-left-6 top-10" delay={0} from="-40px">
        <Trophy size={15} className="text-accent" />
        <span className="font-semibold text-fg">Уровень 4</span>
      </FloatingChip>

      <FloatingChip className="-right-5 top-1/3" delay={1.2} from="40px">
        <Flame size={15} className="text-orange-500" />
        <span className="font-semibold text-fg">7 дней подряд</span>
      </FloatingChip>

      <FloatingChip className="-bottom-5 left-10" delay={0.6} from="40px">
        <Star size={15} className="fill-accent text-accent" />
        <span className="font-semibold text-fg">Сохранено в избранное</span>
      </FloatingChip>
    </div>
  );
}

function FloatingChip({
  children,
  className,
  delay,
  from,
}: {
  children: React.ReactNode;
  className?: string;
  delay: number;
  from: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: from }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.5 + delay * 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute z-10 ${className}`}
    >
      <div
        className="flex items-center gap-1.5 rounded-2xl border border-border bg-card/90 px-3 py-2 text-sm shadow-xl backdrop-blur"
        style={{ animation: `floaty ${6 + delay}s ease-in-out infinite` }}
      >
        {children}
      </div>
    </motion.div>
  );
}
