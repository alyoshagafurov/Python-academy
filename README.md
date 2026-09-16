<div align="center">

<img src="frontend/public/hero.png" alt="Python Academy" width="100%" />

# 🐍 Python Academy — Web

**Понятный справочник по Python, backend и вебу.**
Бесплатный сайт для чтения: курсы, проверки и сократический наставник — без регистрации и без аккаунтов.

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ✨ Что это

Сайт, где новичок проходит путь **от первой строки Python до backend-разработчика** — не зубрёжкой, а пониманием. В основе — методика из книг по когнитивной психологии и обучению (Браун «Make It Stick», Оакли «Думай как математик», ЛеФевер «Искусство объяснять», Бадмаев/Гальперин и др.):

- 💡 **Объяснение через аналогии** — каждая тема начинается с образа из жизни.
- ✨ **Режим «объяснить проще»** — адаптивная подача в выбранном стиле.
- 🔮 **Ретривал-практика** — «угадай, прежде чем смотреть» (active recall).
- 🧑‍🏫 **Сократический наставник** — помогает думать (hint-лестница), а не выдаёт ответ.
- 🔎 **Поиск по всем курсам** — по названиям тем и тексту теории.
- 🚪 **Без входа** — ничего не нужно создавать: открыл ссылку и читаешь.

## 🧩 Архитектура

```
React (Vite, 5173) ──/api──▶ FastAPI (8077) ──import──▶ контент курсов (JSON)
   тёмная/светлая тема          тонкий слой              backend/_bot/content
   Shiki · Framer Motion        + наставник (mentor.db)
```

Бэкенд **не дублирует контент**: он импортирует загрузчик уроков и два сервиса чтения (поиск, похожие темы) и отдаёт их по HTTP. Данных о читателе нет вовсе — единственная база `mentor.db` хранит анонимную телеметрию наставника.

| Слой | Технологии |
|------|-----------|
| **Frontend** | React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Shiki · React Query · React Router |
| **Backend**  | FastAPI · Uvicorn · aiosqlite |
| **Аккаунты** | Их нет: ни входа, ни сессий, ни cookie, ни данных о читателе |
| **Mentor**   | Zero-token rule-based наставник (анонимная `mentor.db`) |

## 📁 Структура

```
python-academy-web/
├── backend/                 # FastAPI поверх JSON-контента курсов
│   ├── app/
│   │   ├── bot_bridge.py     # мост к загрузчику контента (по пути BOT_DIR)
│   │   ├── content.py        # сериализация уроков для веба
│   │   ├── mentor.py         # zero-token сократический наставник
│   │   ├── mentor_store.py   # телеметрия наставника (единственная SQLite)
│   │   ├── routers/          # courses · lessons · search · mentor · meta
│   │   └── main.py
│   └── requirements.txt
├── frontend/                # React + Vite + TS + Tailwind
│   ├── src/
│   │   ├── pages/            # лендинг · каталог · курс · урок · поиск · PRO · 404
│   │   ├── components/       # ui · layout · mentor · landing-эффекты
│   │   └── lib/              # api · types · shiki · covers
│   └── public/              # обложки курсов и hero-арт
└── README.md
```

> Папка `backend/_bot` — исторический снапшот контента курсов. Telegram-бот, из которого он вырос, удалён 16 сентября 2026 года; сайт от него не зависит.

## 🚀 Быстрый старт

Нужно: **Python 3.12+** и **Node 18+**. Контент курсов уже лежит в `backend/_bot`; другой путь задаётся через `BOT_DIR` в `backend/.env`.

**1. Backend (порт 8077)**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # по желанию
uvicorn app.main:app --reload --port 8077
```
Проверка: <http://127.0.0.1:8077/api/health> → `{"status":"ok","courses":5}`. Docs: `/docs`.

**2. Frontend (порт 5173)**
```bash
cd frontend
npm install
npm run dev
```
Открой <http://localhost:5173>. Vite проксирует `/api` на бэкенд.

Локально бэкенду нужен `DEV_MODE=1` в `backend/.env`: без него приложение не стартует без `SITE_URL`. Эксплуатация и переменные — `docs/OPERATIONS.md`.

## 🔌 API (основное)

| Метод | Путь | Назначение |
|------|------|-----------|
| `GET` | `/api/courses` · `/api/courses/{id}` | Курсы и дерево треков → тем |
| `GET` | `/api/courses/{id}/lessons/{lid}` | Теория темы (+ self-check) |
| `GET` | `/api/search?q=` | Поиск по всем курсам |
| `GET` | `/api/stats` | Сколько курсов и тем на сайте |
| `POST`| `/api/mentor/hint` · `/api/mentor/explain` | Zero-token наставник (сократическая лестница / объяснятель) |
| `POST`| `/api/mentor/event` | Анонимная телеметрия наставника |

## 🎓 Педагогика и наставник

Наставник работает **без LLM** на контенте уроков: при ошибке — лестница `вопрос → намёк → разбор → ответ` (сервер гейтит ступени, ответ не выдаётся сразу). Спрос на «живой» ИИ-наставник пишется в анонимную телеметрию — Claude API подключается под фичефлагом `MENTOR_AI` после валидации поведения читателей.

## 📄 Лицензия

[MIT](LICENSE)

<div align="center">
<sub>Сделано для тех, кто учит Python 🐍</sub>
</div>
