import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowDown,
  Search,
  Bookmark,
  Lightbulb,
  Brain,
  Repeat,
  Wand2,
  Code2,
  GraduationCap,
  Rocket,
  Target,
  Check,
  ChevronDown,
  Quote,
  Star,
  Flame,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/hooks/useLoginModal";
import { Button } from "@/components/ui/Button";
import { CourseCard } from "@/components/CourseCard";
import { PageTransition } from "@/components/PageTransition";
import { Reveal } from "@/components/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { pluralize } from "@/lib/utils";
import { InteractiveBackground } from "@/components/landing/InteractiveBackground";
import { NoiseOverlay } from "@/components/landing/NoiseOverlay";
import { ScrollProgressBar } from "@/components/landing/ScrollProgressBar";
import { CustomCursor } from "@/components/landing/CustomCursor";
import { ConstellationCanvas } from "@/components/landing/ConstellationCanvas";
import { CountUp } from "@/components/landing/CountUp";
import { Marquee } from "@/components/landing/Marquee";
import { RotatingWord } from "@/components/landing/RotatingWord";
import { StoryScroll } from "@/components/landing/StoryScroll";
import { HeroShowcase } from "@/components/landing/HeroShowcase";
import { Magnetic } from "@/components/landing/Magnetic";
import { Parallax } from "@/components/landing/Parallax";
import { BrowserFrame, LessonPreviewBody } from "@/components/landing/BrowserFrame";
import { TiltCard } from "@/components/landing/TiltCard";
import { HERO_IMAGE } from "@/lib/covers";

const marqueeItems = [
  "🐍 Python с нуля", "🟣 Backend", "🌐 Flask + Web", "🎨 HTML & CSS",
  "🟩 Minecraft + Python", "Циклы", "Словари", "ООП", "async / await",
  "Декораторы", "SOLID", "JWT-авторизация", "Jinja2", "Type hints", "Базы данных",
];

const pillars = [
  { icon: Brain, title: "Понимание, а не зубрёжка", text: "Каждая тема — через аналогию из жизни. Сначала образ, потом код." },
  { icon: Wand2, title: "Кнопка «объяснить проще»", text: "Запутался — один клик, и тема превращается в объяснение на пальцах." },
  { icon: Repeat, title: "Прогресс, который держит", text: "Стрик, проценты и подсказки «что дальше» превращают учёбу в привычку." },
];

const anatomy = [
  { icon: Lightbulb, label: "Аналогия", text: "С чем это сравнить из жизни" },
  { icon: Code2, label: "Теория + пример", text: "Короткое объяснение и рабочий код" },
  { icon: Search, label: "Разбор кода", text: "Что делает каждая строка" },
  { icon: Wand2, label: "Объяснить проще", text: "Если всё ещё непонятно" },
];

const roadmap = [
  { emoji: "🐍", title: "Python Beginner", text: "Синтаксис, типы, циклы, функции" },
  { emoji: "🎨", title: "HTML & CSS", text: "Как устроены страницы и вёрстка" },
  { emoji: "🌐", title: "Python + Web", text: "Flask, Jinja2, формы" },
  { emoji: "🟣", title: "Python Student", text: "ООП, async, БД, архитектура" },
  { emoji: "🚀", title: "Backend-разработчик", text: "Проекты в портфолио и оффер" },
];

const testimonials = [
  { name: "Алишер", role: "переключился с менеджера", text: "Раньше бросал Python трижды. Здесь зашло из-за аналогий — наконец понял словари и циклы.", emoji: "🧑‍💻" },
  { name: "Мадина", role: "студентка", text: "Кнопка «объяснить проще» — спасение. Стрик 23 дня, не хочу прерывать!", emoji: "👩‍🎓" },
  { name: "Тимур", role: "будущий backend", text: "Прошёл Beginner и Web, сейчас на Student. Прогресс виден и в боте, и на сайте.", emoji: "🚀" },
];

