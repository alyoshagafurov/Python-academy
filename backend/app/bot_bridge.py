"""Bridge to the course content that ships with the bot's codebase.

The web API does **not** duplicate any course content. It reuses the content
loader (``lessons``) and the two pure read services it needs (search, related).

Nothing here touches a database: the site has no accounts, so the bot's data
access layer (users, progress, bookmarks) is never imported and academy.db is
never opened. We also never run the bot — we only import its modules, so the
bot's project directory goes on ``sys.path`` before anything else.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# ── 1. Locate the content ───────────────────────────────────────────────────
# Resolution order:
#   1) BOT_DIR env var (explicit override),
#   2) the live sibling repo `../python-academy-bot` (local dev — no duplication),
#   3) the vendored snapshot `backend/_bot` (used on deploy, e.g. Railway).
#   backend/app/bot_bridge.py → parents: [app, backend, python-academy-web, ~]
_HERE = Path(__file__).resolve()
_VENDORED = _HERE.parents[1] / "_bot"  # backend/_bot (deploy snapshot)
# Live sibling repo for local dev — only if the path is deep enough (it isn't
# in a container like /app/app/bot_bridge.py, where parents[3] would IndexError).
_SIBLING = _HERE.parents[3] / "python-academy-bot" if len(_HERE.parents) > 3 else None


def _default_bot_dir() -> Path:
    if _SIBLING is not None and (_SIBLING / "lessons").is_dir():
        return _SIBLING
    return _VENDORED


BOT_DIR = Path(os.getenv("BOT_DIR", str(_default_bot_dir()))).resolve()

if not (BOT_DIR / "lessons").is_dir():
    raise RuntimeError(
        f"Не найден контент курсов в {BOT_DIR}. Укажи путь через переменную окружения "
        f"BOT_DIR, либо положи снапшот контента в backend/_bot (см. README)."
    )

# Some of those modules read the bot's config on import, which rejects an empty
# token. A syntactically valid placeholder keeps the import working; the API
# never talks to Telegram and never starts the bot.
os.environ.setdefault("BOT_TOKEN", "web-api-noop:token")

if str(BOT_DIR) not in sys.path:
    sys.path.insert(0, str(BOT_DIR))

# ── 2. Re-export what the API relies on ──────────────────────────────────────
# Content (pure, config-free)
from lessons import (  # noqa: E402
    Course,
    Lesson,
    Stage,
    all_courses,
    get_course,
    get_lesson,
)

# The only services the site still needs: both are pure reads over the content.
from services import related_service, search_service  # noqa: E402

__all__ = [
    "BOT_DIR",
    "Course",
    "Lesson",
    "Stage",
    "all_courses",
    "get_course",
    "get_lesson",
    "related_service",
    "search_service",
]
