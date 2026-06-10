"""Mentor analytics + state store — isolated SQLite, separate from the bot DB.

Everything the mentor experiment writes (events, rung state, rate-limit counts)
lives here, so the bot's academy.db stays untouched. Pure telemetry + lightweight
state for the zero-token rule-based mentor.
"""
from __future__ import annotations

import json
import time
from collections import Counter, defaultdict
from pathlib import Path

import aiosqlite

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "mentor.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ts        REAL    NOT NULL,           -- unix seconds
    actor     TEXT    NOT NULL,           -- "user:<id>" or "anon:<id>"
    course_id TEXT,
    lesson_id INTEGER,
    type      TEXT    NOT NULL,
    rung      INTEGER,
    meta      TEXT                         -- json
);
CREATE INDEX IF NOT EXISTS idx_ev_actor ON events(actor, ts);
CREATE INDEX IF NOT EXISTS idx_ev_type  ON events(type);
CREATE INDEX IF NOT EXISTS idx_ev_lesson ON events(course_id, lesson_id);
"""


async def init() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(_SCHEMA)
        await db.commit()


async def log_event(
    actor: str,
    type: str,
    course_id: str | None = None,
    lesson_id: int | None = None,
    rung: int | None = None,
    meta: dict | None = None,
) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO events (ts, actor, course_id, lesson_id, type, rung, meta) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (time.time(), actor, course_id, lesson_id, type, rung,
             json.dumps(meta, ensure_ascii=False) if meta else None),
        )
        await db.commit()


async def recent_count(actor: str, types: tuple[str, ...], seconds: int) -> int:
    """How many of the given event types this actor logged in the last N seconds."""
    since = time.time() - seconds
    qmarks = ",".join("?" for _ in types)
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            f"SELECT COUNT(*) FROM events WHERE actor=? AND ts>=? AND type IN ({qmarks})",
            (actor, since, *types),
        ) as cur:
            row = await cur.fetchone()
    return int(row[0]) if row else 0


async def item_hint_count(actor: str, course_id: str, lesson_id: int) -> int:
    """How many hints this actor already requested for this lesson's check."""
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT COUNT(*) FROM events WHERE actor=? AND course_id=? AND lesson_id=? "
            "AND type='hint_request'",
            (actor, course_id, lesson_id),
        ) as cur:
            row = await cur.fetchone()
    return int(row[0]) if row else 0


async def _all_events() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT ts, actor, course_id, lesson_id, type, rung, meta FROM events ORDER BY ts"
        ) as cur:
            rows = await cur.fetchall()
    return [dict(r) for r in rows]


async def analytics() -> dict:
    """Aggregate the validation metrics in Python (validation-scale data)."""
    ev = await _all_events()
    total = len(ev)

    def metas(e):
        try:
            return json.loads(e["meta"]) if e["meta"] else {}
        except Exception:
            return {}

    # distinct (actor, lesson) sets
    viewed = {(e["actor"], e["lesson_id"]) for e in ev if e["type"] == "lesson_view"}
    read = {(e["actor"], e["lesson_id"]) for e in ev if e["type"] == "lesson_read"}
    mentor_opened = {(e["actor"], e["lesson_id"]) for e in ev if e["type"] == "mentor_open"}
    explain_opened = {(e["actor"], e["lesson_id"]) for e in ev if e["type"] == "explain_open"}

    counts = Counter(e["type"] for e in ev)

    # CTR: of viewed lessons, share where the user engaged the mentor (hint or explain)
    engaged = mentor_opened | explain_opened
    ctr = round(len(engaged) / len(viewed) * 100, 1) if viewed else 0.0

    # Confusion points: lessons ranked by help demand + wrong attempts + "not helpful"
    confusion = Counter()
    titles: dict = {}
    for e in ev:
        lid = e["lesson_id"]
        if lid is None:
            continue
        key = (e["course_id"], lid)
        if e["type"] in ("mentor_open", "explain_not_helpful", "escalation_candidate"):
            confusion[key] += 2
        elif e["type"] == "check_attempt" and not metas(e).get("correct", True):
            confusion[key] += 1
        m = metas(e)
        if m.get("title"):
            titles[key] = m["title"]

    confusion_points = [
        {"course_id": k[0], "lesson_id": k[1], "title": titles.get(k, ""), "score": v}
        for k, v in confusion.most_common(10)
    ]

    # Hotspots: where help is clicked most (mentor_open + explain_open)
    help_clicks = Counter()
    for e in ev:
        if e["type"] in ("mentor_open", "explain_open") and e["lesson_id"] is not None:
            help_clicks[(e["course_id"], e["lesson_id"])] += 1
    hotspots = [
        {"course_id": k[0], "lesson_id": k[1], "title": titles.get(k, ""), "clicks": v}
        for k, v in help_clicks.most_common(10)
    ]

    # Retry / recovery: after a hint, did the user re-attempt and get it right?
    retries = counts.get("retry_after_hint", 0)
    recovered = counts.get("check_recovered", 0)
    hint_requests = counts.get("hint_request", 0)
    retry_rate = round(retries / hint_requests * 100, 1) if hint_requests else 0.0
    recovery_rate = round(recovered / hint_requests * 100, 1) if hint_requests else 0.0

    # Completion delta: read-rate among mentor users vs non-users
    mentor_actors = {a for (a, _l) in (mentor_opened | explain_opened)}
    view_actors = {a for (a, _l) in viewed}
    def read_rate(actors: set) -> float:
        v = {(a, l) for (a, l) in viewed if a in actors}
        r = {(a, l) for (a, l) in read if a in actors}
        return round(len(r) / len(v) * 100, 1) if v else 0.0
    completion = {
        "with_mentor": read_rate(mentor_actors),
        "without_mentor": read_rate(view_actors - mentor_actors),
    }

    # Drop-off: lessons that are an actor's LAST viewed lesson and never read
    last_view: dict = {}
    for e in ev:
        if e["type"] == "lesson_view" and e["lesson_id"] is not None:
            last_view[e["actor"]] = (e["course_id"], e["lesson_id"], e["ts"])
    dropoff = Counter()
    for actor, (cid, lid, _ts) in last_view.items():
        if (actor, lid) not in read:
            dropoff[(cid, lid)] += 1
    dropoff_points = [
        {"course_id": k[0], "lesson_id": k[1], "title": titles.get(k, ""), "count": v}
        for k, v in dropoff.most_common(10)
    ]

    return {
        "totals": {
            "events": total,
            "lessons_viewed": len(viewed),
            "lessons_read": len(read),
            "mentor_opens": counts.get("mentor_open", 0),
            "hint_requests": hint_requests,
            "explain_opens": counts.get("explain_open", 0),
            "escalation_candidates": counts.get("escalation_candidate", 0),
        },
        "mentor_ctr_percent": ctr,
        "retry_rate_percent": retry_rate,
        "recovery_rate_percent": recovery_rate,
        "completion_delta_percent": completion,
        "confusion_points": confusion_points,
        "help_hotspots": hotspots,
        "dropoff_points": dropoff_points,
    }
