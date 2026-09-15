"""Web-API settings (independent of the bot's config).

Read from the environment (and backend/.env locally). The defaults are the
production ones: dev login off, Secure cookies, analytics closed, no CORS.
Local development sets DEV_AUTH=1 in backend/.env, which also allows plain-http
cookies, the Vite dev origins and the built-in session secret.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

DEFAULT_SESSION_SECRET = "dev-insecure-secret-change-me"
DEV_CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


def _bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _csv(raw: str) -> list[str]:
    return [item.strip() for item in raw.split(",") if item.strip()]


def _telegram_ids(raw: str) -> frozenset[int]:
    ids = set()
    for item in _csv(raw):
        if not item.isdigit():
            raise RuntimeError(f"ADMIN_TELEGRAM_IDS: «{item}» не похоже на Telegram ID (нужны числа через запятую).")
        ids.add(int(item))
    return frozenset(ids)


def _path(raw: str | None, default: Path) -> Path:
    if not raw or not raw.strip():
        return default
    path = Path(raw.strip()).expanduser()
    return path if path.is_absolute() else BACKEND_DIR / path


@dataclass(frozen=True)
class Settings:
    # Dev login (pick any user_id, no Telegram): local testing only.
    dev_auth_enabled: bool
    # Signed-cookie secret for sessions; required whenever dev login is off.
    session_secret: str
    session_max_age_days: int
    # Secure cookies need HTTPS: on by default, off only in dev mode.
    cookie_secure: bool
    # Telegram Login Widget verification needs the real bot token.
    telegram_bot_token: str
    telegram_bot_username: str
    telegram_auth_max_age: int
    # Browser origins allowed to call the API from another origin.
    cors_origins: list[str]
    # Mentor (validation MVP): AI stays off; rate limit per actor per hour.
    mentor_ai_enabled: bool
    mentor_rate_per_hour: int
    # Analytics is admin-only unless explicitly opened (local debugging).
    mentor_analytics_open: bool
    admin_telegram_ids: frozenset[int]
    mentor_db_path: Path
    # Canonical public address for meta tags and the sitemap (no trailing slash).
    site_url: str
    cookie_name: str = "pkh_session"

    @property
    def telegram_enabled(self) -> bool:
        return bool(self.telegram_bot_token)


def load_settings() -> Settings:
    dev = _bool("DEV_AUTH", False)
    return Settings(
        dev_auth_enabled=dev,
        session_secret=os.getenv("SESSION_SECRET", "").strip() or (DEFAULT_SESSION_SECRET if dev else ""),
        session_max_age_days=int(os.getenv("SESSION_MAX_AGE_DAYS", "30")),
        cookie_secure=_bool("COOKIE_SECURE", not dev),
        telegram_bot_token=os.getenv("TELEGRAM_BOT_TOKEN", "").strip(),
        telegram_bot_username=os.getenv("TELEGRAM_BOT_USERNAME", "python_academy_tj_bot").strip(),
        telegram_auth_max_age=int(os.getenv("TELEGRAM_AUTH_MAX_AGE", "86400")),
        cors_origins=_csv(os.getenv("CORS_ORIGINS", DEV_CORS_ORIGINS if dev else "")),
        mentor_ai_enabled=_bool("MENTOR_AI", False),
        mentor_rate_per_hour=int(os.getenv("MENTOR_RATE_PER_HOUR", "40")),
        mentor_analytics_open=_bool("MENTOR_ANALYTICS_OPEN", False),
        admin_telegram_ids=_telegram_ids(os.getenv("ADMIN_TELEGRAM_IDS", "")),
        mentor_db_path=_path(os.getenv("MENTOR_DB_PATH"), BACKEND_DIR / "data" / "mentor.db"),
        site_url=os.getenv("SITE_URL", "").strip().rstrip("/"),
    )


def startup_problems(s: Settings) -> list[str]:
    """Reasons the app must not start with these settings (empty when it is safe)."""
    problems = []
    if not s.dev_auth_enabled and s.session_secret in ("", DEFAULT_SESSION_SECRET):
        problems.append(
            "SESSION_SECRET не задан или равен значению для разработки. Задай длинную случайную "
            "строку в переменных окружения. DEV_AUTH=1 допустим только локально."
        )
    return problems


settings = load_settings()
