"""Mentor API — zero-token rule-based mentor with rate limiting.

The site has no accounts, so every actor is the client's anonymous id.
"""
from __future__ import annotations

import json
import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, field_validator

from app import bot_bridge as bot
from app import mentor, mentor_store
from app.settings import settings

router = APIRouter(prefix="/api/mentor", tags=["mentor"])

# Event types the frontend may log directly (hint_request / explain_open are
# logged server-side by their own endpoints, not accepted here).
_ALLOWED_EVENTS = {
    "lesson_view", "lesson_read", "check_attempt", "check_recovered",
    "retry_after_hint", "mentor_open", "explain_not_helpful", "escalation_candidate",
}

EVENT_META_MAX_BYTES = 2048
# Telemetry calls per actor (user or anon id) per hour: generous for real use.
EVENT_LIMIT_PER_HOUR = 600
# Anonymous mentor help per client IP per hour. X-Anon-Id is client-chosen, so
# rotating it must not reset the limit; the ceiling allows a classroom behind one NAT.
ANON_IP_LIMIT_PER_HOUR = 300
_WINDOW_SECONDS = 3600
_MAX_TRACKED_KEYS = 10_000


class _SlidingWindow:
    """In-process request counter (one Railway instance). The mentor database
    schema stays unchanged, so per-IP and per-event limits live in memory."""

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str, limit: int) -> bool:
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > _WINDOW_SECONDS:
            hits.popleft()
        if len(hits) >= limit:
            return False
        hits.append(now)
        if len(self._hits) > _MAX_TRACKED_KEYS:
            self._prune(now)
        return True

    def _prune(self, now: float) -> None:
        for key in [k for k, v in self._hits.items() if not v or now - v[-1] > _WINDOW_SECONDS]:
            del self._hits[key]


_event_window = _SlidingWindow()
_anon_ip_window = _SlidingWindow()


async def actor(x_anon_id: str | None = Header(default=None)) -> str:
    """Stable identity for telemetry and rate limits: the client's anonymous id."""
    if x_anon_id:
        return f"anon:{x_anon_id[:64]}"
    return "anon:unknown"


def _client_ip(request: Request) -> str:
    # Behind Railway's proxy uvicorn runs with --proxy-headers, so this is the visitor.
    return request.client.host if request.client else "unknown"


async def _check_rate(who: str, request: Request) -> None:
    too_many = HTTPException(
        status_code=429,
        detail="Слишком много подсказок за час — сделай паузу и попробуй сам.",
    )
    if not _anon_ip_window.allow(_client_ip(request), ANON_IP_LIMIT_PER_HOUR):
        raise too_many
    used = await mentor_store.recent_count(
        who, ("hint_request", "explain_open"), seconds=3600
    )
    if used >= settings.mentor_rate_per_hour:
        raise too_many


def _title(course_id: str, lesson_id: int) -> str:
    lesson = bot.get_lesson(lesson_id, course_id)
    return lesson.title if lesson else ""


# ───────────────────────────── telemetry ──────────────────────────────────

class EventBody(BaseModel):
    type: str
    course_id: str | None = None
    lesson_id: int | None = None
    meta: dict | None = None

    @field_validator("meta")
    @classmethod
    def _meta_is_small(cls, value: dict | None) -> dict | None:
        if value is not None and len(json.dumps(value, ensure_ascii=False).encode()) > EVENT_META_MAX_BYTES:
            raise ValueError(f"meta больше {EVENT_META_MAX_BYTES} байт")
        return value


@router.post("/event")
async def log_event(body: EventBody, request: Request, who: str = Depends(actor)) -> dict:
    if body.type not in _ALLOWED_EVENTS:
        raise HTTPException(status_code=400, detail="Unknown event type.")
    if not _event_window.allow(f"{who}|{_client_ip(request)}", EVENT_LIMIT_PER_HOUR):
        raise HTTPException(status_code=429, detail="Too many events.")
    await mentor_store.log_event(
        who, body.type, body.course_id, body.lesson_id, meta=body.meta
    )
    return {"ok": True}


# ─────────────────────────── Socratic hints ───────────────────────────────

class HintBody(BaseModel):
    course_id: str
    lesson_id: int


@router.post("/hint")
async def hint(body: HintBody, request: Request, who: str = Depends(actor)) -> dict:
    await _check_rate(who, request)

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
async def explain(body: ExplainBody, request: Request, who: str = Depends(actor)) -> dict:
    await _check_rate(who, request)
    result = mentor.build_explanation(body.course_id, body.lesson_id, body.style)
    if result is None:
        raise HTTPException(status_code=404, detail="Урок не найден.")
    await mentor_store.log_event(
        who, "explain_open", body.course_id, body.lesson_id,
        meta={"style": body.style, "title": _title(body.course_id, body.lesson_id)},
    )
    result["ai_available"] = settings.mentor_ai_enabled
    return result
