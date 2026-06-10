import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/PageTransition";

export function NotFoundPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-md px-4 py-28 text-center sm:px-6">
        <div className="text-6xl">🐍</div>
        <h1 className="mt-4 text-3xl font-extrabold text-fg">404</h1>
        <p className="mt-2 text-fg-muted">
          Такой страницы нет. Возможно, опечатка в ссылке.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button size="lg">На главную</Button>
        </Link>
      </div>
    </PageTransition>
  );
}
