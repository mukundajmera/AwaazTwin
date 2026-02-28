"""Tests for Pydantic schemas."""

import uuid
from datetime import datetime, timezone

import pytest

from backend.schemas import (
    AdminMetrics,
    AudioSampleResponse,
    EngineInfo,
    HealthResponse,
    QueueStats,
    SynthesisJobCreate,
    SynthesisJobResponse,
    VoiceProfileCreate,
    VoiceProfileResponse,
)


class TestVoiceProfileCreate:
    def test_minimal(self) -> None:
        body = VoiceProfileCreate(label="Test Voice")
        assert body.label == "Test Voice"
        assert body.language == "hi"
        assert body.engine_name == "xtts-hindi"

    def test_custom_fields(self) -> None:
        body = VoiceProfileCreate(label="My Voice", language="en", engine_name="openvoice")
        assert body.language == "en"
        assert body.engine_name == "openvoice"

    def test_empty_label_rejected(self) -> None:
        with pytest.raises(Exception):
            VoiceProfileCreate(label="")


class TestVoiceProfileResponse:
    def test_from_dict(self) -> None:
        now = datetime.now(timezone.utc)
        resp = VoiceProfileResponse(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            label="Test",
            language="hi",
            status="PENDING",
            created_at=now,
            updated_at=now,
        )
        assert resp.label == "Test"
        assert resp.status.value == "PENDING"


class TestSynthesisJobCreate:
    def test_minimal(self) -> None:
        body = SynthesisJobCreate(
            voice_profile_id=uuid.uuid4(),
            text="Hello world",
        )
        assert body.engine_name == "xtts-hindi"
        assert body.params is None

    def test_empty_text_rejected(self) -> None:
        with pytest.raises(Exception):
            SynthesisJobCreate(voice_profile_id=uuid.uuid4(), text="")


class TestSynthesisJobResponse:
    def test_from_dict(self) -> None:
        now = datetime.now(timezone.utc)
        resp = SynthesisJobResponse(
            id=uuid.uuid4(),
            voice_profile_id=uuid.uuid4(),
            engine_name="xtts-hindi",
            input_text="hello",
            status="PENDING",
            created_at=now,
            updated_at=now,
        )
        assert resp.status.value == "PENDING"
        assert resp.output_storage_key is None


class TestHealthResponse:
    def test_default(self) -> None:
        h = HealthResponse()
        assert h.status == "ok"


class TestAdminSchemas:
    def test_metrics_defaults(self) -> None:
        m = AdminMetrics()
        assert m.total_voices == 0
        assert m.pending_jobs == 0

    def test_engine_info(self) -> None:
        e = EngineInfo(name="xtts-hindi", enabled=True, device="cpu")
        assert e.name == "xtts-hindi"

    def test_queue_stats(self) -> None:
        q = QueueStats(name="synthesis")
        assert q.queued == 0
        assert q.failed == 0
