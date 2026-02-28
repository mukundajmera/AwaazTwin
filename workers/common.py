"""Shared utilities for RQ workers."""

from __future__ import annotations

import logging
import os

from redis import Redis

from backend.config import get_config


def get_redis_connection() -> Redis:  # type: ignore[type-arg]
    """Return a Redis connection using the app config."""
    cfg = get_config()
    return Redis.from_url(cfg.redis.url)


def configure_logging() -> None:
    """Set up structured logging for worker processes."""
    level = os.environ.get("AWAAZTWIN_LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
