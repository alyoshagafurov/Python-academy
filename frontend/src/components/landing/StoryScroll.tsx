import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { Lightbulb, Wand2, TrendingUp, Check, Flame, ChevronsDown } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

const chapters = [
  { icon: Lightbulb, title: "Открываешь тему", text: "Каждая идея — через аналогию из жизни. Переменная — коробка, функция — кофемашина. Сначала образ, потом код." },
  { icon: Wand2, title: "Застрял? Объясняешь проще", text: "Сложная формулировка — не приговор. Один клик, и тема превращается в объяснение на пальцах." },
  { icon: TrendingUp, title: "Отмечаешь — и растёшь", text: "Прочитал — отметил. XP, проценты и стрик по дням превращают учёбу в привычку." },
];

export function StoryScroll() {
  return (
    <>
      <MobileStory />
      <DesktopStory />
    </>
  );
}

/* ───────────── Mobile: clean stacked steps (no scroll-jacking) ───────────── */

function MobileStory() {
  return (
    <section className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:hidden">
      <div className="text-center">
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Как это работает</span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-fg">Три шага — и ты понимаешь</h2>
      </div>

      <div className="mt-8 space-y-4">
        {chapters.map((c, i) => (
          <Reveal key={i} delay={i * 0.06}>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-fg">
                  {i + 1}
                </span>
                <div className="flex items-center gap-2">
                  <c.icon size={18} className="text-primary" />
                  <h3 className="font-bold text-fg">{c.title}</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-fg-muted">{c.text}</p>
              <div className="mt-4">{mobileVisual(i)}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function mobileVisual(i: number) {
  if (i === 0)
    return (
      <div className="rounded-xl border border-primary/25 bg-primary-soft/50 p-3 text-sm text-fg">
        🔗 Переменная — это <b>коробка с наклейкой</b> 📦.
      </div>
    );
  if (i === 1)
    return (
      <div className="rounded-2xl rounded-tl-sm border border-border bg-bg-soft p-3 text-sm text-fg">
        Представь почтовый ящик: на нём имя, внутри — письмо.
      </div>
    );
  return (
    <div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-border-soft">
        <div className="h-full w-[68%] rounded-full" style={{ background: "linear-gradient(90deg, var(--primary), var(--accent))" }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
          <Check size={13} /> +20 XP
        </span>
        <span className="flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-500">
          <Flame size={13} /> 7 дней
        </span>
      </div>
    </div>
  );
}

/* ───────────── Desktop: cinematic sticky scroll ───────────── */

function DesktopStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(2, Math.max(0, Math.floor(v * 3 + 0.0001))));
  });

  const cueOpacity = useTransform(scrollYProgress, [0, 0.42, 0.55], [1, 1, 0]);
  const lineH = useTransform(scrollYProgress, [0.04, 0.96], ["0%", "100%"]);
  const o0 = useTransform(scrollYProgress, [0.0, 0.28, 0.36], [1, 1, 0]);
  const o1 = useTransform(scrollYProgress, [0.3, 0.38, 0.62, 0.7], [0, 1, 1, 0]);
  const o2 = useTransform(scrollYProgress, [0.64, 0.72, 1], [0, 1, 1]);
  const y0 = useTransform(scrollYProgress, [0, 0.36], [0, -40]);
  const y1 = useTransform(scrollYProgress, [0.3, 0.7], [40, -40]);
  const y2 = useTransform(scrollYProgress, [0.64, 1], [40, 0]);
  const barW = useTransform(scrollYProgress, [0.72, 0.96], ["6%", "68%"]);

  return (
    <section ref={ref} className="relative hidden h-[250vh] lg:block">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-8 text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Как это работает</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-fg sm:text-5xl">Три шага — и ты понимаешь</h2>
            <p className="mt-3 inline-flex items-center gap-2 text-fg-muted">
              <ChevronsDown size={16} className="animate-bounce text-primary" />
              Крути вниз — три сцены сменят друг друга
            </p>
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative order-2 pl-12 lg:order-1">
              <div className="absolute bottom-3 left-[18px] top-3 w-[3px] rounded-full bg-border" />
              <motion.div className="absolute left-[18px] top-3 w-[3px] rounded-full bg-gradient-to-b from-primary to-accent" style={{ height: lineH }} />
              {chapters.map((c, i) => {
                const on = active === i;
                return (
                  <div key={i} className="relative mb-9 last:mb-0">
                    <div className={cn("absolute -left-[42px] grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold transition-all duration-500", on ? "border-primary bg-primary text-primary-fg shadow-[0_0_0_6px_color-mix(in_oklab,var(--primary)_20%,transparent)]" : "border-border bg-card text-fg-subtle")}>{i + 1}</div>
                    <motion.div animate={{ opacity: on ? 1 : 0.4, x: on ? 0 : -4 }} transition={{ duration: 0.4 }}>
                      <div className="flex items-center gap-2">
                        <c.icon size={18} className={on ? "text-primary" : "text-fg-subtle"} />
                        <h3 className="text-lg font-bold text-fg">{c.title}</h3>
                      </div>
                      <p className="mt-1.5 text-fg-muted">{c.text}</p>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            <div className="relative order-1 lg:order-2">
              <div className="pointer-events-none absolute -top-24 right-0 select-none">
                <AnimatePresence mode="popLayout">
                  <motion.span key={active} initial={{ opacity: 0, y: 30, scale: 0.8 }} animate={{ opacity: 0.07, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30, scale: 0.8 }} transition={{ duration: 0.5 }} className="block text-[12rem] font-black leading-none text-fg">0{active + 1}</motion.span>
                </AnimatePresence>
              </div>
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] opacity-40 blur-3xl" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }} />
              <div className="gradient-ring relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
                <div className="flex items-center gap-2 border-b border-border-soft bg-bg-soft/60 px-4 py-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  <div className="ml-3 flex-1 truncate rounded-md bg-card-hover px-3 py-1 text-center text-[11px] text-fg-subtle">knowledgehub.app/python/variables</div>
                </div>
                <div className="relative h-[300px] p-6 sm:h-[330px]">
                  <motion.div style={{ opacity: o0, y: y0 }} className="absolute inset-6 flex flex-col justify-center">
                    <div className="rounded-xl border border-primary/25 bg-primary-soft/50 p-4">
                      <div className="text-xs font-bold uppercase tracking-wide text-primary">💡 Аналогия</div>
                      <p className="mt-2 text-lg text-fg">Переменная — это <b>коробка с наклейкой</b> 📦. Кладёшь значение, берёшь по имени.</p>
                    </div>
                    <div className="mt-4 rounded-xl border border-white/10 bg-[#0d1117] p-4 font-mono text-sm">
                      <span className="text-sky-300">name</span> <span className="text-slate-400">=</span> <span className="text-emerald-300">'Алекс'</span> <span className="text-slate-500"># имя</span>
                    </div>
                  </motion.div>
                  <motion.div style={{ opacity: o1, y: y1 }} className="absolute inset-6 flex flex-col justify-center">
                    <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-fg"><Wand2 size={14} /> Объяснить проще</div>
                    <div className="mt-4 rounded-2xl rounded-tl-sm border border-border bg-bg-soft p-4 text-fg">🔗 Представь почтовый ящик: на нём имя, внутри — письмо. Имя — это переменная, письмо — её значение.</div>
                  </motion.div>
                  <motion.div style={{ opacity: o2, y: y2 }} className="absolute inset-6 flex flex-col justify-center">
                    <div className="flex items-center justify-between text-sm"><span className="font-semibold text-fg">Прогресс курса</span><span className="text-fg-muted">68%</span></div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-border-soft"><motion.div className="h-full rounded-full" style={{ width: barW, background: "linear-gradient(90deg, var(--primary), var(--accent))" }} /></div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm font-semibold text-success"><Check size={15} /> +20 XP</div>
                      <div className="flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-semibold text-orange-500"><Flame size={15} /> 7 дней подряд</div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <motion.div style={{ opacity: cueOpacity }} className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full border border-primary/30 bg-card/90 px-5 py-2.5 shadow-xl backdrop-blur">
            <div className="relative h-7 w-[18px] rounded-full border-2 border-primary">
              <motion.div className="absolute left-1/2 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary" animate={{ y: [0, 9, 0], opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
            </div>
            <span className="text-sm font-semibold text-fg">Крути вниз · <span className="text-primary">шаг {active + 1} / 3</span></span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
