import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Container } from "@/components/ui/Container";

const linkClass = "flex min-h-11 items-center transition-colors duration-150 ease-out hover:text-fg sm:min-h-8";

export function Footer() {
  const { data } = useQuery({ queryKey: ["courses"], queryFn: api.courses });
  const courses = data?.courses.slice(0, 6) ?? [];

  return (
    <footer className="border-t border-line bg-surface">
      <Container size="wide" className="py-12 text-caption text-fg-muted">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr]">
          <div className="sm:col-span-2 md:col-span-1">
            <p className="text-body font-semibold text-fg">Python Academy</p>
            <p className="mt-2 max-w-[40ch]">
              Python и математика мышления: короткая теория, примеры из жизни и проверка после каждой темы.
            </p>
          </div>

          <FooterColumn title="Курсы">
            {courses.map((c) => (
              <li key={c.id}>
                <Link to={`/courses/${c.id}`} className={linkClass}>
                  {c.title}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/courses" className={linkClass}>
                Все курсы
              </Link>
            </li>
          </FooterColumn>

          <FooterColumn title="Платформа">
            <li>
              <Link to="/search" className={linkClass}>
                Поиск
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className={linkClass}>
                Кабинет
              </Link>
            </li>
            <li>
              <Link to="/pro" className={linkClass}>
                PRO
              </Link>
            </li>
            <li>
              <a
                href="https://t.me/python_academy_tj_bot"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Бот в Telegram
              </a>
            </li>
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-col-reverse gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Python Academy</p>
          <ThemeToggle withLabel />
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-caption font-semibold text-fg">{title}</h2>
      <ul role="list" className="mt-3">
        {children}
      </ul>
    </nav>
  );
}
