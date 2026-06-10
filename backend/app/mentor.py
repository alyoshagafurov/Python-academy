"""Zero-token rule-based mentor.

Builds a Socratic hint ladder and adaptive explanations purely from the lesson
content the bot already authored (association, example, code_explained,
common_mistakes, the check + its explanation). No LLM, no tokens — this is the
validation layer that runs before any Claude API integration.

Escalation to a real AI mentor is decided here but gated by settings.ai_enabled
(off until validated + an API key exists); for now we only *log* that an AI
hand-off would have happened, to measure real demand.
"""
from __future__ import annotations

from app import bot_bridge as bot
from app import content

HINT_RUNGS = 5

EXPLAIN_STYLES = [
    {"id": "prosto", "label": "На пальцах"},
    {"id": "analogy", "label": "Через аналогию"},
    {"id": "example", "label": "На примере"},
    {"id": "steps", "label": "По шагам"},
    {"id": "life", "label": "Из жизни"},
]


def _lesson(course_id: str, lesson_id: int):
    courses = bot.all_courses()
    if course_id not in courses:
        return None
    return courses[course_id].get(lesson_id)


def _first_lines(code: str, n: int = 3) -> str:
    return "\n".join((code or "").splitlines()[:n])


# ─────────────────────────── Socratic hint ladder ──────────────────────────

def build_hint(course_id: str, lesson_id: int, rung: int) -> dict | None:
    """One rung of the hint ladder. rung is clamped to 1..HINT_RUNGS."""
    lesson = _lesson(course_id, lesson_id)
    if lesson is None:
        return None
    check = content.lesson_check(lesson)
    topic = content.topic_name(lesson.topic)
    assoc = content.plain(lesson.association)
    mistakes = [content.plain(m) for m in lesson.common_mistakes]
    explanation = content.plain(check["explanation"]) if check else ""
    correct_opt = check["options"][check["correct"]] if check else ""

    r = max(1, min(rung, HINT_RUNGS))

    if r == 1:  # gentle Socratic nudge
        kind = "question"
        text = (
            f"🔗 Вспомни аналогию: {assoc}\n\nКак это относится к вопросу? Не спеши выбирать."
            if assoc
            else f"Не торопись. Что ты уже знаешь про «{topic}»? Прикинь, какой вариант логичнее, и попробуй ещё раз."
        )
    elif r == 2:  # nudge toward the common pitfall
        kind = "hint"
        if mistakes:
            text = f"⚠️ Тут легко споткнуться: {mistakes[0]}\n\nПроверь, не в этом ли дело."
        elif lesson.example:
            text = "Подсказка прямо в примере выше 👆 — перечитай его внимательно и попробуй снова."
        else:
            text = f"Сосредоточься на сути темы «{topic}». Что здесь главное?"
    elif r == 3:  # point at the concrete example
        kind = "hint"
        if lesson.example:
            text = (
                "Разбери пример по шагам:\n\n"
                f"{_first_lines(lesson.example)}\n\nЧто он делает строка за строкой?"
            )
        elif len(mistakes) > 1:
            text = f"Ещё одна ловушка: {mistakes[1]}"
        else:
            text = "Подумай, что именно происходит в этой теме, прежде чем выбрать вариант."
    elif r == 4:  # reasoning, still no answer letter
        kind = "reasoning"
        text = (
            f"Смысл такой: {explanation}\n\nТеперь подумай — какой из вариантов это описывает?"
            if explanation
            else "Сравни варианты с тем, что мы разобрали. Какой точно подходит под определение темы?"
        )
    else:  # r == 5 — full walkthrough (only after the climb)
        kind = "solution"
        text = (
            (f"✅ Правильный ответ: «{correct_opt}».\n\n" if correct_opt else "")
            + (f"Почему: {explanation}" if explanation else "Сверься с примером и определением темы выше.")
        )

    return {
        "rung": r,
        "total": HINT_RUNGS,
        "kind": kind,
        "text": text,
        "is_solution": r >= HINT_RUNGS,
        "can_escalate": r < HINT_RUNGS,
    }


# ──────────────────────────── Adaptive explainer ───────────────────────────

def _gist(theory_html: str) -> str:
    plain = content.plain(theory_html)
    for sep in (". ", "! ", "? "):
        if sep in plain:
            return plain.split(sep)[0].strip() + "."
    return plain[:200]


def build_explanation(course_id: str, lesson_id: int, style: str) -> dict | None:
    """A re-cut of the existing lesson content in the chosen style (no tokens)."""
    lesson = _lesson(course_id, lesson_id)
    if lesson is None:
        return None

    assoc = content.plain(lesson.association)
    real = content.plain(lesson.real_example)
    gist = _gist(lesson.theory)
    mistakes = [content.plain(m) for m in lesson.common_mistakes]
    blocks: list[dict] = []

    if style == "analogy":
        if assoc:
            blocks.append({"kind": "text", "text": f"🔗 {assoc}"})
        if real:
            blocks.append({"kind": "text", "text": f"💼 В реальности: {real}"})
    elif style == "example":
        if lesson.example:
            blocks.append({"kind": "code", "text": lesson.example})
        ce = content.plain(lesson.code_explained)
        if ce:
            blocks.append({"kind": "text", "text": f"🔑 {ce}"})
    elif style == "steps":
        ce = content.plain(lesson.code_explained)
        steps = [s.strip(" •") for s in ce.replace("•", "\n").split("\n") if s.strip(" •")]
        if steps:
            blocks.append({"kind": "text", "text": "\n".join(f"{i+1}. {s}" for i, s in enumerate(steps))})
        elif gist:
            blocks.append({"kind": "text", "text": gist})
    elif style == "life":
        if real:
            blocks.append({"kind": "text", "text": f"💼 {real}"})
        if assoc:
            blocks.append({"kind": "text", "text": f"🔗 {assoc}"})
    else:  # "prosto" — на пальцах (default)
        if assoc:
            blocks.append({"kind": "text", "text": f"🔗 {assoc}"})
        if gist:
            blocks.append({"kind": "text", "text": f"В двух словах: {gist}"})
        if mistakes:
            blocks.append({"kind": "text", "text": f"⚠️ Не споткнись: {mistakes[0]}"})

    # Fallback so a style never renders empty.
    if not blocks:
        blocks.append({"kind": "text", "text": gist or assoc or "Перечитай пример выше — он показывает суть."})

    return {"style": style, "blocks": blocks}
