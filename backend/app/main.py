"""Python Knowledge Hub — FastAPI application.

A thin read/write API over the Telegram bot's existing SQLite database and JSON
course content. It never starts the bot; it only imports the bot's modules
(see app.bot_bridge) and exposes them over HTTP for the web frontend.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app import bot_bridge as bot
from app import mentor_store
from app.routers import auth, courses, lessons, me, mentor, meta, search
from app.settings import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pkh.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure the shared schema exists (idempotent, additive — never recreates).
    await bot.init_db()
    await mentor_store.init()  # isolated mentor telemetry DB (not the bot's)
    logger.info("Подключено к БД бота: %s", bot.DB_PATH)
    logger.info("Курсов загружено: %d", len(bot.all_courses()))
    yield


app = FastAPI(
    title="Python Knowledge Hub API",
    version="1.0.0",
    description="Веб-API поверх БД и контента Telegram-бота Python Knowledge Hub.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meta.router)
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(lessons.router)
app.include_router(search.router)
app.include_router(me.router)
app.include_router(me.toggle_router)
app.include_router(mentor.router)


@app.get("/api/health", tags=["meta"])
async def health() -> dict:
    return {"status": "ok", "courses": len(bot.all_courses())}


# ── Serve the built frontend (single-service deploy) ───────────────────────
# When FRONTEND_DIR points at a built Vite bundle, FastAPI serves the SPA from
# the same origin as the API — so /api and the app share one Railway service.
_FRONTEND = os.getenv("FRONTEND_DIR")
if _FRONTEND and Path(_FRONTEND).is_dir():
    _root = Path(_FRONTEND)
    if (_root / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=_root / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str):
        if full_path.startswith("api"):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        candidate = _root / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_root / "index.html")  # SPA fallback for client routes
