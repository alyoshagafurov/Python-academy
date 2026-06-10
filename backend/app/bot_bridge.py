"""Bridge to the existing Telegram-bot codebase.

The web API does **not** duplicate any course content or database logic. It
reuses the bot's own modules: the JSON content loader (``lessons``), the data
access layer (``database.models``) and the pure read/business services
(search, related, recommendations, progress, bookmarks, level math…).

We never run the bot itself — we only import its modules. To make those
imports work, the bot's project directory is put on ``sys.path`` *before*
anything else is imported here.

Importing the bot's ``config`` module would normally fail without a real
``BOT_TOKEN``; since the API never talks to Telegram, we set a harmless
placeholder first so the import succeeds. The token is only used by the bot's
own runtime, which we don't start.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# ── 1. Locate the bot project ───────────────────────────────────────────────
# Default: a sibling folder `python-academy-bot` next to `python-academy-web`.
#   backend/app/bot_bridge.py → parents: [app, backend, python-academy-web, ~]
_DEFAULT_BOT_DIR = Path(__file__).resolve().parents[3] / "python-academy-bot"
BOT_DIR = Path(os.getenv("BOT_DIR", str(_DEFAULT_BOT_DIR))).resolve()

if not (BOT_DIR / "lessons").is_dir():
    raise RuntimeError(
        f"Не найден код бота в {BOT_DIR}. Укажи путь к папке бота через "
        f"переменную окружения BOT_DIR (см. backend/.env.example)."
    )

# ── 2. Satisfy the bot's config import (no real token needed) ────────────────
# load_config() rejects empty/placeholder tokens, so use a syntactically valid
# dummy. load_dotenv(override=False) inside the bot won't overwrite this.
os.environ.setdefault("BOT_TOKEN", "web-api-noop:token")

if str(BOT_DIR) not in sys.path:
    sys.path.insert(0, str(BOT_DIR))

# ── 3. Re-export the bot modules the API relies on ───────────────────────────
# Content (pure, config-free)
from lessons import (  # noqa: E402
    Course,
    Lesson,
    Stage,
    all_courses,
    get_course,
    get_lesson,
)

# Data access + business services (read & safe writes against the shared DB)
from config import config as bot_config  # noqa: E402
from database import models  # noqa: E402
from database.db import init_db  # noqa: E402
from services import (  # noqa: E402
    bookmark_service,
    course_service,
    lesson_service,
    level_service,
    progress_service,
    recommend_service,
    related_service,
    search_service,
)

#: Absolute path to the shared SQLite database (the bot's academy.db).
DB_PATH: Path = bot_config.db_path

__all__ = [
    "BOT_DIR",
    "DB_PATH",
    "Course",
    "Lesson",
    "Stage",
    "all_courses",
    "get_course",
    "get_lesson",
    "models",
    "init_db",
    "bookmark_service",
    "course_service",
    "lesson_service",
    "level_service",
    "progress_service",
    "recommend_service",
    "related_service",
    "search_service",
]
