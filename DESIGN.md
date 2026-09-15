---
name: Python Knowledge Hub
description: Free Python lessons for beginners, set like code on a showcase.
colors:
  bg: "#ffffff"
  surface: "#f5f5f7"
  surface-hover: "#ededf0"
  fg: "#1d1d1f"
  fg-muted: "#6e6e73"
  line: "#d2d2d7"
  accent: "#0071e3"
  accent-hover: "#0062c4"
  accent-fg: "#ffffff"
  link: "#0066cc"
  success: "#1e8e3e"
  danger: "#d70015"
  bg-dark: "#000000"
  surface-dark: "#1c1c1e"
  surface-hover-dark: "#2c2c2e"
  fg-dark: "#f5f5f7"
  fg-muted-dark: "#a1a1a6"
  line-dark: "#38383a"
  accent-dark: "#2997ff"
  accent-hover-dark: "#47a6ff"
  accent-fg-dark: "#000000"
  link-dark: "#2997ff"
  success-dark: "#30d158"
  danger-dark: "#ff453a"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Onest Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Onest Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  headline-small:
    fontFamily: "-apple-system, BlinkMacSystemFont, Onest Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Onest Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Onest Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Onest Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  code:
    fontFamily: "ui-monospace, SF Mono, JetBrains Mono Variable, monospace"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.75
    fontFeature: "\"liga\" 0, \"calt\" 0"
rounded:
  nested: "8px"
  row: "12px"
  surface: "24px"
  pill: "9999px"
spacing:
  gutter-mobile: "16px"
  gutter: "24px"
  row: "12px 16px"
  card: "24px"
  card-md: "32px"
  section-mobile: "80px"
  section: "128px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-fg}"
    typography: "{typography.body}"
    rounded: "{rounded.row}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-cta:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-fg}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.row}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-hover}"
  button-plain:
    textColor: "{colors.link}"
    typography: "{typography.body}"
    padding: "0 4px"
    height: "44px"
  grouped-list:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.row}"
  grouped-row:
    textColor: "{colors.fg}"
    typography: "{typography.body}"
    padding: "{spacing.row}"
    height: "52px"
  grouped-row-hover:
    backgroundColor: "{colors.surface-hover}"
  course-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
    padding: "{spacing.card}"
  course-card-hover:
    backgroundColor: "{colors.surface-hover}"
  code-block:
    backgroundColor: "{colors.surface}"
    typography: "{typography.code}"
    rounded: "{rounded.row}"
    padding: "8px 32px 32px"
  lesson-showcase:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
    padding: "40px 56px"
    width: "980px"
  input-field:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    typography: "{typography.body}"
    rounded: "{rounded.row}"
    padding: "0 16px"
    height: "48px"
  navbar:
    textColor: "{colors.fg}"
    height: "52px"
  dialog:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.surface}"
    padding: "32px"
    width: "400px"
  progress-bar:
    backgroundColor: "{colors.line}"
    rounded: "{rounded.pill}"
    height: "2px"
---

# Design System: Python Knowledge Hub

## Overview

**Creative North Star: "Светлая витрина" (The Bright Showcase)**

The site presents Python the way a store window presents a single object: one real lesson fragment, set cleanly, with plenty of calm space around it. The default is light (white and a soft grey), with a true-black dark theme. The palette is Restrained: grey neutrals and ink carry everything, and one blue appears only when something can be pressed, followed, focused or measured. Depth comes from tonal surfaces and hairlines, not shadows. Code is the hero image, and there are no raster images at all.

Density is low on the home page (80px section rhythm on mobile, 128px from md, one showcase per viewport) and moderate on reading and working pages, where content sits in inset grouped lists like iOS Settings. Type is the system font (SF on Apple platforms) with self-hosted Onest as the cross-platform fallback. Headings are tight and bold, and body text is set generously at 17px.

Motion is minimal and quiet. Only the hero, first-time section reveals, disclosures and overlays animate. Routes change instantly, progress never animates, and reduced motion makes every appearance instant.

