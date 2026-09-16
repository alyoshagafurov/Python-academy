"""Presentation layer: turn the bot's content dataclasses into API dicts.

Adds web-only metadata the bot never needed (difficulty level, cover accent
colours) without touching the bot. All course/lesson data still comes from the
bot's loader — this module only *shapes* it for the frontend.
"""
from __future__ import annotations

import hashlib
import html
import random
import re
from functools import lru_cache

from app import bot_bridge as bot

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")

# Pictographic emoji, dingbats/symbols blocks, variation selector, ZWJ.
_EMOJI = "[\U0001F000-\U0001FAFF☀-➿⬀-⯿️‍]"
_EMOJI_LINE_START_RE = re.compile(rf"(?m)^[ \t]*{_EMOJI}+[ \t]*")
_EMOJI_INLINE_RE = re.compile(rf"[ \t]*{_EMOJI}+")


def no_emoji(text: str | None) -> str:
    """Drop emoji from bot content shown as site text («рюкзак 🎒:» → «рюкзак:»).
    Never applied to code fields (example, check code): there they are data."""
    if not text:
        return text or ""
    return _EMOJI_INLINE_RE.sub("", _EMOJI_LINE_START_RE.sub("", text))

# Web-only per-course metadata (level + cover accent). Keyed by course id.
COURSE_META: dict[str, dict] = {
    "python_beginner": {"level": "Новичок",    "level_order": 1, "accent": "#22c55e", "gradient": ["#16a34a", "#22c55e"]},
    "python_minecraft": {"level": "Новичок",    "level_order": 1, "accent": "#65a30d", "gradient": ["#4d7c0f", "#84cc16"]},
    "web_htmlcss":      {"level": "Новичок",    "level_order": 1, "accent": "#ec4899", "gradient": ["#db2777", "#f472b6"]},
    "math_thinking":    {"level": "Новичок",    "level_order": 1, "accent": "#2563eb", "gradient": ["#1d4ed8", "#3b82f6"]},
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

        name = _tn(topic) or ""
    except Exception:
        name = ""
    if name and name != topic:
        return no_emoji(name)
    # No name in the bot's constants (the bot echoes the raw key back, e.g. for
    # math_* topics): show the title of the first lesson with this topic instead.
    return no_emoji(_lesson_titles_by_topic().get(topic, name or topic))


@lru_cache(maxsize=1)
def _lesson_titles_by_topic() -> dict[str, str]:
    """topic key → title of the first lesson that uses it (content is static per process)."""
    titles: dict[str, str] = {}
    for course in bot.all_courses().values():
        for lesson in course.lessons:
            if lesson.topic:
                titles.setdefault(lesson.topic, lesson.title)
    return titles


# ─────────────────────────────── lessons ──────────────────────────────────

def lesson_brief(course_id: str, lesson: "bot.Lesson") -> dict:
    """Compact lesson shape for trees / lists."""
    return {
        "id": lesson.id,
        "course_id": course_id,
        "stage_id": lesson.stage_id,
        "title": no_emoji(lesson.title),
        "topic": lesson.topic,
        "topic_name": topic_name(lesson.topic),
        # No XP: without accounts there is no progress to score.
        "placeholder": lesson.placeholder,
    }


def lesson_full(course_id: str, lesson: "bot.Lesson", nav: dict | None = None) -> dict:
    """Full lesson body for the reading view."""
    course = bot.get_course(course_id)
    return {
        **lesson_brief(course_id, lesson),
        "course_title": no_emoji(course.title),
        "course_emoji": course.emoji,
        "theory": no_emoji(lesson.theory),
        "association": no_emoji(lesson.association),
        "real_example": no_emoji(lesson.real_example),
        "example": lesson.example,  # code: shown as authored
        "code_explained": no_emoji(lesson.code_explained),
        "common_mistakes": [no_emoji(m) for m in lesson.common_mistakes],
        "check": lesson_check(lesson, course_id),
        "nav": nav or {"prev_id": None, "next_id": None},
    }


def _quiz_public(q) -> dict | None:
    """Serialize a Quiz for the web (text fields unescaped for plain display)."""
    if q is None:
        return None
    return {
        "question": no_emoji(html.unescape(q.question or "")),
        "options": [no_emoji(html.unescape(o)) for o in q.options],
        "correct": int(q.correct),
        "explanation": no_emoji(html.unescape(q.explanation or "")),
        "code": q.code or "",  # raw code shown in a code block
    }


def lesson_check(lesson: "bot.Lesson", course_id: str | None = None) -> dict | None:
    """One gentle self-check for the lesson (retrieval practice).

    Reuses the lesson's existing quiz data. Prefers a "predict the output"
    style (a question that ships code), then the quiz, challenge, practice.
    With ``course_id`` the options are shown in the site's stable shuffled order;
    without it they keep the bot's order (the mentor names the answer by text,
    so both agree on what is right).
    """
    candidates = [lesson.challenge, lesson.quiz, lesson.practice]
    with_code = next((q for q in candidates if q and q.code), None)
    chosen = with_code or lesson.quiz or lesson.challenge or lesson.practice
    check = _quiz_public(chosen)
    if check is None or course_id is None:
        return check
    kind = next(k for k in ("challenge", "quiz", "practice") if getattr(lesson, k) is chosen)
    return _shuffle_options(check, course_id, lesson.id, kind)


def _shuffle_options(check: dict, course_id: str, lesson_id: int, kind: str) -> dict:
    """The bot's content puts almost every right answer first. The site moves it:
    the right answer's position rotates lesson by lesson (a per-course offset plus
    the lesson id), and the other options are shuffled with the seed
    course_id:lesson_id:kind. The same lesson always shows the same order."""
    options = check["options"]
    count, correct = len(options), check["correct"]
    if count < 2 or not 0 <= correct < count:
        return check
    offset = int.from_bytes(hashlib.sha256(course_id.encode()).digest()[:4], "big")
    target = (offset + lesson_id) % count
    others = [i for i in range(count) if i != correct]
    random.Random(f"{course_id}:{lesson_id}:{kind}").shuffle(others)
    order = others[:target] + [correct] + others[target:]
    return {**check, "options": [options[i] for i in order], "correct": target}


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

def course_card(course: "bot.Course") -> dict:
    """Course shape for the catalog/landing cards."""
    meta = course_meta(course.id)
    return {
        "id": course.id,
        "title": no_emoji(course.title),
        "emoji": course.emoji,
        "description": no_emoji(course.description or ""),
        "language": course.language,
        "track": course.track,
        "level": meta["level"],
        "level_order": meta["level_order"],
        "accent": meta["accent"],
        "gradient": meta["gradient"],
        "total_lessons": course.total,
        "stages_count": len(course.stages),
    }


def course_detail(course: "bot.Course") -> dict:
    """Full course tree: stages → lessons."""
    stages = [
        {
            "id": stage.id,
            "title": no_emoji(stage.title),
            "subtitle": no_emoji(stage.subtitle),
            "emoji": stage.emoji,
            "total": stage.total,
            "lessons": [lesson_brief(course.id, lesson) for lesson in stage.lessons],
        }
        for stage in course.stages
    ]
    card = course_card(course)
    card["stages"] = stages
    return card
