"""Public landing-page stats."""
from __future__ import annotations

from fastapi import APIRouter

from app import bot_bridge as bot

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/stats")
async def stats() -> dict:
    """Hero numbers for the landing page: only what the content itself proves.

    The site has no accounts, so there is no student count to report — and an
    invented one would be a lie.
    """
    courses = bot.all_courses()
    return {
        "courses": len(courses),
        "lessons": sum(c.total for c in courses.values()),
    }
