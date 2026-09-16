"""Mentor state store — the site's only database.

Everything the mentor writes (events, hint rungs, rate-limit counts) lives here,
keyed by the reader's anonymous client id: the site has no accounts, so nothing
here identifies a person.
"""
from __future__ import annotations

import json
import time
from pathlib import Path

import aiosqlite

from app.settings import settings

# MENTOR_DB_PATH (absolute on Railway, e.g. /data/mentor.db); default backend/data/mentor.db.
DB_PATH: Path = settings.mentor_db_path

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


