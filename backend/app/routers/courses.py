"""Courses + course tree. The site has no accounts, so nothing here is per-user."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app import bot_bridge as bot
from app import content

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("")
async def list_courses() -> dict:
    """All courses as cards, sorted by level then title."""
    cards = [content.course_card(course) for course in bot.all_courses().values()]
    cards.sort(key=lambda c: (c["level_order"], c["title"]))
    return {"courses": cards}


@router.get("/{course_id}")
async def get_course(course_id: str) -> dict:
    """Full course tree: stages with their lessons."""
    courses = bot.all_courses()
    if course_id not in courses:
        raise HTTPException(status_code=404, detail="Курс не найден.")
    return content.course_detail(courses[course_id])
