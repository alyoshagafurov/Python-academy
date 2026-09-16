"""Shared test setup: a production-like, isolated environment for the web API.

Settings, the bot's config and the mentor store read the environment when they
are imported, so everything below runs before any ``app`` module is imported.
Databases and the served frontend live in a throwaway temp folder.

``ApiClient`` drives the ASGI app directly (no httpx): tests only need status,
headers and body, and the project adds no test dependencies.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = BACKEND_DIR.parent
TMP_DIR = Path(tempfile.mkdtemp(prefix="pkh-tests-"))
FRONTEND_DIR = TMP_DIR / "static"
(FRONTEND_DIR / "assets").mkdir(parents=True)
# The real index.html template, so meta injection and the CSP hash are tested on it.
(FRONTEND_DIR / "index.html").write_text(
    (REPO_DIR / "frontend" / "index.html").read_text(encoding="utf-8"), encoding="utf-8"
)

ADMIN_ID = 111_000_111
SITE_URL = "https://academy.example"
BOT_TOKEN = "123456:test-token-not-a-real-secret"

os.environ.update({
    "DEV_AUTH": "0",
    "SESSION_SECRET": "test-secret-not-the-default",
    "COOKIE_SECURE": "1",
    "DB_PATH": str(TMP_DIR / "data" / "academy.db"),
    "MENTOR_DB_PATH": str(TMP_DIR / "data" / "mentor.db"),
    "ADMIN_TELEGRAM_IDS": str(ADMIN_ID),
    "FRONTEND_DIR": str(FRONTEND_DIR),
    "SITE_URL": SITE_URL,
    "CORS_ORIGINS": SITE_URL,
    # Synthetic: the Telegram login flow is signed with it in tests, nowhere else.
    "TELEGRAM_BOT_TOKEN": BOT_TOKEN,
    "TELEGRAM_BOT_USERNAME": "python_academy_tj_bot",
})
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@dataclass
class ApiResponse:
    status: int
    headers: list[tuple[str, str]]
    body: bytes

    def header(self, name: str) -> str | None:
        name = name.lower()
        return next((v for k, v in self.headers if k == name), None)

    @property
    def text(self) -> str:
        return self.body.decode("utf-8")

    def json(self):
        return json.loads(self.body)


async def _call(app, method: str, path: str, headers: dict[str, str], body) -> ApiResponse:
    path, _, query = path.partition("?")
    payload = json.dumps(body).encode() if body is not None else b""
    raw_headers = [(k.lower().encode(), v.encode()) for k, v in headers.items()]
    raw_headers.append((b"host", SITE_URL.removeprefix("https://").encode()))
    if body is not None:
        raw_headers.append((b"content-type", b"application/json"))
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method,
        "scheme": "https",
        "path": path,
        "raw_path": path.encode(),
        "query_string": query.encode(),
        "root_path": "",
        "headers": raw_headers,
        "client": ("127.0.0.1", 50000),
        "server": ("academy.example", 443),
    }
    delivered = False

    async def receive():
        nonlocal delivered
        if not delivered:
            delivered = True
            return {"type": "http.request", "body": payload, "more_body": False}
        return {"type": "http.disconnect"}

    status = 0
    out_headers: list[tuple[str, str]] = []
    chunks: list[bytes] = []

    async def send(message):
        nonlocal status
        if message["type"] == "http.response.start":
            status = message["status"]
            out_headers.extend((k.decode().lower(), v.decode()) for k, v in message.get("headers", []))
        elif message["type"] == "http.response.body":
            chunks.append(message.get("body", b""))

    await app(scope, receive, send)
    return ApiResponse(status, out_headers, b"".join(chunks))


class ApiClient:
    def __init__(self, app):
        self.app = app

    def request(self, method: str, path: str, *, json_body=None, user_id: int | None = None,
                headers: dict[str, str] | None = None) -> ApiResponse:
        all_headers = dict(headers or {})
        if user_id is not None:
            from app.auth import _serializer
            from app.settings import settings

            all_headers["cookie"] = f"{settings.cookie_name}={_serializer.dumps({'uid': int(user_id)})}"
        return asyncio.run(_call(self.app, method, path, all_headers, json_body))

    def get(self, path: str, **kw) -> ApiResponse:
        return self.request("GET", path, **kw)

    def post(self, path: str, **kw) -> ApiResponse:
        return self.request("POST", path, **kw)


@pytest.fixture(scope="session")
def client() -> ApiClient:
    from app.main import app

    async def startup() -> None:
        async with app.router.lifespan_context(app):
            pass

    asyncio.run(startup())
    return ApiClient(app)


@pytest.fixture(scope="session")
def make_user(client):
    """Create a user in the test database and return its id."""
    from app import bot_bridge as bot

    def _make(user_id: int, username: str = "learner") -> int:
        async def create() -> None:
            if await bot.models.get_user(user_id) is None:
                await bot.models.create_user(user_id, username)

        asyncio.run(create())
        return user_id

    return _make
