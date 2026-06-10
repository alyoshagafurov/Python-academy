"""Authentication: Telegram Login Widget + dev login + signed-cookie sessions.

The session is a signed cookie holding the Telegram ``user_id`` — the *same*
id the bot uses, so progress, bookmarks and streak sync between bot and site.

Two ways to obtain a session:
  • Telegram Login Widget  — verified via HMAC over the bot token (production).
  • Dev login              — pick any user_id, no Telegram (local testing only).
"""
from __future__ import annotations

import hashlib
import hmac
import time

from fastapi import Cookie, Depends, HTTPException, Response, status
from itsdangerous import BadSignature, URLSafeTimedSerializer

from app.settings import settings

_serializer = URLSafeTimedSerializer(settings.session_secret, salt="pkh-session")
_MAX_AGE = settings.session_max_age_days * 24 * 3600


# ───────────────────────────── session cookie ─────────────────────────────

def issue_session(response: Response, user_id: int) -> None:
    token = _serializer.dumps({"uid": int(user_id)})
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        max_age=_MAX_AGE,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


def clear_session(response: Response) -> None:
    response.delete_cookie(settings.cookie_name, path="/")


def _read_session(token: str | None) -> int | None:
    if not token:
        return None
    try:
        data = _serializer.loads(token, max_age=_MAX_AGE)
    except BadSignature:
        return None
    uid = data.get("uid")
    return int(uid) if uid is not None else None


# ───────────────────────────── dependencies ───────────────────────────────

async def optional_user(
    pkh_session: str | None = Cookie(default=None),
) -> int | None:
    """Current user_id from the session cookie, or None if anonymous."""
    return _read_session(pkh_session)


async def require_user(user_id: int | None = Depends(optional_user)) -> int:
    """Current user_id; 401 if not logged in."""
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется вход.",
        )
    return user_id


# ────────────────────── Telegram Login Widget verify ──────────────────────

def verify_telegram_auth(payload: dict) -> int:
    """Validate a Telegram Login Widget payload and return the user_id.

    Algorithm (per Telegram docs): build a data-check-string from all fields
    except ``hash``, sorted by key; the secret key is SHA256(bot_token); the
    expected hash is HMAC-SHA256(data_check_string, secret_key).
    """
    if not settings.telegram_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Вход через Telegram не настроен (нет TELEGRAM_BOT_TOKEN).",
        )

    received_hash = payload.get("hash")
    if not received_hash:
        raise HTTPException(status_code=400, detail="Нет поля hash.")

    pairs = sorted(
        f"{k}={v}" for k, v in payload.items() if k != "hash" and v is not None
    )
    data_check_string = "\n".join(pairs)

    secret_key = hashlib.sha256(settings.telegram_bot_token.encode()).digest()
    expected = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, received_hash):
        raise HTTPException(status_code=401, detail="Подпись Telegram не сошлась.")

    auth_date = int(payload.get("auth_date", 0))
    if settings.telegram_auth_max_age and (time.time() - auth_date) > settings.telegram_auth_max_age:
        raise HTTPException(status_code=401, detail="Данные Telegram устарели, войди заново.")

    return int(payload["id"])
