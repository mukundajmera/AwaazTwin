"""Admin / observability endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from backend.engines.factory import list_engines
from backend.schemas import AdminMetrics, EngineInfo, QueueStats

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/metrics", response_model=AdminMetrics)
async def metrics() -> AdminMetrics:
    """Return high-level platform metrics.

    TODO: Query real counts from the database.
    """
    return AdminMetrics()


@router.get("/queues", response_model=list[QueueStats])
async def queue_stats() -> list[QueueStats]:
    """Return stats for each RQ worker queue.

    TODO: Connect to Redis and read real queue lengths.
    """
    return [
        QueueStats(name="voice-prep"),
        QueueStats(name="synthesis"),
    ]


@router.get("/engines", response_model=list[EngineInfo])
async def engines() -> list[EngineInfo]:
    """List registered TTS engine adapters and their status.

    TODO: Merge with DB-stored EngineConfig for enabled/device overrides.
    """
    return [
        EngineInfo(name=name, enabled=True, device="cpu")
        for name in list_engines()
    ]
