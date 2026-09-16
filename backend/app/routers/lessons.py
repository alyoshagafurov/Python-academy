"""Single lesson: full body, 'explain simpler', related topics."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app import bot_bridge as bot
from app import content

router = APIRouter(prefix="/api/courses/{course_id}/lessons", tags=["lessons"])


def _require_lesson(course_id: str, lesson_id: int):
    courses = bot.all_courses()
    if course_id not in courses:
        raise HTTPException(status_code=404, detail="Курс не найден.")
    lesson = courses[course_id].get(lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Урок не найден.")
    return courses[course_id], lesson


def _nav(course, lesson_id: int) -> dict:
    ids = [l.id for l in course.lessons]
    try:
        i = ids.index(lesson_id)
    except ValueError:
        return {"prev_id": None, "next_id": None}
    return {
        "prev_id": ids[i - 1] if i > 0 else None,
        "next_id": ids[i + 1] if i < len(ids) - 1 else None,
    }


@router.get("/{lesson_id}")
async def get_lesson(course_id: str, lesson_id: int) -> dict:
    course, lesson = _require_lesson(course_id, lesson_id)
    return content.lesson_full(course_id, lesson, _nav(course, lesson_id))


@router.get("/{lesson_id}/simple")
async def get_lesson_simple(course_id: str, lesson_id: int) -> dict:
    _, lesson = _require_lesson(course_id, lesson_id)
    return content.lesson_simple(lesson)


@router.get("/{lesson_id}/related")
async def get_related(course_id: str, lesson_id: int) -> dict:
    _, lesson = _require_lesson(course_id, lesson_id)
    items = bot.related_service.related(course_id, lesson, limit=6)
    return {
        "items": [
            {
                "course_id": rel.course_id,
                "course_title": content.no_emoji(bot.get_course(rel.course_id).title),
                "course_emoji": bot.get_course(rel.course_id).emoji,
                "lesson_id": rel.lesson.id,
                "title": content.no_emoji(rel.lesson.title),
                "topic_name": content.topic_name(rel.lesson.topic),
            }
            for rel in items
        ]
    }
