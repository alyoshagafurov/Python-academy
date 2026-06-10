"""Mentor API — zero-token rule-based mentor + analytics + rate limiting."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from app import bot_bridge as bot
from app import mentor, mentor_store
from app.auth import optional_user
from app.settings import settings

router = APIRouter(prefix="/api/mentor", tags=["mentor"])

# Event types the frontend may log directly (hint_request / explain_open are
# logged server-side by their own endpoints, not accepted here).
_ALLOWED_EVENTS = {
    "lesson_view", "lesson_read", "check_attempt", "check_recovered",
    "retry_after_hint", "mentor_open", "explain_not_helpful", "escalation_candidate",
}


async def actor(
    user_id: int | None = Depends(optional_user),
    x_anon_id: str | None = Header(default=None),
) -> str:
    """Stable identity for telemetry/rate-limit: logged-in user or anon client id."""
    if user_id is not None:
        return f"user:{user_id}"
    if x_anon_id:
        return f"anon:{x_anon_id[:64]}"
    return "anon:unknown"


async def _check_rate(who: str) -> None:
    used = await mentor_store.recent_count(
        who, ("hint_request", "explain_open"), seconds=3600
    )
    if used >= settings.mentor_rate_per_hour:
        raise HTTPException(
            status_code=429,
            detail="Слишком много подсказок за час — сделай паузу и попробуй сам 🙂",
        )


def _title(course_id: str, lesson_id: int) -> str:
    lesson = bot.get_lesson(lesson_id, course_id)
    return lesson.title if lesson else ""


# ───────────────────────────── telemetry ──────────────────────────────────

class EventBody(BaseModel):
    type: str
    course_id: str | None = None
    lesson_id: int | None = None
    meta: dict | None = None


@router.post("/event")
async def log_event(body: EventBody, who: str = Depends(actor)) -> dict:
    if body.type not in _ALLOWED_EVENTS:
        raise HTTPException(status_code=400, detail="Unknown event type.")
    await mentor_store.log_event(
        who, body.type, body.course_id, body.lesson_id, meta=body.meta
    )
    return {"ok": True}


# ─────────────────────────── Socratic hints ───────────────────────────────

class HintBody(BaseModel):
    course_id: str
    lesson_id: int


@router.post("/hint")
async def hint(body: HintBody, who: str = Depends(actor)) -> dict:
    await _check_rate(who)

    # Server owns the rung: each prior hint for this item advances exactly one
    # step. The client cannot jump straight to the solution.
    prior = await mentor_store.item_hint_count(who, body.course_id, body.lesson_id)
    rung = prior + 1

    result = mentor.build_hint(body.course_id, body.lesson_id, rung)
    if result is None:
        raise HTTPException(status_code=404, detail="Урок не найден.")

    await mentor_store.log_event(
        who, "hint_request", body.course_id, body.lesson_id, rung=result["rung"],
        meta={"title": _title(body.course_id, body.lesson_id)},
    )

    # Climbed the whole ladder without getting it → strongest signal that a real
    # AI mentor would help. Logged now (no tokens); acted on once ai_enabled.
    if result["is_solution"]:
        await mentor_store.log_event(
            who, "escalation_candidate", body.course_id, body.lesson_id,
            meta={"reason": "ladder_exhausted", "title": _title(body.course_id, body.lesson_id)},
        )

    result["ai_available"] = settings.mentor_ai_enabled
    return result


# ─────────────────────────── Adaptive explainer ───────────────────────────

class ExplainBody(BaseModel):
    course_id: str
    lesson_id: int
    style: str = "prosto"


@router.get("/styles")
async def styles() -> dict:
    return {"styles": mentor.EXPLAIN_STYLES}


@router.post("/explain")
async def explain(body: ExplainBody, who: str = Depends(actor)) -> dict:
    await _check_rate(who)
    result = mentor.build_explanation(body.course_id, body.lesson_id, body.style)
    if result is None:
        raise HTTPException(status_code=404, detail="Урок не найден.")
    await mentor_store.log_event(
        who, "explain_open", body.course_id, body.lesson_id,
        meta={"style": body.style, "title": _title(body.course_id, body.lesson_id)},
    )
    result["ai_available"] = settings.mentor_ai_enabled
    return result


# ───────────────────────────── analytics ──────────────────────────────────

@router.get("/analytics")
async def analytics(user_id: int | None = Depends(optional_user)) -> dict:
    if not settings.mentor_analytics_open and user_id is None:
        raise HTTPException(status_code=401, detail="Требуется вход.")
    return await mentor_store.analytics()
