"""Personal area: profile, progress, bookmarks, recommendations."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app import bot_bridge as bot
from app import content, userdata
from app.auth import require_user

router = APIRouter(prefix="/api/me", tags=["me"])


@router.get("")
async def profile(user_id: int = Depends(require_user)) -> dict:
    user = await bot.models.get_user(user_id)
    if user is None:
        # Session points at a user that no longer exists.
        return {"user": None}

    info = bot.level_service.level_info(user.xp)
    pointers = await userdata.all_pointers(user_id)
    courses = []
    for course in bot.all_courses().values():
        cur = pointers.get(course.id)
        done, total, percent = bot.course_service.course_progress(cur or 1, course)
        courses.append({
            "id": course.id,
            "title": course.title,
            "emoji": course.emoji,
            "accent": content.course_meta(course.id)["accent"],
            "percent": percent if cur is not None else 0,
            "done": done if cur is not None else 0,
            "total": total,
        })
    courses.sort(key=lambda c: (-c["percent"], c["title"]))

    return {
        "user": {
            "id": user.user_id,
            "username": user.username,
            "xp": user.xp,
            "level": info.level,
            "level_title": info.title,
            "level_percent": info.percent,
            "xp_to_next": info.to_next,
            "streak": user.streak,
            "best_streak": user.best_streak,
            "is_pro": bool(user.is_pro),
        },
        "courses": courses,
        "bookmarks_count": await bot.bookmark_service.count(user_id),
    }


@router.get("/bookmarks")
async def bookmarks(user_id: int = Depends(require_user)) -> dict:
    items = await bot.bookmark_service.list_lessons(user_id)
    return {
        "items": [
            {
                "course_id": bm.course_id,
                "course_title": bot.get_course(bm.course_id).title,
                "course_emoji": bot.get_course(bm.course_id).emoji,
                "lesson_id": bm.lesson.id,
                "title": bm.lesson.title,
                "topic_name": content.topic_name(bm.lesson.topic),
            }
            for bm in items
        ]
    }


@router.get("/recommendations")
async def recommendations(user_id: int = Depends(require_user)) -> dict:
    recs = await bot.recommend_service.recommend(user_id, limit=4)
    return {
        "items": [
            {
                "course_id": r.course_id,
                "course_title": bot.get_course(r.course_id).title,
                "course_emoji": bot.get_course(r.course_id).emoji,
                "lesson_id": r.lesson.id,
                "title": r.lesson.title,
                "topic_name": content.topic_name(r.lesson.topic),
                "reason": r.reason,
            }
            for r in recs
        ]
    }


class BookmarkBody(BaseModel):
    course_id: str
    lesson_id: int


# Bookmark toggle lives outside the /me prefix for a cleaner verb.
toggle_router = APIRouter(prefix="/api/bookmarks", tags=["me"])


@toggle_router.post("")
async def toggle_bookmark(
    body: BookmarkBody, user_id: int = Depends(require_user)
) -> dict:
    if body.course_id not in bot.all_courses():
        return {"bookmarked": False, "error": "course_not_found"}
    now_bookmarked = await bot.bookmark_service.toggle(
        user_id, body.course_id, body.lesson_id
    )
    return {"bookmarked": now_bookmarked}
