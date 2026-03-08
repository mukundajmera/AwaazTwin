"""Health-check endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from backend.schemas import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live", response_model=HealthResponse)
async def liveness() -> HealthResponse:
    """Kubernetes-style liveness probe – always returns 200 if the process is up."""
    return HealthResponse(status="ok")


@router.get("/ready", response_model=HealthResponse)
async def readiness() -> HealthResponse:
    """Readiness probe – returns 200 when the service can accept traffic.

    TODO: Check DB connectivity, Redis reachability, and storage availability.
    """
    # TODO: Perform real dependency checks.
    return HealthResponse(status="ok")
