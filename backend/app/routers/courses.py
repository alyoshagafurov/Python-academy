"""Courses + course tree."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app import bot_bridge as bot
from app import content, userdata
from app.auth import optional_user

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("")
async def list_courses(user_id: int | None = Depends(optional_user)) -> dict:
    """All courses as cards, sorted by level then title; progress if logged in."""
    pointers = await userdata.all_pointers(user_id)
    cards = [
        content.course_card(course, pointers.get(course.id))
        for course in bot.all_courses().values()
    ]
    cards.sort(key=lambda c: (c["level_order"], c["title"]))
    return {"courses": cards}


@router.get("/{course_id}")
async def get_course(course_id: str, user_id: int | None = Depends(optional_user)) -> dict:
    """Full course tree (stages → lessons) with progress + bookmark flags."""
    courses = bot.all_courses()
    if course_id not in courses:
        raise HTTPException(status_code=404, detail="Курс не найден.")
    course = courses[course_id]
    pointer = await userdata.course_pointer(user_id, course_id)
    bm = await userdata.bookmarked_ids(user_id, course_id)
    return content.course_detail(course, pointer, bm)
