# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Beginners aged 14–30, mostly on a phone (≈390px), learning Python from the first line of code
towards backend development. Secondary: returning readers on desktop who open a lesson again
and search the reference. Interface language: Russian.

## Product Purpose

Python Academy is a free reading site for Python and «математика мышления». A learner goes
through courses (tracks → topics); every topic explains one idea through a real-life analogy,
short theory, a code example and its line-by-line breakdown. Success: a newcomer understands
within seconds what the site is, that learning is free and needs no registration, and reaches
the first lesson; a returning reader finds the topic again without friction.

## Positioning

Understanding over memorisation: each topic starts from an analogy, offers an
«Объяснить проще» re-explanation, a predict-before-you-peek check and a Socratic mentor that
climbs question → hint → reasoning → answer instead of giving the answer away. Nothing is
gated: no account, no sign-in, no data kept about the reader.

## Operating Context

- Learners read lessons, answer predict-checks, press «Объяснить проще», ask the mentor and
  search the reference. A lesson URL is permanent, so a browser bookmark is how a topic is kept.
- No accounts at all (decided 2026-09-16, after the Telegram bot was deleted): no login,
  no progress, no XP, no streaks, no favourites, no dashboard.
- Content comes from the JSON in backend/_bot/content; the site only reads it.

## Capabilities and Constraints

- Frontend: React 19, Vite 6, TypeScript strict, Tailwind v4, framer-motion, Shiki,
  TanStack Query, React Router 7. Backend: FastAPI over the JSON content; the only SQLite
  file is the mentor's anonymous telemetry. Deploy: single Docker service on Railway.
- Course count will grow; UI copy must never hard-code the number of courses or topics.
- The platform is free for everyone for now (confirmed 2026-09-15): no prices, tariffs or
  purchase CTAs anywhere. The /pro route stays and describes what PRO may add later,
  without pricing.
- FAQ helps visitors use the site (how to start, how the mentor works, «Объяснить проще»),
  not marketing claims.

## Brand Commitments

- Name: «Python Academy» (renamed from «Python Knowledge Hub» at launch). The Telegram bot it
  grew out of was deleted on 2026-09-16; nothing may link to it again.
- No emoji in UI chrome, no mascot/logo art; the name is set as text.

## Evidence on Hand

- Real lesson content in backend/_bot/content (python/beginner, student, minecraft;
  web/htmlcss, web/python).
- No real testimonials, student counts or reviews are confirmed — never fabricate them. With
  no accounts there is no student count at all: the API reports only courses and lessons.
- No public contact channel is to be shown (confirmed 2026-09-15). The site now links nowhere
  outside itself.

## Product Principles

1. Clarity first: one idea per screen area, calm reading, nothing that competes with the lesson.
2. Truthful: only real content and real numbers from the API; no invented social proof.
3. Mobile is the primary device; every flow must work one-handed at 390px.
4. The lesson is the product: the code and the analogy are the hero, not decoration.

## Accessibility & Inclusion

WCAG AA contrast (≥ 4.5:1) in light and dark themes, touch targets ≥ 44px, visible focus,
full keyboard operation, prefers-reduced-motion respected.
