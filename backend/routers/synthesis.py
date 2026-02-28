"""Synthesis endpoints – submit jobs and check status."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.schemas import SynthesisJobCreate, SynthesisJobResponse

router = APIRouter(tags=["synthesis"])


@router.post(
    "/synthesize",
    response_model=SynthesisJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def submit_synthesis_job(
    body: SynthesisJobCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SynthesisJobResponse:
    """Submit a new text-to-speech synthesis job.

    The job is queued for async processing and the response contains a job ID
    that can be polled via ``GET /jobs/{job_id}``.

    TODO: Validate voice profile exists and is READY, persist job row,
          enqueue onto Redis/RQ synthesis queue.
    """
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    return SynthesisJobResponse(
        id=uuid.uuid4(),
        voice_profile_id=body.voice_profile_id,
        engine_name=body.engine_name,
        input_text=body.text,
        params_json=body.params,
        status="PENDING",
        created_at=now,
        updated_at=now,
    )


@router.get("/jobs/{job_id}", response_model=SynthesisJobResponse)
async def get_synthesis_job(
    job_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SynthesisJobResponse:
    """Poll the status of a synthesis job.

    TODO: Query DB by job_id, return 404 if not found.
    """
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