**Key Characteristics:**
- Light-first, tonal layering (white bg, #F5F5F7 surface, #EDEDF0 hover), hairline #D2D2D7 dividers.
- One accent blue, reserved for action, links, active state, focus and progress.
- Two radii for surfaces: 12px for rows, fields and code, 24px for large surfaces. A pill shape only on a screen's main CTA.
- Inset grouped lists as the default container for sets of items.
- Code set in the showcase style: surface panel, line numbers, Shiki css-variables colours, no ligatures.
- The navbar is the only translucent surface.

## Colors

Grey neutrals and ink carry the page, with one blue that means "you can act here".

### Primary
- **Action Blue** (accent): fills primary buttons and the main CTA, and is also used for the focus ring, progress fill, active-lesson dots, text caret and selection tint (22% mix). Hover goes darker (accent-hover), never lighter, so white text stays above 4.5:1. In dark mode it is a brighter blue with black text on top.
- **Link Blue** (link): a deeper blue used only for text links and plain buttons, because accent blue drops to 4.3:1 on the grey surface. In dark mode it is the same as accent.

### Neutral
- **Paper White** (bg): the page background and the fill of dialogs, menus and input fields. It is pure black in dark mode.
- **Showcase Grey** (surface): fills showcases, course cards, grouped lists, code blocks and alternating home sections.
- **Pressed Grey** (surface-hover): the hover and active fill for rows and cards, and the quiet band that highlights the showcase line that runs.
- **Ink** (fg): headings, body text and the active nav item.
- **Graphite** (fg-muted): secondary text, captions, line numbers, meta rows and inactive nav.
- **Hairline** (line): 1px dividers, input borders, the progress track and the scrollbar thumb. It is the global default border colour.

### Status
- **Success** (success) and **Danger** (danger): only for correct/incorrect feedback and the copied confirmation. They are never decorative.

### Named Rules
**The One Blue Rule.** Blue appears only on something the user can press, follow, focus on, or read as progress. A blue heading, icon or background band is a defect.

**The Token-Only Rule.** Colours are defined only in `frontend/src/index.css` (`:root` light, `.dark` dark, mapped in `@theme inline`). Components and pages use token names only and never contain hex values.

**The Readable Code Rule.** Every Shiki token colour must reach at least 4.5:1 on the surface in both themes. Syntax colours come from the `--shiki-token-*` variables, never from a bundled Shiki theme.

## Typography

**Display / Body Font:** system UI (-apple-system, BlinkMacSystemFont) with Onest Variable, then Segoe UI and system-ui, as fallbacks
**Mono Font:** ui-monospace / SF Mono with JetBrains Mono Variable as the fallback

**Character:** This is a native-feeling sans, not a branded display face. Bold, slightly tightened headings sit over relaxed 17px body text, which reads like Apple's own product pages set in Cyrillic.

### Hierarchy
- **Display** (700, clamp(40px, 6vw, 72px), 1.08, -0.025em): the home hero H1 only, capped at 16ch below lg.
- **Title 1 / Headline** (700, 40px, 1.08): page H1s on catalog, course, dashboard, PRO and 404, which use -0.025em tracking. At 600 weight it also sets home section H2s from md and large stat numbers.
- **Title 2** (600, 28px, 1.15, -0.015em): home section H2s on mobile, dashboard H1 on mobile and stat values.
- **Title 3** (600, 21px, 1.35): card titles, lesson step titles, the mobile menu rows and the showcase analogy line (400). It also sets the hero subhead from md.
- **Body** (400, 17px, 1.55): all running text, buttons and list rows. Theory prose uses line height 1.65 and a 68ch max width.
- **Caption / Label** (400, 14px, 1.45): meta rows, trailing values in lists, desktop nav links and step numbers.
- **Code** (mono, 15px on mobile and 17px from sm, 1.75): showcase and lesson code. Inline code in theory is set at 0.9em.

### Named Rules
**The Straight Operators Rule.** Code never uses ligatures (`liga` and `calt` are off on pre, code, kbd and samp). Beginners retype what they see, so `>=` must look like two characters.

**The Tabular Count Rule.** Counters, progress percentages, step numbers and line numbers use tabular numerals.

**The Balanced Heading Rule.** h1 to h3 use `text-wrap: balance`, and line length is capped with ch widths (36 to 60ch for supporting text).

## Layout

Content sits in a centered column with a 16px gutter on mobile and 24px from sm. There are four container widths: narrow 680px (FAQ), text 760px (reading), default 1080px and wide 1200px (hero, navbar). The lesson showcase is a fixed 980px figure. Home sections alternate between bg and surface tone with 80px vertical padding on mobile and 128px from md. Content pages open with 48px top padding on mobile and 80px from md, and 96px bottom padding. Course grids use one column, then two from sm and three from lg, with a 16px gap. Spacing follows the 4px Tailwind grid, and the most common steps are 4, 8, 12, 16, 24, 32 and 40. Every touch target is at least 44px tall, and rows are at least 52px. At md the navbar switches to a full-screen menu and Sheet replaces side panels.

## Elevation & Depth

The system is flat and uses tonal layering: depth comes from bg, surface and surface-hover plus 1px hairlines. The only shadow belongs to surfaces that float above the page.

### Shadow Vocabulary
- **Popover** (`0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.08)` light; `0 8px 24px rgba(0,0,0,.6)` dark): the login dialog and the profile menu.

### Named Rules
**The Single Glass Rule.** The sticky navbar is the only translucent surface (nav-bg at 80% white or 72% black, backdrop blur 20px, saturate 180%, hairline bottom border). Cards, sheets, dialogs and menus are opaque.

**The Floating-Only Shadow Rule.** A shadow means the element floats over the page. Cards, lists and code blocks at rest never have one.

**The Scrim Rule.** Modal overlays use the overlay token (40% black light, 60% dark). In dark mode, dialogs and sheets lift to surface rather than gaining a shadow.

## Shapes

There are two surface radii. **12px** is for anything row-sized: grouped lists, buttons, input fields, icon buttons, code blocks, menus and segmented tracks. **24px** is for large surfaces: the showcase, course cards and their skeletons, dialogs and the sheet's top edge. **8px** is used only inside those surfaces (segmented options, the highlight band on the running showcase line, the copy button). **Fully rounded controls** appear only on the single main CTA of a screen. Elsewhere, fully rounded shapes are indicators: avatar initials, path dots, lesson dots, the 2px progress line and the spinner. There are no images or decorative shapes. Icons are Lucide line icons at 16 to 22px.

**The Pill Is Singular Rule.** Only one pill button per screen, and it is the main CTA («Начать учиться», «Войти через Telegram»). Every other button uses the 12px radius.

## Components

### Buttons
Confident and quiet.
- **Shape:** 12px radius. The main CTA uses a full pill.
- **Primary:** accent fill with accent-fg text, weight 500 body size, height 44px with 20px side padding (lg is 48px with 28px side padding).
- **Secondary:** surface fill with fg text, hover goes to surface-hover.
- **Plain:** link-coloured text, underlines on hover, 4px side padding and 44px tap height. Paired text links next to the CTA use the same treatment.
- **States:** 150ms strong ease-out on colour, press scales to 0.98, disabled drops to 40% opacity. Focus shows the global 2px accent outline with 2px offset, keyboard only.

### Inset Grouped List (signature)
- **GroupedList:** one surface panel with a 12px radius and clipped overflow.
- **GroupedRow:** at least 52px tall with 12px/16px padding and a 12px gap, plus optional leading and trailing slots (trailing text is caption, fg-muted). Rows are separated by hairline top borders, and the first row has none. Interactive rows (link or button) fill with surface-hover on hover and press, and their focus outline is drawn inset.
- Used for lesson lists, search results, dashboard lists, login options and predict checks.

### Cards / Containers
- **Course card:** 24px radius, surface fill, 24px padding (32px from md), no border and no shadow. Title in title3, body in fg-muted, meta caption pinned to the bottom and joined with " · ". A 2px progress line appears once the course is started. Hover fills with surface-hover.
- **Home step list:** an open list with hairline borders top and bottom. Tabular caption numbers sit in a 24px column.

### Inputs / Fields
- **Style:** bg fill, 1px hairline border, 12px radius, 48px tall (44px inline), body text, fg-muted placeholder. The search field has a 20px leading icon.
- **Focus:** the global 2px accent outline with 2px offset.

### Navigation
- **Navbar:** sticky, 52px tall, wide container, glass per the Single Glass Rule. The wordmark is body 600 with tight tracking. Desktop links are caption text, fg-muted and fg when active, with no blue and no underline. Sign-in is a link-coloured text button. The profile menu is a bg panel with a 12px radius, hairline border and popover shadow, and it supports arrow-key navigation.
- **Mobile:** 44px icon buttons open a full-screen bg menu. Its rows are title3 600 at 56px tall with hairline separators, and the pill CTA sits at the bottom.

### Overlays
- **Dialog:** 400px wide, 24px radius, 32px padding (24px on mobile), popover shadow, overlay scrim.
- **Sheet:** a bottom panel with 24px top corners, at most 85dvh tall, a 56px header with a hairline and a 44px close button.
- **Motion:** framer-motion `LazyMotion` (domAnimation, strict) with `m` components. Panels animate opacity plus scale from 0.97 to 1, taking 200ms in and 150ms out, and the scrim fades.

### Code: Lesson Showcase and CodeBlock (signature)
- **LessonShowcase:** a 980px figure with a 24px radius on surface, padded 32px/24px on mobile up to 40px/56px from md. It has a muted caption and a title3 analogy line (60ch max). Below that are 7 lines of real lesson code, hand-tokenised with the `--shiki-token-*` colours, with a 16px tabular line-number column. The branch that runs sits on a surface-hover band with an 8px radius, and its line numbers switch to fg. A hairline footer holds the mono output and the «Открыть урок» link.
- **CodeBlock:** the same visual style applied to lessons. It uses a 12px radius on surface, has a header with the mono language label and a copy button, and a body padded 24px on mobile and 32px from sm. Shiki (css-variables theme, loaded on demand) renders the code with CSS-counter line numbers that match the showcase.

### Progress
- **ProgressBar:** a 2px fully rounded line with a hairline track and accent fill. It never animates.

### Motion
- Easing is always `cubic-bezier(0.23, 1, 0.32, 1)`. Durations are 300ms for the hero (opacity with an 8px rise), 250ms for home section reveals (once, at 15% in view, no stagger), 220ms for accordion answers (opacity), 200ms for overlay enter and 150ms for exit and hover colour. Routes change instantly. Under `prefers-reduced-motion`, durations collapse to 0 and only the spinner keeps turning, at 1.5s.

## Do's and Don'ts

### Do:
- **Do** use token names only (bg, surface, fg, fg-muted, line, accent, link) and define new colours in index.css for both themes.
- **Do** keep blue to actions, links, active state, focus and progress, and use the link token for text links.
- **Do** group items in inset grouped lists (12px radius on surface, hairline dividers, rows at least 52px).
- **Do** show code with the showcase or CodeBlock styling: surface panel, line numbers, `--shiki-token-*` colours, ligatures off.
- **Do** use 12px radii for rows, fields and code, 24px for large surfaces, and 8px only for elements nested inside them.
- **Do** keep every tap target at least 44px tall and every appearance at 300ms or less with the strong ease-out, instant under reduced motion.

### Don't:
- **Don't** put hex values in components or pages.
- **Don't** use emoji in the UI, including content pulled from the bot (strip leading emoji).
- **Don't** add raster images, illustrations or hero art. Real code is the imagery.
- **Don't** put eyebrow or kicker labels above headings.
- **Don't** use a pill shape for anything except the screen's single main CTA.
- **Don't** make any surface other than the navbar translucent, and don't put shadows on resting cards, lists or code.
- **Don't** animate route changes or progress values.
