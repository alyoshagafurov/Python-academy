"""Presentation layer: turn the bot's content dataclasses into API dicts.

Adds web-only metadata the bot never needed (difficulty level, cover accent
colours) without touching the bot. All course/lesson data still comes from the
bot's loader — this module only *shapes* it for the frontend.
"""
from __future__ import annotations

import html
import re
from typing import Iterable

from app import bot_bridge as bot

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")

# Web-only per-course metadata (level + cover accent). Keyed by course id.
COURSE_META: dict[str, dict] = {
    "python_beginner": {"level": "Новичок",    "level_order": 1, "accent": "#22c55e", "gradient": ["#16a34a", "#22c55e"]},
    "python_minecraft": {"level": "Новичок",    "level_order": 1, "accent": "#65a30d", "gradient": ["#4d7c0f", "#84cc16"]},
    "web_htmlcss":      {"level": "Новичок",    "level_order": 1, "accent": "#ec4899", "gradient": ["#db2777", "#f472b6"]},
    "web_python":       {"level": "Средний",    "level_order": 2, "accent": "#3b82f6", "gradient": ["#2563eb", "#38bdf8"]},
    "python_student":   {"level": "Продвинутый", "level_order": 3, "accent": "#a855f7", "gradient": ["#7c3aed", "#c084fc"]},
}
_DEFAULT_META = {"level": "Новичок", "level_order": 1, "accent": "#6366f1", "gradient": ["#4f46e5", "#818cf8"]}


def course_meta(course_id: str) -> dict:
    return COURSE_META.get(course_id, _DEFAULT_META)


def plain(text: str) -> str:
    """Strip HTML tags and collapse whitespace (for snippets/previews)."""
    return _WS_RE.sub(" ", _TAG_RE.sub(" ", text or "")).strip()


def topic_name(topic: str) -> str:
    try:
        from utils.constants import topic_name as _tn  # bot module (on sys.path)

        return _tn(topic) or topic
    except Exception:
        return topic


# ─────────────────────────────── lessons ──────────────────────────────────

def lesson_status(lesson_id: int, current_lesson: int | None) -> str:
    """Web statuses: done / current / todo (no hard locks — free browsing)."""
    if current_lesson is None:
        return "todo"
    if lesson_id < current_lesson:
        return "done"
    if lesson_id == current_lesson:
        return "current"
    return "todo"


def lesson_brief(
    course_id: str,
    lesson: "bot.Lesson",
    current_lesson: int | None = None,
    bookmarked: bool = False,
) -> dict:
    """Compact lesson shape for trees / lists."""
    return {
        "id": lesson.id,
        "course_id": course_id,
        "stage_id": lesson.stage_id,
        "title": lesson.title,
        "topic": lesson.topic,
        "topic_name": topic_name(lesson.topic),
        "xp": lesson.xp,
        "status": lesson_status(lesson.id, current_lesson),
        "bookmarked": bookmarked,
        "placeholder": lesson.placeholder,
    }


def lesson_full(
    course_id: str,
    lesson: "bot.Lesson",
    current_lesson: int | None = None,
    bookmarked: bool = False,
    nav: dict | None = None,
) -> dict:
    """Full lesson body for the reading view."""
    course = bot.get_course(course_id)
    return {
        **lesson_brief(course_id, lesson, current_lesson, bookmarked),
        "course_title": course.title,
        "course_emoji": course.emoji,
        "theory": lesson.theory,
        "association": lesson.association,
        "real_example": lesson.real_example,
        "example": lesson.example,
        "code_explained": lesson.code_explained,
        "common_mistakes": list(lesson.common_mistakes),
        "check": lesson_check(lesson),
        "nav": nav or {"prev_id": None, "next_id": None},
    }


def _quiz_public(q) -> dict | None:
    """Serialize a Quiz for the web (text fields unescaped for plain display)."""
    if q is None:
        return None
    return {
        "question": html.unescape(q.question or ""),
        "options": [html.unescape(o) for o in q.options],
        "correct": int(q.correct),
        "explanation": html.unescape(q.explanation or ""),
        "code": q.code or "",  # raw code shown in a code block
    }


def lesson_check(lesson: "bot.Lesson") -> dict | None:
    """One gentle self-check for the lesson (retrieval practice).

    Reuses the lesson's existing quiz data. Prefers a "predict the output"
    style (a question that ships code), then the quiz, challenge, practice.
    """
    candidates = [lesson.challenge, lesson.quiz, lesson.practice]
    with_code = next((q for q in candidates if q and q.code), None)
    chosen = with_code or lesson.quiz or lesson.challenge or lesson.practice
    return _quiz_public(chosen)


def lesson_simple(lesson: "bot.Lesson") -> dict:
    """Structured 'explain simpler' built from the same source fields the bot
    uses (analogy + first sentence of theory + first example + first pitfall).
    """
    theory_plain = plain(lesson.theory)
    gist = ""
    for sep in (". ", "! ", "? "):
        if sep in theory_plain:
            gist = theory_plain.split(sep)[0].strip() + "."
            break
    if not gist:
        gist = theory_plain[:200]
    return {
        "title": lesson.title,
        "analogy": lesson.association or "",
        "gist": gist,
        "example": lesson.example or "",
        "pitfall": plain(lesson.common_mistakes[0]) if lesson.common_mistakes else "",
    }


# ─────────────────────────────── courses ──────────────────────────────────

def course_card(course: "bot.Course", current_lesson: int | None = None) -> dict:
    """Course shape for the catalog/landing cards."""
    done, total, percent = bot.course_service.course_progress(
        current_lesson or 1, course
    ) if current_lesson is not None else (0, course.total, 0)
    meta = course_meta(course.id)
    return {
        "id": course.id,
        "title": course.title,
        "emoji": course.emoji,
        "description": course.description or "",
        "language": course.language,
        "track": course.track,
        "level": meta["level"],
        "level_order": meta["level_order"],
        "accent": meta["accent"],
        "gradient": meta["gradient"],
        "total_lessons": course.total,
        "stages_count": len(course.stages),
        "progress": {"done": done, "total": total, "percent": percent}
        if current_lesson is not None
        else None,
    }


def course_detail(
    course: "bot.Course",
    current_lesson: int | None = None,
    bookmarked_ids: Iterable[int] = (),
) -> dict:
    """Full course tree: stages → lessons, with progress + bookmark flags."""
    bm = set(bookmarked_ids)
    cur = current_lesson if current_lesson is not None else None
    stages = []
    for stage in course.stages:
        sp = bot.course_service.stage_progress(stage, cur or 1) if cur is not None else None
        stages.append({
            "id": stage.id,
            "title": stage.title,
            "subtitle": stage.subtitle,
            "emoji": stage.emoji,
            "status": (sp.status if sp and sp.status != "locked" else "todo") if sp else "todo",
            "done": sp.done if sp else 0,
            "total": stage.total,
            "percent": sp.percent if sp else 0,
            "lessons": [
                lesson_brief(course.id, lesson, cur, lesson.id in bm)
                for lesson in stage.lessons
            ],
        })
    card = course_card(course, cur)
    card["stages"] = stages
    return card
