"""AwaazTwin FastAPI application entrypoint."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_config
from backend.routers import admin, health, synthesis, voices

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup / shutdown lifecycle hook."""
    cfg = get_config()
    logger.info("AwaazTwin API starting – server=%s:%s", cfg.server.host, cfg.server.port)
    logger.info("Storage endpoint: %s", cfg.storage.endpoint)
    logger.info("Database URL: %s", cfg.database.url.split("@")[-1])  # hide creds
    logger.info("Engines configured: %s", [e.name for e in cfg.engines])
    yield


app = FastAPI(
    title="AwaazTwin API",
    description="Voice-cloning & TTS backend for AwaazTwin",
    version="0.1.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS – allow the Next.js portal to call the API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict to portal origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health.router)
app.include_router(voices.router)
app.include_router(synthesis.router)
app.include_router(admin.router)
