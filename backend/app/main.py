"""Python Academy — FastAPI application.

A read-only API over the course content that ships with the repository (see
app.bot_bridge). The site has no accounts: nothing is stored per reader, and the
only database it writes is the mentor's own telemetry. In production it also
serves the built SPA with per-page meta tags.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.gzip import GZipMiddleware

from app.settings import settings, startup_problems

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pkh.api")

# Refuse to start with unsafe settings before anything else is imported.
_problems = startup_problems(settings)
if _problems:
    for problem in _problems:
        logger.critical("Запуск остановлен: %s", problem)
    raise SystemExit(1)

from app import bot_bridge as bot  # noqa: E402
from app import mentor_store, security, seo  # noqa: E402
from app.routers import courses, lessons, mentor, meta, search  # noqa: E402

_FRONTEND_ENV = os.getenv("FRONTEND_DIR", "").strip()
_FRONTEND = Path(_FRONTEND_ENV).resolve() if _FRONTEND_ENV else None
_SERVE_SPA = _FRONTEND is not None and (_FRONTEND / "index.html").is_file()
# Without a build (local dev) the source template still gives the CSP its hash.
_SOURCE_INDEX = Path(__file__).resolve().parents[2] / "frontend" / "index.html"
_INDEX_FILE = _FRONTEND / "index.html" if _SERVE_SPA else _SOURCE_INDEX
_INDEX_TEMPLATE = _INDEX_FILE.read_text(encoding="utf-8") if _INDEX_FILE.is_file() else ""
if _SERVE_SPA:
    # First paint must not wait for a separate stylesheet request.
    _INDEX_TEMPLATE = seo.inline_local_stylesheets(_INDEX_TEMPLATE, _FRONTEND)
_CSP = security.build_csp(security.inline_script_hashes(_INDEX_TEMPLATE))


@asynccontextmanager
async def lifespan(app: FastAPI):
    await mentor_store.init()  # the site's only database: mentor telemetry
    logger.info("БД наставника: %s", settings.mentor_db_path)
    logger.info("Курсов загружено: %d", len(bot.all_courses()))
    yield


app = FastAPI(
    title="Python Academy API",
    version="1.0.0",
    description="Веб-API поверх контента курсов Python Academy. Без аккаунтов.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Anon-Id"],
)
# JS bundles, lesson JSON and HTML compress several times over on slow mobile links.
app.add_middleware(GZipMiddleware, minimum_size=1024)
# API requests are small JSON; anything bigger is refused before it reaches a route.
app.add_middleware(security.BodySizeLimitMiddleware, max_bytes=security.API_BODY_LIMIT, path_prefix="/api/")
# Added last, so it wraps everything and every response carries the headers.
app.add_middleware(
    security.SecurityHeadersMiddleware,
    headers=security.security_headers(_CSP, hsts=settings.https_only),
)

app.include_router(meta.router)
app.include_router(courses.router)
app.include_router(lessons.router)
app.include_router(search.router)
app.include_router(mentor.router)


@app.get("/api/health", tags=["meta"])
async def health() -> dict:
    return {"status": "ok", "courses": len(bot.all_courses())}


def _site_url(request: Request) -> str:
    # Outside dev SITE_URL is required at startup, so public URLs never come from
    # the client-controlled Host header; the request is only a local-dev fallback.
    if settings.site_url or not settings.dev_mode:
        return settings.site_url
    return str(request.base_url).rstrip("/")


@app.get("/robots.txt", include_in_schema=False)
async def robots(request: Request) -> PlainTextResponse:
    return PlainTextResponse(seo.robots_txt(_site_url(request)))


@app.get("/sitemap.xml", include_in_schema=False)
async def sitemap(request: Request) -> Response:
    return Response(seo.sitemap_xml(_site_url(request)), media_type="application/xml")


# ── Serve the built frontend (single-service deploy) ───────────────────────
# When FRONTEND_DIR points at a built Vite bundle, FastAPI serves the SPA from
# the same origin as the API — so /api and the app share one Railway service.
class _ImmutableAssets(StaticFiles):
    """Vite names built assets by content hash, so a year-long cache is safe."""

    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        if response.status_code == 200:
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response


if _SERVE_SPA:
    if (_FRONTEND / "assets").is_dir():
        app.mount("/assets", _ImmutableAssets(directory=_FRONTEND / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str, request: Request):
        if full_path == "api" or full_path.startswith("api/"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        if full_path:
            candidate = (_FRONTEND / full_path).resolve()
            inside = candidate.is_relative_to(_FRONTEND)
            if inside and candidate.is_file() and candidate.name != "index.html":
                return FileResponse(candidate)
        site = _site_url(request)
        page = seo.meta_for_path(f"/{full_path}", site)
        return HTMLResponse(
            seo.render_index(_INDEX_TEMPLATE, page, site),
            status_code=page.status,
            headers={"Cache-Control": "no-cache"},
        )
