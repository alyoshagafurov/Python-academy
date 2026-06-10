"""Web-API settings (independent of the bot's config).

Read from the backend's own environment / .env file. Nothing here is required
for local development — every value has a sensible default.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")


def _bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _csv(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    # Signed-cookie secret for sessions. Override in production!
    session_secret: str = field(
        default_factory=lambda: os.getenv("SESSION_SECRET", "dev-insecure-secret-change-me")
    )
    # Cookie lifetime (days).
    session_max_age_days: int = field(
        default_factory=lambda: int(os.getenv("SESSION_MAX_AGE_DAYS", "30"))
    )
    cookie_name: str = "pkh_session"
    # Secure cookies require HTTPS — off by default for local dev.
    cookie_secure: bool = field(default_factory=lambda: _bool("COOKIE_SECURE", False))

    # Telegram Login Widget verification needs the *real* bot token. Optional:
    # if unset, Telegram login is disabled and only dev-login works.
    telegram_bot_token: str = field(
        default_factory=lambda: os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    )
    telegram_bot_username: str = field(
        default_factory=lambda: os.getenv("TELEGRAM_BOT_USERNAME", "python_academy_tj_bot").strip()
    )
    # Reject Telegram auth payloads older than this (seconds).
    telegram_auth_max_age: int = field(
        default_factory=lambda: int(os.getenv("TELEGRAM_AUTH_MAX_AGE", "86400"))
    )

    # Dev login (pick any user_id, no Telegram) — for local progress-sync testing.
    dev_auth_enabled: bool = field(default_factory=lambda: _bool("DEV_AUTH", True))

    # Browser origins allowed to call the API (Vite dev server by default).
    cors_origins: list[str] = field(
        default_factory=lambda: _csv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        )
    )

    # ── Mentor (validation MVP) ──
    # AI escalation stays OFF until validated + an API key is added. While off,
    # the mentor is 100% rule-based and AI hand-offs are only *logged*.
    mentor_ai_enabled: bool = field(default_factory=lambda: _bool("MENTOR_AI", False))
    # Anti-spam: max mentor help calls (hints + explains) per actor per hour.
    mentor_rate_per_hour: int = field(
        default_factory=lambda: int(os.getenv("MENTOR_RATE_PER_HOUR", "40"))
    )
    # Open the analytics endpoint without auth (handy in dev; lock down in prod).
    mentor_analytics_open: bool = field(default_factory=lambda: _bool("MENTOR_ANALYTICS_OPEN", True))

    @property
    def telegram_enabled(self) -> bool:
        return bool(self.telegram_bot_token)


settings = Settings()
