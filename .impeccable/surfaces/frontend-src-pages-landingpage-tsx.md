---
version: 1
slug: "frontend-src-pages-landingpage-tsx"
primary_target: "frontend/src/pages/LandingPage.tsx"
related_targets: ["frontend/src/pages/LessonPage.tsx","frontend/src/pages/CatalogPage.tsx"]
---

Scope: whole frontend, stage 1 redesign. Home = Persuade; catalog, course, lesson, search, dashboard = Operate/Read.
Audience: beginners 14–30 on a phone. Job: understand in 3 s what this is, that it is free, start the first lesson.
Constraints: brief-pinned world «Светлая витрина» (stage-1 prompt block 5) beats the roll; free for all, no prices; no invented proof; no images.

## Direction contract

THESIS: Code on a showcase — one real lesson fragment, perfectly set, with Apple-grade air around it. Refuses the category default of neon hero art, bento grids and testimonial rows.

OWN-WORLD: White #FFFFFF / #F5F5F7 surfaces, ink #1D1D1F, one blue #0071E3 only for action, focus and progress. System SF / Onest, mono SF Mono / JetBrains Mono. Radii 12 (rows, fields, code) and 24 (large surfaces); inset grouped lists; hairlines #D2D2D7. Raise (ikebana, declined): emptiness is active — one showcase per viewport, nothing beside it. Raise (oscilloscope, declined): strict 8px measure, every gap a multiple. Raise (zine, declined): the one line that matters in the showcase is marked by a quiet surface band, never by colour noise.

STORY: See real code → believe it is understandable → «Начать учиться» → catalog → first lesson.

FIRST VIEWPORT: Centered H1 clamp(40–72px), 17–21px subhead ≤ 56ch, pill CTA + text link; below, the 980px showcase surface with the analogy line and 7 lines of Python from beginner lesson 5 (the lesson example verbatim; brief allows 6–10), whole showcase above the fold at 1440×900, «Открыть урок» link.

FORM: brief-pinned «Светлая витрина»; seed 05a49d9c assigned index 6, overridden by the pinned brief; challengers zine, oscilloscope, ikebana, pickling all declined.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
