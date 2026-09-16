import { PageTransition } from "@/components/PageTransition";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

// The platform is free for everyone for now (confirmed 2026-09-15): no prices,
// no purchase flow. This page only states what PRO is planned to add.
const planned = [
  "Backend-проекты по шагам: Todo API, JWT-авторизация, Redis-кэш, деплой",
  "Career Path — дорожная карта до Junior Backend с оценкой готовности",
  "Сертификат о прохождении курса с уникальным кодом",
  "Больше практики и дополнительные материалы",
];

export function ProPage() {
  return (
    <PageTransition>
      <Container size="narrow" className="pb-24 pt-12 md:pt-20">
        <title>PRO — Python Academy</title>
        <h1 className="text-title1 font-bold tracking-[-0.025em] text-fg">PRO</h1>
        <p className="mt-4 text-title3 text-fg">Сейчас всё бесплатно.</p>
        <p className="mt-3 max-w-[56ch] text-body text-fg-muted">
          Курсы, «Объяснить проще» и наставник открыты для всех и без регистрации. PRO появится позже
          и добавит практику и проекты для портфолио.
        </p>

        <h2 className="mt-12 text-body font-semibold text-fg">Что планируем в PRO</h2>
        <ul className="mt-4 border-t border-line">
          {planned.map((item) => (
            <li key={item} className="flex gap-3 border-b border-line py-4 text-body text-fg">
              {/* A plan, not an included feature: a neutral marker instead of a check. */}
              <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-fg-muted" />
              {item}
            </li>
          ))}
        </ul>

        <ButtonLink to="/courses" size="lg" pill className="mt-10">
          Начать учиться
        </ButtonLink>
      </Container>
    </PageTransition>
  );
}
