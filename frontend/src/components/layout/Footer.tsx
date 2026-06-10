import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <span className="text-xl">🐍</span> Python Knowledge Hub
          </div>
          <p className="mt-2 max-w-sm text-sm text-fg-muted">
            Справочник по Python, backend и вебу. Теория с ассоциациями, примеры
            кода и понятный прогресс — синхронизировано с Telegram-ботом.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Link to="/courses" className="text-fg-muted hover:text-fg">Курсы</Link>
          <Link to="/search" className="text-fg-muted hover:text-fg">Поиск</Link>
          <Link to="/dashboard" className="text-fg-muted hover:text-fg">Кабинет</Link>
          <Link to="/pro" className="text-fg-muted hover:text-fg">PRO</Link>
          <a
            href="https://t.me/python_academy_tj_bot"
            target="_blank"
            rel="noreferrer"
            className="text-fg-muted hover:text-fg"
          >
            Бот в Telegram
          </a>
        </div>
      </div>
      <div className="border-t border-border-soft py-4 text-center text-xs text-fg-subtle">
        © {new Date().getFullYear()} Python Knowledge Hub · Сделано для тех, кто учит Python
      </div>
    </footer>
  );
}
