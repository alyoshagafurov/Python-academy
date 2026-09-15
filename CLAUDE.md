# Python Academy — web

Web version of the Telegram bot @python_academy_tj_bot. React SPA over a thin FastAPI layer
that imports the bot's own content loader and services. Product context: `PRODUCT.md`;
visual system: `DESIGN.md` (source of truth for tokens is `frontend/src/index.css`).

## Stack

- **frontend/** — React 19, Vite 6, TypeScript strict, Tailwind CSS v4 (`@theme` in
  `src/index.css`), framer-motion 11, Shiki 1 (css-variables theme), TanStack Query 5,
  React Router 7, lucide-react icons. Fonts self-hosted via Fontsource (Onest, JetBrains Mono).
- **backend/** — FastAPI + Uvicorn over the bot snapshot in `backend/_bot` (or `BOT_DIR`).
- **Deploy** — one Docker image on Railway (`Dockerfile`, `railway.json`): FastAPI serves
  `/api` and the built SPA.

## Structure

```
frontend/src/
  pages/              one file per route (see App.tsx)
  components/ui/      primitives: Button, Container, Section, GroupedList, Skeleton, …
  components/layout/  Navbar, Footer, Layout
  components/landing/ LessonShowcase (static, no Shiki on the home page)
  components/mentor/  MentorHintCoach, AdaptiveExplainer
  components/         CodeBlock, TheoryRenderer, PredictCheck, LivePreview, CourseCard, …
  hooks/              useAuth, useTheme, useLoginModal
  lib/                api.ts, types.ts (mirror the API — change only with the backend), shiki.ts
backend/app/          routers, bot_bridge, content, mentor
```

## Design tokens

All colours, fonts, the type scale and easing live in `frontend/src/index.css`
(`:root` = light, `.dark` = dark, mapped to Tailwind names in `@theme inline`).
Use `bg-bg`, `bg-surface`, `hover:bg-surface-hover`, `text-fg`, `text-fg-muted`,
`border-line`, `bg-accent` / `text-link`, `text-success`, `text-danger`;
sizes `text-caption|body|title3|title2|title1|display`; radii `rounded-xl` (12px: rows,
fields, code) and `rounded-3xl` (24px: large surfaces); `rounded-full` only on the main CTA.

## Rules

- No hex, rgb or named colours in `src/components` and `src/pages` — tokens only.
- No purple/violet/indigo/fuchsia, no gradients, no glass except the navbar, no images as
  decoration, no emoji anywhere in UI chrome (lesson content from the bot is data, not UI).
- Motion follows emil-design-eng: transform/opacity only, ≤ 300 ms, ease-out
  (`--ease-out`), no page transitions, no whileInView on cards, no hover lift, no count-up;
  `prefers-reduced-motion` makes everything instant. Buttons press to `scale(0.98)`.
- Accent blue is only for primary actions, links, active state, focus and progress.
- Focus ring: `:focus-visible` 2px accent, offset 2px (global in index.css). Touch targets ≥ 44px.
- Never hard-code the number of courses or topics in copy; no prices (the site is free).
- Secrets only in env (`backend/.env`, never committed). Do not touch `backend/**`,
  `lib/api.ts`, `lib/types.ts`, `hooks/useAuth.tsx` for UI work.
- Links with `target="_blank"` always carry `rel="noopener noreferrer"`.
- Files under 500 lines; one component per concern.
- Lesson HTML is rendered only through `TheoryRenderer` (DOMPurify allowlist in
  `lib/sanitize.ts`; `backend/tests/test_launch.py` checks all content against it).
- No new inline `<script>` in `index.html`: the CSP allows only the theme script by its sha256.
  Styles may be inline (Shiki and React write colours into style attributes).
- Production settings, volume, deploy and rollback: `docs/OPERATIONS.md`.

## Run locally

```bash
# backend on :8077
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8077
```

```bash
# frontend on :5173 (proxies /api → :8077)
cd frontend
npm install
npm run dev
```

```bash
# checks (frontend)
cd frontend
npm run lint && npx tsc -b && npm run build
```

```bash
# checks (backend: launch, security, SEO and math course tests)
cd backend
.venv/bin/python -m pytest tests -q
```

Local backend needs `DEV_AUTH=1` in `backend/.env`: without it the app refuses to start
without `SESSION_SECRET` and `SITE_URL` (production defaults).
