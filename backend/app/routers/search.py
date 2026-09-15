"""Fast theory search across all courses (reuses the bot's search_service)."""
from __future__ import annotations

import html
import re

from fastapi import APIRouter, Query

from app import bot_bridge as bot
from app import content

router = APIRouter(prefix="/api/search", tags=["search"])

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")
_SPACE_BEFORE_PUNCT_RE = re.compile(r"\s+([,.;:!?)»])")


def _snippet_text(theory_html: str) -> str:
    """Plain text for a search snippet: inline tags are removed without leaving a
    gap («<code>x</code>, а» → «x, а»), emoji dropped, whitespace collapsed."""
    text = html.unescape(_TAG_RE.sub("", theory_html or ""))
    text = _SPACE_BEFORE_PUNCT_RE.sub(r"\1", _WS_RE.sub(" ", text))
    return content.no_emoji(text).strip()


@router.get("")
async def search(q: str = Query(default="", min_length=0, max_length=200), limit: int = 12) -> dict:
    hits = bot.search_service.search(q, limit=max(1, min(limit, 30)))
    out = []
    for hit in hits:
        course = bot.get_course(hit.course_id)
        body = _snippet_text(hit.lesson.theory)
        out.append({
            "course_id": hit.course_id,
            "course_title": content.no_emoji(course.title),
            "course_emoji": course.emoji,
            "lesson_id": hit.lesson.id,
            "title": content.no_emoji(hit.lesson.title),
            "topic": hit.lesson.topic,
            "topic_name": content.topic_name(hit.lesson.topic),
            "score": hit.score,
            "snippet": (body[:160] + "…") if len(body) > 160 else body,
        })
    return {"query": q, "hits": out}
