import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { m } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { DURATION, EASE_OUT, useDuration } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/State";
import { CourseCard } from "@/components/CourseCard";
import { PageTransition } from "@/components/PageTransition";
import { Reveal } from "@/components/Reveal";
import { LessonShowcase } from "@/components/landing/LessonShowcase";

const steps = [
  { title: "Аналогия", text: "Сравнение из жизни, с которого начинается тема." },
  { title: "Теория и пример", text: "Коротко о главном и рабочий код." },
  { title: "Разбор кода", text: "Что делает каждая строка." },
  { title: "Проверка и наставник", text: "Вопрос по теме. Ошибся — наставник наведёт на ответ, а не выдаст его сразу." },
];

// The first course for someone who has never programmed (see the FAQ below).
const START_COURSE = "/courses/python_beginner";

const path = [
  { id: "python_beginner", title: "Python Beginner", text: "Синтаксис, типы, циклы, функции" },
  { id: "web_htmlcss", title: "HTML & CSS", text: "Как устроены страницы и вёрстка" },
  { id: "web_python", title: "Python + Web", text: "Flask, Jinja2, формы" },
  { id: "python_student", title: "Python Student", text: "ООП, async, базы данных" },
  { id: null, title: "Backend-разработчик", text: "Цель пути" },
];

const faq = [
  {
    q: "С чего начать, если я никогда не программировал?",
    a: "Открой курсы и выбери Python Beginner. Первая тема — установка Python и редактора кода, дальше иди по порядку: каждая тема опирается на предыдущую.",
  },
  {
    q: "Нужно ли входить в аккаунт?",
    a: "Читать уроки можно без входа. Вход через Telegram нужен, чтобы сохранять прогресс, стрик и избранное.",
  },
  {
    q: "Как работает «Объяснить проще»?",
    a: "После примера выбери удобный стиль — например, на пальцах или по шагам. Тема будет пересказана другими словами по материалам того же урока.",
  },
  {
    q: "Что делать, если ответил неправильно в проверке?",
    a: "Правильный ответ не показывается сразу. Нажми «Разобрать вместе»: наставник задаст наводящий вопрос, затем даст подсказку — и так до полного разбора.",
  },
  {
    q: "Как сохранить тему, чтобы вернуться к ней?",
    a: "Нажми значок закладки рядом с заголовком урока. Все сохранённые темы собраны в кабинете, в разделе «Избранное».",
  },
  {
    q: "Сайт и бот — это одно и то же?",
    a: "Да, у них общая база. Прогресс, стрик и избранное привязаны к твоему Telegram: начни на сайте и продолжай в боте — или наоборот.",
  },
];

const h2 = "text-title2 font-semibold text-fg md:text-title1";

