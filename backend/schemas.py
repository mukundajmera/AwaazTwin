"""Pydantic v2 request / response DTOs for the AwaazTwin API."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from backend.models import SynthesisJobStatus, VoiceProfileStatus


# ---------------------------------------------------------------------------
# Voices
# ---------------------------------------------------------------------------

class VoiceProfileCreate(BaseModel):
    """Request body for ``POST /voices``."""

    label: str = Field(..., min_length=1, max_length=255)
    language: str = Field(default="hi", max_length=10)
    engine_name: str = Field(default="xtts-hindi", max_length=64)


class VoiceProfileResponse(BaseModel):
    """Serialised voice profile returned by the API."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    label: str
    language: str
    status: VoiceProfileStatus
    engine_name: str | None = None
    embedding_path: str | None = None
    metadata_json: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime


class AudioSampleResponse(BaseModel):
    """Serialised audio sample."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    voice_profile_id: uuid.UUID
    storage_key: str
    original_filename: str
    size_bytes: int
    duration_seconds: float | None = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Synthesis
# ---------------------------------------------------------------------------

class SynthesisJobCreate(BaseModel):
    """Request body for ``POST /synthesize``."""

    voice_profile_id: uuid.UUID
    engine_name: str = Field(default="xtts-hindi", max_length=64)
    text: str = Field(..., min_length=1, max_length=5000)
    params: dict[str, Any] | None = None


class SynthesisJobResponse(BaseModel):
    """Serialised synthesis job."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    voice_profile_id: uuid.UUID
    engine_name: str
    input_text: str
    params_json: dict[str, Any] | None = None
    status: SynthesisJobStatus
    output_storage_key: str | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Health / Admin
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str = "ok"


class EngineInfo(BaseModel):
    name: str
    enabled: bool
    device: str


class AdminMetrics(BaseModel):
    total_voices: int = 0
    total_jobs: int = 0
    pending_jobs: int = 0
    processing_jobs: int = 0


class QueueStats(BaseModel):
    name: str
    queued: int = 0
    started: int = 0
    finished: int = 0
    failed: int = 0
