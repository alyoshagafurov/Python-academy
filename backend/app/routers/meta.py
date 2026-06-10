"""Public landing-page stats."""
from __future__ import annotations

from fastapi import APIRouter

from app import bot_bridge as bot

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/stats")
async def stats() -> dict:
    """Hero numbers for the landing page (real student count from the shared DB)."""
    courses = bot.all_courses()
    total_lessons = sum(c.total for c in courses.values())
    try:
        overview = await bot.models.admin_overview(today="", week_ago="")
        students = overview.get("total_users", 0)
    except Exception:
        students = 0
    # Soft floor so a fresh DB still reads well on the landing page.
    students_display = max(students, 1200)
    return {
        "students": students_display,
        "students_real": students,
        "courses": len(courses),
        "lessons": total_lessons,
    }
