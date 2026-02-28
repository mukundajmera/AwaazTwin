"""Tests for the worker tasks (Phase 4).

These tests exercise the voice-prep and synthesis worker logic
*without* requiring a running Redis / Celery broker.  We call the
underlying task functions directly and mock external dependencies.
"""

from __future__ import annotations

import json
import os
import wave
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

from backend.engines.base import VoiceEmbeddingRef
from backend.engines.config import EngineConfig


@pytest.fixture(autouse=True)
def _use_tmp_model_path(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Point engine model paths to a writable temp directory."""
    model_dir = tmp_path / "models" / "xtts-hindi"
    model_dir.mkdir(parents=True)
    monkeypatch.setenv("AWAAZTWIN_ENGINE_XTTS_HI_PATH", str(model_dir))
    monkeypatch.setenv("AWAAZTWIN_ENGINE_OPENVOICE_PATH", str(tmp_path / "models" / "openvoice"))


# ---------------------------------------------------------------
# voice_prep_worker
# ---------------------------------------------------------------


class TestVoicePrepWorker:
    """Tests for ``prepare_voice_profile`` task logic."""

    def test_prepare_with_local_sample(self, tmp_path: Path) -> None:
        """Given a local sample file, the worker should produce a
        READY result with an embedding reference."""
        # Create a dummy WAV sample
        sample = tmp_path / "sample.wav"
        _write_test_wav(sample)

        from backend.workers.voice_prep_worker import prepare_voice_profile

        # Call the underlying function (not through Celery broker)
        result = prepare_voice_profile.apply(
            args=["voice-001", [str(sample)]],
        ).get()

        assert result["voice_profile_id"] == "voice-001"
        assert result["status"] == "READY"
        # Embedding should be valid JSON
        emb = VoiceEmbeddingRef.from_json(result["embedding"])
        assert emb.engine_name == "XTTS_HI"

    def test_prepare_multiple_samples(self, tmp_path: Path) -> None:
        """Processing multiple samples should succeed."""
        samples = []
        for i in range(3):
            s = tmp_path / f"sample_{i}.wav"
            _write_test_wav(s)
            samples.append(str(s))

        from backend.workers.voice_prep_worker import prepare_voice_profile

        result = prepare_voice_profile.apply(
            args=["voice-002", samples],
        ).get()

        assert result["status"] == "READY"
        emb = VoiceEmbeddingRef.from_json(result["embedding"])
        assert emb.metadata["sample_count"] == 3


# ---------------------------------------------------------------
# synthesis_worker
# ---------------------------------------------------------------


class TestSynthesisWorker:
    """Tests for ``run_synthesis`` task logic."""

    def test_synthesis_produces_output(self, tmp_path: Path) -> None:
        """Given a valid voice embedding, synthesis should return a
        completed result with an output URI."""
        ref = VoiceEmbeddingRef(
            engine_name="XTTS_HI",
            embedding_path=str(tmp_path / "emb.json"),
            metadata={"device": "cpu"},
        )

        from backend.workers.synthesis_worker import run_synthesis

        result = run_synthesis.apply(
            args=["job-001", "Hello AwaazTwin", ref.to_json()],
        ).get()

        assert result["job_id"] == "job-001"
        assert result["status"] == "completed"
        assert result["duration_sec"] >= 0
        assert result["output_uri"]

    def test_synthesis_with_engine_name(self, tmp_path: Path) -> None:
        """Engine name can be passed explicitly."""
        ref = VoiceEmbeddingRef(
            engine_name="XTTS_HI",
            embedding_path=str(tmp_path / "emb.json"),
        )

        from backend.workers.synthesis_worker import run_synthesis

        result = run_synthesis.apply(
            args=["job-002", "Namaste", ref.to_json(), "XTTS_HI"],
        ).get()

        assert result["status"] == "completed"

    def test_synthesis_with_params(self, tmp_path: Path) -> None:
        """Extra synthesis params should be forwarded."""
        ref = VoiceEmbeddingRef(
            engine_name="XTTS_HI",
            embedding_path=str(tmp_path / "emb.json"),
        )

        from backend.workers.synthesis_worker import run_synthesis

        result = run_synthesis.apply(
            args=["job-003", "Test", ref.to_json(), "XTTS_HI"],
            kwargs={"params": {"speed": 1.2}},
        ).get()

        assert result["status"] == "completed"


# ---------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------


def _write_test_wav(path: Path) -> None:
    """Write a minimal valid WAV file for testing."""
    import struct

    sample_rate = 22050
    n_frames = sample_rate  # 1 second
    data = struct.pack(f"<{n_frames}h", *([0] * n_frames))
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(data)
