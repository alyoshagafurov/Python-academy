<div align="center">

<img src="frontend/public/hero.png" alt="Python Knowledge Hub" width="100%" />

# 🐍 Python Knowledge Hub — Web

**Дорогой, тёмный и понятный справочник по Python, backend и вебу.**
Веб-версия образовательной платформы [@python_academy_tj_bot](https://t.me/python_academy_tj_bot) — с той же базой и контентом, что и Telegram-бот.

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
- 🔁 **Прогресс, стрик и рекомендации** — синхронно с ботом по одному `user_id`.

## 🧩 Архитектура

```
React (Vite, 5173) ──/api──▶ FastAPI (8077) ──import──▶ контент и БД бота
   тёмная/светлая тема          тонкий слой           (lessons, services, academy.db)
   Shiki · Framer Motion        + mentor + analytics
```

Бэкенд **не дублирует контент**: он импортирует модули бота (загрузчик уроков, слой данных, сервисы поиска/прогресса/рекомендаций) и отдаёт их по HTTP. Сам бот при этом не запускается и не модифицируется — общая `academy.db` работает в режиме WAL, поэтому бот и API спокойно сосуществуют.

| Слой | Технологии |
|------|-----------|
| **Frontend** | React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Shiki · React Query · React Router |
| **Backend**  | FastAPI · Uvicorn · aiosqlite · itsdangerous (сессии) |
| **Auth**     | Telegram Login Widget (прод) + dev-login (локально) — единый `user_id` с ботом |
| **Mentor**   | Zero-token rule-based наставник + аналитика (изолированная `mentor.db`) |

## 📁 Структура

```
python-academy-web/
├── backend/                 # FastAPI поверх контента и БД бота
│   ├── app/
│   │   ├── bot_bridge.py     # мост к модулям бота (по пути BOT_DIR)
│   │   ├── content.py        # сериализация уроков для веба
│   │   ├── mentor.py         # zero-token сократический наставник
│   │   ├── mentor_store.py   # аналитика ментора (отдельная SQLite)
│   │   ├── routers/          # courses · lessons · search · me · auth · mentor · meta
│   │   └── main.py
│   └── requirements.txt
├── frontend/                # React + Vite + TS + Tailwind
│   ├── src/
│   │   ├── pages/            # лендинг · каталог · курс · урок · поиск · кабинет · PRO · insights
│   │   ├── components/       # ui · layout · mentor · landing-эффекты
│   │   └── lib/              # api · types · shiki · covers
│   └── public/              # обложки курсов и hero-арт
└── README.md
```

> Бот живёт в отдельном репозитории и папке (`python-academy-bot`) — он **переиспользуется**, а не входит в этот репозиторий.

## 🚀 Быстрый старт

Нужно: **Python 3.12+**, **Node 18+** и папка бота рядом (по умолчанию `../python-academy-bot`; иначе задай `BOT_DIR` в `backend/.env`).

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
Открой <http://localhost:5173>. Vite проксирует `/api` на бэкенд — куки-сессии работают как на одном домене.

### Вход
- **Локально** — dev-вход: выбери существующего пользователя бота или введи любой `user_id`. Прогресс синхронизируется с ботом.
- **В проде** — Telegram Login Widget: задай `TELEGRAM_BOT_TOKEN` в `backend/.env`, домен в @BotFather (`/setdomain`), `DEV_AUTH=0`.

## 🔌 API (основное)

| Метод | Путь | Назначение |
|------|------|-----------|
| `GET` | `/api/courses` · `/api/courses/{id}` | Курсы и дерево треков → тем |
| `GET` | `/api/courses/{id}/lessons/{lid}` | Теория темы (+ self-check) |
| `GET` | `/api/search?q=` | Поиск по всем курсам |
| `GET` | `/api/me` · `/api/me/bookmarks` · `/api/me/recommendations` | Профиль, избранное, рекомендации |
| `POST`| `/api/mentor/hint` · `/api/mentor/explain` | Zero-token наставник (сократическая лестница / объяснятель) |
| `GET` | `/api/mentor/analytics` | Метрики вовлечённости (CTR, retry, drop-off…) |
| `POST`| `/api/auth/telegram` · `/api/auth/dev` | Авторизация |

## 🎓 Педагогика и наставник

Наставник работает **без LLM** на контенте уроков: при ошибке — лестница `вопрос → намёк → разбор → ответ` (сервер гейтит ступени, ответ не выдаётся сразу). Спрос на «живой» ИИ-наставник логируется в аналитику — Claude API подключается под фичефлагом `MENTOR_AI` после валидации поведения учеников.

## 📄 Лицензия

[MIT](LICENSE)

<div align="center">
<sub>Сделано для тех, кто учит Python 🐍</sub>
</div>
