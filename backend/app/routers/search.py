"""Fast theory search across all courses (reuses the bot's search_service)."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app import bot_bridge as bot
from app import content

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
async def search(q: str = Query(default="", min_length=0), limit: int = 12) -> dict:
    hits = bot.search_service.search(q, limit=max(1, min(limit, 30)))
    out = []
    for hit in hits:
        course = bot.get_course(hit.course_id)
        body = content.plain(hit.lesson.theory)
        out.append({
            "course_id": hit.course_id,
            "course_title": course.title,
            "course_emoji": course.emoji,
            "lesson_id": hit.lesson.id,
            "title": hit.lesson.title,
            "topic": hit.lesson.topic,
            "topic_name": content.topic_name(hit.lesson.topic),
            "score": hit.score,
            "snippet": (body[:160] + "…") if len(body) > 160 else body,
        })
    return {"query": q, "hits": out}
