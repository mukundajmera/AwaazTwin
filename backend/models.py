"""SQLAlchemy 2.x domain models for AwaazTwin."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
)


# ---------------------------------------------------------------------------
# Base & helpers
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    """Shared declarative base for all models."""


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )


def _ts_created() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now())


def _ts_updated() -> Mapped[datetime]:
    return mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class VoiceProfileStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class SynthesisJobStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class Org(Base):
    __tablename__ = "orgs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = _ts_created()
    updated_at: Mapped[datetime] = _ts_updated()

    users: Mapped[list["User"]] = relationship(back_populates="org", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = _uuid_pk()
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orgs.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = _ts_created()
    updated_at: Mapped[datetime] = _ts_updated()

    org: Mapped["Org"] = relationship(back_populates="users")
    voice_profiles: Mapped[list["VoiceProfile"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class VoiceProfile(Base):
    __tablename__ = "voice_profiles"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="hi")
    status: Mapped[VoiceProfileStatus] = mapped_column(
        Enum(VoiceProfileStatus), default=VoiceProfileStatus.PENDING
    )
    engine_name: Mapped[str] = mapped_column(String(64), nullable=True)
    embedding_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = _ts_created()
    updated_at: Mapped[datetime] = _ts_updated()

    user: Mapped["User"] = relationship(back_populates="voice_profiles")
    audio_samples: Mapped[list["AudioSample"]] = relationship(
        back_populates="voice_profile", cascade="all, delete-orphan"
    )


class AudioSample(Base):
    __tablename__ = "audio_samples"

    id: Mapped[uuid.UUID] = _uuid_pk()
    voice_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("voice_profiles.id"), nullable=False
    )
    storage_key: Mapped[str] = mapped_column(Text, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    size_bytes: Mapped[int] = mapped_column(nullable=False)
    duration_seconds: Mapped[float | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = _ts_created()

    voice_profile: Mapped["VoiceProfile"] = relationship(back_populates="audio_samples")


class EngineConfig(Base):
    __tablename__ = "engine_configs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    engine_name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    enabled: Mapped[bool] = mapped_column(default=True)
    device: Mapped[str] = mapped_column(String(16), default="cpu")
    options_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = _ts_created()
    updated_at: Mapped[datetime] = _ts_updated()


class SynthesisJob(Base):
    __tablename__ = "synthesis_jobs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    voice_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("voice_profiles.id"), nullable=False
    )
    engine_name: Mapped[str] = mapped_column(String(64), nullable=False)
    input_text: Mapped[str] = mapped_column(Text, nullable=False)
    params_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[SynthesisJobStatus] = mapped_column(
        Enum(SynthesisJobStatus), default=SynthesisJobStatus.PENDING
    )
    output_storage_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = _ts_created()
    updated_at: Mapped[datetime] = _ts_updated()

    voice_profile: Mapped["VoiceProfile"] = relationship()
