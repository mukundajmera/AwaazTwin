"""Voice-profile management endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.schemas import AudioSampleResponse, VoiceProfileCreate, VoiceProfileResponse

router = APIRouter(prefix="/voices", tags=["voices"])


@router.post(
    "",
    response_model=VoiceProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_voice_profile(
    body: VoiceProfileCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> VoiceProfileResponse:
    """Create a new voice profile.

    TODO: Persist to DB, enqueue voice-prep job if samples are provided.
    """
    # TODO: Insert into DB and return real object.
    now = datetime.now(timezone.utc)
    return VoiceProfileResponse(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),  # TODO: derive from auth context
        label=body.label,
        language=body.language,
        status="PENDING",
        engine_name=body.engine_name,
        created_at=now,
        updated_at=now,
    )


@router.get("", response_model=list[VoiceProfileResponse])
async def list_voice_profiles(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[VoiceProfileResponse]:
    """List all voice profiles for the current user.

    TODO: Query DB with user-scoped filter + pagination.
    """
    # TODO: Real DB query.
    return []


@router.get("/{voice_id}", response_model=VoiceProfileResponse)
async def get_voice_profile(
    voice_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> VoiceProfileResponse:
    """Get a single voice profile by ID.

    TODO: Query DB, return 404 if not found.
    """
    # TODO: Real DB lookup.
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Voice profile not found")


@router.post(
    "/{voice_id}/samples",
    response_model=AudioSampleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_sample(
    voice_id: uuid.UUID,
    file: UploadFile,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AudioSampleResponse:
    """Upload an audio sample for a voice profile.

    TODO: Validate file type/size, upload to object storage, persist record,
          re-enqueue voice-prep if auto-processing is enabled.
    """
    if file.filename is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is required")

    # TODO: Save to storage and DB.
    now = datetime.now(timezone.utc)
    return AudioSampleResponse(
        id=uuid.uuid4(),
        voice_profile_id=voice_id,
        storage_key=f"samples/{voice_id}/{file.filename}",
        original_filename=file.filename,
        size_bytes=0,
        created_at=now,
    )
