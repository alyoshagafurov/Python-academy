"""Security headers for every response, including the Content Security Policy.

Scripts come only from our own bundle and the inline theme script in index.html
(allowed by its sha256, read from the index.html that is actually served): the
site embeds nothing from anyone else. Styles allow 'unsafe-inline': Shiki and
React write colours into style attributes, which a hash cannot cover.
"""
from __future__ import annotations

import base64
import hashlib
import re

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

API_BODY_LIMIT = 64 * 1024  # bytes

_INLINE_SCRIPT_RE = re.compile(r"<script>(.*?)</script>", re.S)


def inline_script_hashes(index_html: str) -> list[str]:
    """CSP source expressions for every plain inline <script> in the page."""
    return [
        f"'sha256-{base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()}'"
        for body in _INLINE_SCRIPT_RE.findall(index_html)
    ]


def build_csp(script_hashes: list[str]) -> str:
    directives = {
        "default-src": "'self'",
        "script-src": " ".join(["'self'", *script_hashes]),
        "style-src": "'self' 'unsafe-inline'",
        "img-src": "'self' data:",
        "font-src": "'self'",
        "connect-src": "'self'",
        "frame-src": "'none'",
        "frame-ancestors": "'none'",
        "object-src": "'none'",
        "base-uri": "'self'",
        "form-action": "'self'",
    }
    return "; ".join(f"{name} {value}" for name, value in directives.items())


def security_headers(csp: str, hsts: bool) -> list[tuple[str, str]]:
    headers = [
        ("Content-Security-Policy", csp),
        ("X-Content-Type-Options", "nosniff"),
        ("Referrer-Policy", "strict-origin-when-cross-origin"),
        ("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()"),
        ("X-Frame-Options", "DENY"),
        # Nothing opens a popup any more (the login flow is gone), so the
        # strictest value fits: our browsing context stays entirely ours.
        ("Cross-Origin-Opener-Policy", "same-origin"),
        ("Cross-Origin-Resource-Policy", "same-origin"),
    ]
    if hsts:
        headers.append(("Strict-Transport-Security", "max-age=31536000; includeSubDomains"))
    return headers


class BodySizeLimitMiddleware:
    """Answers 413 when a request body under ``path_prefix`` exceeds ``max_bytes``.

    Counts the bytes actually received (a Content-Length header can be absent or
    wrong) and replays the buffered body to the app when it fits."""

    def __init__(self, app: ASGIApp, max_bytes: int, path_prefix: str) -> None:
        self.app = app
        self.max_bytes = max_bytes
        self.path_prefix = path_prefix

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or not scope["path"].startswith(self.path_prefix):
            await self.app(scope, receive, send)
            return

        declared = dict(scope.get("headers", [])).get(b"content-length")
        if declared is not None and declared.isdigit() and int(declared) > self.max_bytes:
            await self._too_large(send)
            return

        messages: list[Message] = []
        size = 0
        while True:
            message = await receive()
            messages.append(message)
            if message["type"] != "http.request":
                break
            size += len(message.get("body", b""))
            if size > self.max_bytes:
                await self._too_large(send)
                return
            if not message.get("more_body", False):
                break

        async def replay() -> Message:
            return messages.pop(0) if messages else await receive()

        await self.app(scope, replay, send)

    @staticmethod
    async def _too_large(send: Send) -> None:
        body = b'{"detail":"Request body too large."}'
        await send({
            "type": "http.response.start",
            "status": 413,
            "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())],
        })
        await send({"type": "http.response.body", "body": body})


class SecurityHeadersMiddleware:
    """Adds the headers to every HTTP response unless a route already set one."""

    def __init__(self, app: ASGIApp, headers: list[tuple[str, str]]) -> None:
        self.app = app
        self.headers = headers

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                response_headers = MutableHeaders(scope=message)
                for name, value in self.headers:
                    if name not in response_headers:
                        response_headers[name] = value
            await send(message)

        await self.app(scope, receive, send_with_headers)