export function LandingPage() {
  const coursesQuery = useQuery({ queryKey: ["courses"], queryFn: api.courses });
  const courses = coursesQuery.data?.courses;
  const d = useDuration();

  return (
    <PageTransition>
      <title>Python Academy — Python и математика с нуля</title>
      {/* 1 — Hero */}
      <section className="pb-20 pt-12 md:pb-32 md:pt-16">
        <Container size="wide">
          {/* Visible from the first frame (the heading is the largest paint); only
              an 8px rise, which starts once the lazily loaded motion features arrive. */}
          <m.div
            className="text-center"
            initial={{ y: 8 }}
            animate={{ y: 0 }}
            transition={{ duration: d(DURATION.hero), ease: EASE_OUT }}
          >
            <h1 className="mx-auto max-w-[16ch] text-display font-bold text-fg lg:max-w-none">
              Python, который понятен.
            </h1>
            <p className="mx-auto mt-5 max-w-[44ch] text-body text-fg-muted md:text-title3">
              Каждая тема — через пример из жизни, короткую теорию и код. От первой строки до backend.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
              <ButtonLink to={START_COURSE} size="lg" pill>
                Начать учиться
              </ButtonLink>
              <a
                href="#how"
                className="inline-flex min-h-11 items-center text-body font-medium text-link hover:underline"
              >
                Как устроен урок
              </a>
            </div>
            <div className="mt-12">
              <LessonShowcase />
            </div>
          </m.div>
        </Container>
      </section>

      {/* 2 — How a lesson works */}
      <Section id="how" tone="surface" aria-labelledby="how-title">
        <Container>
          <Reveal className="grid gap-10 md:grid-cols-[1fr_1.3fr] md:gap-16">
            <div>
              <h2 id="how-title" className={h2}>
                Как устроен урок
              </h2>
              <p className="mt-4 max-w-[36ch] text-body text-fg-muted">
                Все темы построены одинаково, поэтому ты всегда знаешь, что будет дальше.
              </p>
            </div>
            <ol className="border-t border-line">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-6 border-b border-line py-6">
                  <span className="w-6 shrink-0 pt-0.5 text-caption text-fg-muted tabular">{i + 1}</span>
                  <div>
                    <h3 className="text-title3 font-semibold text-fg">{s.title}</h3>
                    <p className="mt-1 text-body text-fg-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </Container>
      </Section>

      {/* 3 — Courses */}
      <Section aria-labelledby="courses-title">
        <Container>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="courses-title" className={h2}>
                Курсы
              </h2>
              <Link
                to="/courses"
                className="inline-flex min-h-11 items-center text-body font-medium text-link hover:underline"
              >
                Все курсы
              </Link>
            </div>
            <div className="mt-10">
              {coursesQuery.isError ? (
                <ErrorState onRetry={() => coursesQuery.refetch()} />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {courses
                    ? courses.map((c) => <CourseCard key={c.id} course={c} />)
                    : Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-44 rounded-3xl" />
                      ))}
                </div>
              )}
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* 4 — Path */}
      <Section tone="surface" aria-labelledby="path-title">
        <Container>
          <Reveal>
            <h2 id="path-title" className={h2}>
              Путь
            </h2>
            <p className="mt-4 max-w-[40ch] text-body text-fg-muted">
              От первой строки кода до backend-разработчика.
            </p>
            <ol className="mt-12 grid md:grid-cols-5 md:gap-6">
              {path.map((step, i) => {
                const last = i === path.length - 1;
                const course = step.id ? courses?.find((c) => c.id === step.id) : undefined;
                return (
                  <li key={step.title} className="relative flex gap-4 pb-8 last:pb-0 md:flex-col md:gap-5 md:pb-0">
                    {!last && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0 left-[5px] top-5 w-px bg-line md:-right-6 md:bottom-auto md:left-5 md:top-[5px] md:h-px md:w-auto"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative mt-2 h-3 w-3 shrink-0 rounded-full border-2 md:mt-0",
                        last ? "border-fg bg-fg" : "border-fg-muted bg-surface",
                      )}
                    />
                    <div>
                      {course ? (
                        <Link
                          to={`/courses/${course.id}`}
                          className="-my-2.5 inline-block py-2.5 text-body font-semibold text-fg hover:text-link hover:underline"
                        >
                          {course.title}
                        </Link>
                      ) : (
                        <p className="text-body font-semibold text-fg">{step.title}</p>
                      )}
                      <p className="mt-1 text-caption text-fg-muted">{step.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Reveal>
        </Container>
      </Section>

      {/* 5 — FAQ */}
      <Section aria-labelledby="faq-title">
        <Container size="narrow">
          <Reveal>
            <h2 id="faq-title" className={h2}>
              Частые вопросы
            </h2>
            <ul className="mt-10 border-t border-line">
              {faq.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </ul>
          </Reveal>
        </Container>
      </Section>

      {/* 6 — Final CTA */}
      <Section tone="surface" aria-labelledby="cta-title">
        <Container className="text-center">
          <Reveal>
            <h2 id="cta-title" className={h2}>
              Первый урок — через минуту.
            </h2>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
              <ButtonLink to={START_COURSE} size="lg" pill>
                Начать учиться
              </ButtonLink>
              <a
                href="https://t.me/python_academy_tj_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-body font-medium text-link hover:underline"
              >
                Открыть бота в Telegram
              </a>
            </div>
          </Reveal>
        </Container>
      </Section>
    </PageTransition>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const d = useDuration();
  return (
    <li className="border-b border-line">
      <h3>
        <button
          type="button"
          id={`${id}-q`}
          aria-expanded={open}
          aria-controls={open ? `${id}-a` : undefined}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left text-body font-semibold text-fg"
        >
          {q}
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={cn(
              "shrink-0 text-fg-muted transition-transform duration-200 ease-out",
              open && "rotate-180",
            )}
          />
        </button>
      </h3>
      {open && (
        <m.div
          id={`${id}-a`}
          role="region"
          aria-labelledby={`${id}-q`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: d(DURATION.accordion), ease: EASE_OUT }}
        >
          <p className="max-w-[60ch] pb-6 text-body text-fg-muted">{a}</p>
        </m.div>
      )}
    </li>
  );
}
