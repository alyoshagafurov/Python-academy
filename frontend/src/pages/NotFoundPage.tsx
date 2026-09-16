import { Link } from "react-router-dom";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageTransition } from "@/components/PageTransition";

export function NotFoundPage() {
  return (
    <PageTransition>
      <Container size="narrow" className="py-28 text-center md:py-40">
        <title>Страница не найдена — Python Academy</title>
        <h1 className="text-title2 font-bold tracking-[-0.025em] text-fg md:text-title1">Страница не найдена</h1>
        <p className="mt-4 text-body text-fg-muted">Возможно, в ссылке опечатка или страница переехала.</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
          <ButtonLink to="/" size="lg" pill>
            На главную
          </ButtonLink>
          <Link to="/courses" className="inline-flex min-h-11 items-center text-body font-medium text-link hover:underline">
            Курсы
          </Link>
        </div>
      </Container>
    </PageTransition>
  );
}
