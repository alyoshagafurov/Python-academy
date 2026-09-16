"""Web-API settings (independent of the bot's config).

Read from the environment (and backend/.env locally). The site has no accounts:
nothing here signs a cookie or talks to Telegram. Defaults are the production
ones; DEV_MODE=1 locally allows plain http and the Vite dev origins.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

DEV_CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


def _bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _csv(raw: str) -> list[str]:
    return [item.strip() for item in raw.split(",") if item.strip()]


def _path(raw: str | None, default: Path) -> Path:
    if not raw or not raw.strip():
        return default
    path = Path(raw.strip()).expanduser()
    return path if path.is_absolute() else BACKEND_DIR / path


@dataclass(frozen=True)
class Settings:
    # Local development: plain http and the Vite dev origins.
    dev_mode: bool
    # HTTPS-only headers (HSTS): on by default, off in dev.
    https_only: bool
    # Browser origins allowed to call the API from another origin.
    cors_origins: list[str]
    # Mentor (validation MVP): AI stays off; rate limit per actor per hour.
    mentor_ai_enabled: bool
    mentor_rate_per_hour: int
    mentor_db_path: Path
    # Canonical public address for meta tags and the sitemap (no trailing slash).
    site_url: str


def load_settings() -> Settings:
    dev = _bool("DEV_MODE", False)
    return Settings(
        dev_mode=dev,
        https_only=_bool("HTTPS_ONLY", not dev),
        cors_origins=_csv(os.getenv("CORS_ORIGINS", DEV_CORS_ORIGINS if dev else "")),
        mentor_ai_enabled=_bool("MENTOR_AI", False),
        mentor_rate_per_hour=int(os.getenv("MENTOR_RATE_PER_HOUR", "40")),
        mentor_db_path=_path(os.getenv("MENTOR_DB_PATH"), BACKEND_DIR / "data" / "mentor.db"),
        site_url=os.getenv("SITE_URL", "").strip().rstrip("/"),
    )


def startup_problems(s: Settings) -> list[str]:
    """Reasons the app must not start with these settings (empty when it is safe)."""
    problems = []
    if not s.dev_mode and not s.site_url.startswith(("https://", "http://")):
        problems.append(
            "SITE_URL не задан. Укажи публичный адрес сайта с https://, без слеша в конце: "
            "по нему строятся canonical, Open Graph и sitemap (не по заголовку Host)."
        )
    return problems


settings = load_settings()