const faq = [
  { q: "Это правда бесплатно?", a: "Вся теория — 5 курсов и 200 тем — бесплатна навсегда. PRO добавляет практику и проекты, но для основ платить не нужно." },
  { q: "Я совсем новичок, мне подойдёт?", a: "Да. Курс начинается с установки и первой строки кода. Каждая тема — через простые аналогии, а кнопка «объяснить проще» поможет, если застрял." },
  { q: "Чем это лучше видеокурсов?", a: "Видео легко бросить и сложно искать нужное. Здесь — справочник: мгновенный поиск, понятный прогресс и теория, которую перечитаешь за минуту." },
  { q: "Как связаны сайт и бот?", a: "Это одна платформа. Прогресс, стрик и избранное синхронны по твоему Telegram: начни на сайте — продолжи в боте." },
];

export function LandingPage() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: api.stats });
  const { data: courses } = useQuery({ queryKey: ["courses"], queryFn: api.courses });
  const { user } = useAuth();
  const { open } = useLoginModal();

  return (
    <PageTransition>
      <ScrollProgressBar />
      <CustomCursor />
      <InteractiveBackground />
      <NoiseOverlay />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative isolate">
        {/* Hero artwork background, faded into the page */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover object-center opacity-60 dark:opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-bg/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/20" />
        </div>
        <ConstellationCanvas className="pointer-events-none absolute inset-0 -z-10 opacity-50" />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-12 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-sm text-fg-muted backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Справочник по Python и backend
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-fg sm:text-5xl lg:text-6xl">
              Python, который ты наконец
              <span className="mt-1 block">
                <RotatingWord words={["поймёшь", "не бросишь", "полюбишь"]} />
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-fg-muted">
              Аналогии из жизни, живые примеры и режим «объяснить проще». Путь от
              первой строки до backend — без зубрёжки и страха.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Link to="/courses">
                  <Button size="lg">
                    Начать бесплатно <ArrowRight size={18} />
                  </Button>
                </Link>
              </Magnetic>
              {!user && (
                <Magnetic>
                  <Button size="lg" variant="outline" onClick={open}>
                    Войти через Telegram
                  </Button>
                </Magnetic>
              )}
            </div>

            <div className="mt-7 flex items-center gap-3 text-sm text-fg-muted">
              <div className="flex -space-x-2">
                {["🐍", "🚀", "👩‍🎓", "🧑‍💻"].map((e, i) => (
                  <span key={i} className="grid h-8 w-8 place-items-center rounded-full border-2 border-bg bg-card-hover text-sm">
                    {e}
                  </span>
                ))}
              </div>
              <span>
                <b className="text-fg">
                  <CountUp value={stats?.students ?? 1200} suffix="+" />
                </b>{" "}
                {stats ? pluralize(stats.students, "ученик уже учится", "ученика уже учатся", "учеников уже учатся") : "учеников уже учатся"}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="hidden px-6 lg:block"
          >
            <Parallax speed={40}>
              <HeroShowcase />
            </Parallax>
          </motion.div>
        </div>

        <Reveal className="mx-auto max-w-6xl px-4 sm:px-6">
          <Marquee items={marqueeItems} />
        </Reveal>

        <div className="mt-6 border-y border-border bg-bg-soft/40 backdrop-blur">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
            <StatBlock value={<CountUp value={stats?.students ?? 1200} suffix="+" />} label="учеников" />
            <StatBlock value={<CountUp value={stats?.courses ?? 5} />} label="курсов" />
            <StatBlock value={<CountUp value={stats?.lessons ?? 200} />} label="тем теории" />
            <StatBlock value="100%" label="бесплатный старт" />
          </div>
        </div>

        <motion.div
          className="pointer-events-none mt-6 flex justify-center text-fg-subtle"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <ArrowDown size={20} />
        </motion.div>
      </section>

      {/* ═══════════════ STORYTELLING ═══════════════ */}
      <StoryScroll />

      {/* ═══════════════ WHY YOU GET SMARTER ═══════════════ */}
      <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow n="01" label="Метод" center />
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            Почему здесь ты реально поумнеешь
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <TiltCard intensity={5} className="h-full">
                <div className="gradient-ring h-full rounded-3xl border border-border bg-card p-7">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <p.icon size={24} />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-fg">{p.title}</h3>
                  <p className="mt-2 text-fg-muted">{p.text}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ ANATOMY ═══════════════ */}
      <section className="border-y border-border bg-bg-soft/40">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <Eyebrow n="02" label="Анатомия темы" />
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
              Что внутри каждой темы
            </h2>
            <p className="mt-4 text-lg text-fg-muted">
              Одинаковая понятная структура у всех 200 тем — ты всегда знаешь, чего ждать.
            </p>
            <div className="mt-8 space-y-3">
              {anatomy.map((a, i) => (
                <Reveal key={a.label} delay={i * 0.06}>
                  <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <a.icon size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-fg">{a.label}</div>
                      <div className="text-sm text-fg-subtle">{a.text}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Parallax speed={50}>
              <TiltCard>
                <BrowserFrame url="knowledgehub.app/python/variables">
                  <LessonPreviewBody />
                </BrowserFrame>
              </TiltCard>
            </Parallax>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ COURSES ═══════════════ */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="mb-8 text-center">
          <Eyebrow n="03" label="Курсы" center />
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            Пять курсов под твою цель
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses
            ? courses.courses.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)
            : Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      </section>

      {/* ═══════════════ ROADMAP ═══════════════ */}
      <section className="border-y border-border bg-bg-soft/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow n="04" label="Траектория" center />
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
              Путь от нуля до оффера
            </h2>
          </Reveal>
          <div className="mt-12 flex flex-col gap-3 md:flex-row md:items-stretch">
            {roadmap.map((r, i) => (
              <Reveal key={r.title} delay={i * 0.07} className="flex-1">
                <div className="flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-5 md:flex-col md:items-start md:text-left">
                  <span className="text-3xl">{r.emoji}</span>
                  <div>
                    <div className="font-bold text-fg">{r.title}</div>
                    <div className="mt-1 text-sm text-fg-subtle">{r.text}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2} className="mt-8 flex justify-center">
            <Link to="/pro">
              <Button variant="secondary" size="lg">
                <Rocket size={18} /> Куда ведёт PRO
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FEATURES — bento ═══════════════ */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="text-center">
          <Eyebrow n="05" label="Возможности" center />
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            Всё, чтобы не бросить
          </h2>
        </Reveal>
        <div className="mt-12 grid auto-rows-[176px] grid-cols-2 gap-4 md:grid-cols-4">
          <BentoCard className="col-span-2 row-span-2" highlight>
            <div className="flex h-full flex-col">
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-fg">
                <Wand2 size={15} /> Объяснить проще
              </div>
              <h3 className="mt-4 text-2xl font-bold text-fg">Сложный абзац — в понятный за клик</h3>
              <p className="mt-2 text-fg-muted">Не понял формулировку — и теория станет объяснением на пальцах.</p>
              <div className="mt-auto space-y-2 pt-4">
                <div className="rounded-xl border border-border bg-card/70 px-3 py-2 text-xs text-fg-subtle line-through decoration-fg-subtle/40">
                  «Именованная ссылка на область памяти…»
                </div>
                <div className="gradient-ring flex items-center gap-2 rounded-xl border border-primary/30 bg-primary-soft/50 px-3 py-2 text-xs text-fg">
                  <Check size={13} className="shrink-0 text-primary" /> «Переменная — коробка с наклейкой 📦»
                </div>
              </div>
            </div>
          </BentoCard>
          <BentoCard className="col-span-2">
            <BentoLead icon={Search} title="Мгновенный поиск" text="Одно поле — все 200 тем." />
          </BentoCard>
          <BentoCard className="col-span-1">
            <BentoLead icon={Bookmark} title="Избранное" text="Сохраняй в один тап." />
          </BentoCard>
          <BentoCard className="col-span-1">
            <BentoLead icon={Flame} title="Стрик" text="Дни подряд держат в тонусе." />
          </BentoCard>
          <BentoCard className="col-span-2">
            <BentoLead icon={Target} title="Что учить дальше" text="Умные рекомендации по программе." />
          </BentoCard>
          <BentoCard className="col-span-2">
            <BentoLead icon={GraduationCap} title="Синхронно с ботом" text="Сайт и Telegram — один прогресс." />
          </BentoCard>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="border-y border-border bg-bg-soft/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal className="text-center">
            <Eyebrow n="06" label="Отзывы" center />
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">Так это ощущается</h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-6">
                  <Quote size={26} className="text-primary/40" />
                  <p className="mt-3 flex-1 text-fg">{t.text}</p>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-card-hover text-lg">{t.emoji}</span>
                    <div>
                      <div className="font-semibold text-fg">{t.name}</div>
                      <div className="text-xs text-fg-subtle">{t.role}</div>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} size={13} className="fill-accent text-accent" />
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-fg-subtle">Примеры отзывов — замени на реальные.</p>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">Частые вопросы</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {faq.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <FaqItem q={f.q} a={f.a} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Reveal>
          <div className="gradient-ring relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-primary/10 to-accent/5 p-10 text-center sm:p-14">
            <div className="glow" />
            <div className="relative">
              <h2 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
                Первую тему можно пройти прямо сейчас
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-fg-muted">
                Бесплатно, без карты. Понравится — войдёшь через Telegram, чтобы сохранить прогресс.
              </p>
              <Magnetic className="mt-7 inline-block">
                <Link to="/courses">
                  <Button size="lg">
                    Открыть курсы <ArrowRight size={18} />
                  </Button>
                </Link>
              </Magnetic>
            </div>
          </div>
        </Reveal>
      </section>
    </PageTransition>
  );
}

/* ─────────────────────────── sub-components ─────────────────────────── */

function Eyebrow({ n, label, center }: { n: string; label: string; center?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${center ? "justify-center" : ""}`}>
      <span className="text-sm font-black text-primary">{n}</span>
      <span className="h-px w-6 bg-primary/40" />
      <span className="text-sm font-bold uppercase tracking-[0.2em] text-fg-subtle">{label}</span>
    </div>
  );
}

function StatBlock({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="text-center md:text-left">
      <div className="text-3xl font-extrabold text-fg sm:text-4xl">{value}</div>
      <div className="text-sm text-fg-subtle">{label}</div>
    </div>
  );
}

function BentoCard({
  className,
  highlight,
  children,
}: {
  className?: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Reveal className={className}>
      <div
        className={`gradient-ring group h-full overflow-hidden rounded-3xl border p-5 transition-all hover:-translate-y-1 ${
          highlight
            ? "border-border bg-gradient-to-br from-primary/10 to-accent/5"
            : "border-border bg-card hover:border-primary/30 hover:shadow-[0_20px_50px_-30px_var(--primary)]"
        }`}
      >
        {children}
      </div>
    </Reveal>
  );
}

function BentoLead({ icon: Icon, title, text }: { icon: typeof Wand2; title: string; text: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary transition-transform group-hover:scale-110">
        <Icon size={20} />
      </div>
      <h3 className="mt-4 font-bold text-fg">{title}</h3>
      <p className="mt-1 text-sm text-fg-muted">{text}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-fg"
      >
        {q}
        <ChevronDown size={18} className={`shrink-0 text-fg-subtle transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-fg-muted">{a}</p>
      </motion.div>
    </div>
  );
}
