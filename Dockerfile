# syntax=docker/dockerfile:1
# ─── Stage 1: build the React (Vite) frontend ───
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build      # → /web/dist

# ─── Stage 2: FastAPI backend serving the API + the built frontend ───
FROM python:3.12-slim AS api
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install -r requirements.txt

# Backend code + vendored bot snapshot (content/loader/services — no secrets, no DB)
COPY backend/ ./

# Built frontend → served by FastAPI from FRONTEND_DIR (single-origin deploy)
COPY --from=web /web/dist ./static
ENV FRONTEND_DIR=/app/static

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
