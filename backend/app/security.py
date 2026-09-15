"""Security headers for every response, including the Content Security Policy.

Scripts come only from our own bundle, the inline theme script in index.html
(allowed by its sha256, read from the index.html that is actually served) and
the Telegram Login Widget. Styles allow 'unsafe-inline': Shiki and React write
colours into style attributes, which a hash cannot cover.
"""
from __future__ import annotations

import base64
import hashlib
import re

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

TELEGRAM_WIDGET_ORIGIN = "https://telegram.org"
TELEGRAM_OAUTH_ORIGIN = "https://oauth.telegram.org"

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
        "script-src": " ".join(["'self'", *script_hashes, TELEGRAM_WIDGET_ORIGIN]),
        "style-src": "'self' 'unsafe-inline'",
        "img-src": "'self' data:",
        "font-src": "'self'",
        "connect-src": "'self'",
        "frame-src": TELEGRAM_OAUTH_ORIGIN,
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
    ]
    if hsts:
        headers.append(("Strict-Transport-Security", "max-age=31536000; includeSubDomains"))
    return headers


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
