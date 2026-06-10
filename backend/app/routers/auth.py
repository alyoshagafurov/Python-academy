"""Auth endpoints: config, session, Telegram login, dev login, logout."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel

from app import bot_bridge as bot
from app.auth import (
    clear_session,
    issue_session,
    optional_user,
    require_user,
    verify_telegram_auth,
)
from app.settings import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


async def _user_public(user_id: int) -> dict | None:
    user = await bot.models.get_user(user_id)
    if user is None:
        return None
    return {
        "id": user.user_id,
        "username": user.username,
        "xp": user.xp,
        "is_pro": bool(user.is_pro),
    }


@router.get("/config")
async def auth_config() -> dict:
    """Tells the frontend which login methods to render."""
    return {
        "telegram_enabled": settings.telegram_enabled,
        "telegram_bot_username": settings.telegram_bot_username,
        "dev_auth_enabled": settings.dev_auth_enabled,
    }


@router.get("/session")
async def session(user_id: int | None = Depends(optional_user)) -> dict:
    """Resolve the current session into a user (or null) — called on app load."""
    if user_id is None:
        return {"user": None}
    return {"user": await _user_public(user_id)}


class TelegramPayload(BaseModel):
    id: int
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    photo_url: str | None = None
    auth_date: int
    hash: str


@router.post("/telegram")
async def telegram_login(payload: TelegramPayload, response: Response) -> dict:
    user_id = verify_telegram_auth(payload.model_dump(exclude_none=True))
    # Create the user in the shared DB if they've never used the bot (safe upsert).
    if await bot.models.get_user(user_id) is None:
        await bot.models.create_user(user_id, payload.username)
    elif payload.username:
        await bot.models.update_username(user_id, payload.username)
    issue_session(response, user_id)
    return {"user": await _user_public(user_id)}


class DevLoginBody(BaseModel):
    user_id: int
    username: str | None = None


@router.post("/dev")
async def dev_login(body: DevLoginBody, response: Response) -> dict:
    """Local-only login: become any user_id without Telegram (for testing sync)."""
    if not settings.dev_auth_enabled:
        raise HTTPException(status_code=403, detail="Dev-вход выключен.")
    if await bot.models.get_user(body.user_id) is None:
        await bot.models.create_user(body.user_id, body.username or f"dev_{body.user_id}")
    issue_session(response, body.user_id)
    return {"user": await _user_public(body.user_id)}


@router.get("/dev/users")
async def dev_users() -> dict:
    """Existing users for the dev-login dropdown (only when dev auth is on)."""
    if not settings.dev_auth_enabled:
        raise HTTPException(status_code=403, detail="Dev-вход выключен.")
    async with bot.models.connection() as db:  # type: ignore[attr-defined]
        import aiosqlite

        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT user_id, username, xp FROM users ORDER BY xp DESC LIMIT 25"
        ) as cur:
            rows = await cur.fetchall()
    return {
        "users": [
            {"user_id": r["user_id"], "username": r["username"], "xp": r["xp"]}
            for r in rows
        ]
    }


@router.post("/logout")
async def logout(response: Response, _: int = Depends(require_user)) -> dict:
    clear_session(response)
    return {"ok": True}
