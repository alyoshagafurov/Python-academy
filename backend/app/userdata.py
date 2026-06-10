"""Per-user data helpers shared by routers (progress pointer, bookmarks).

Thin async wrappers over the bot's data-access layer — all reads/writes go to
the shared academy.db via the bot's own ``models`` functions.
"""
from __future__ import annotations

from app import bot_bridge as bot


async def course_pointer(user_id: int | None, course_id: str) -> int | None:
    """The user's current lesson pointer in a course, or None if anonymous/new."""
    if user_id is None:
        return None
    user = await bot.models.get_user(user_id)
    if user is None:
        return None
    return await bot.progress_service.current_lesson(user, course_id)


async def bookmarked_ids(user_id: int | None, course_id: str) -> set[int]:
    """Set of lesson ids the user bookmarked within a given course."""
    if user_id is None:
        return set()
    pairs = await bot.models.list_bookmarks(user_id)
    return {lid for cid, lid in pairs if cid == course_id}


async def all_pointers(user_id: int | None) -> dict[str, int | None]:
    """current_lesson per course id (None values when anonymous)."""
    out: dict[str, int | None] = {}
    user = await bot.models.get_user(user_id) if user_id is not None else None
    for course in bot.all_courses().values():
        if user is None:
            out[course.id] = None
        else:
            out[course.id] = await bot.progress_service.current_lesson(user, course.id)
    return out
