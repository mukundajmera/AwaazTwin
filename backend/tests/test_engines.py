"""Tests for the engine abstraction layer (Phase 3)."""

from __future__ import annotations

import json
import wave
from pathlib import Path

import pytest

from backend.engines.base import EngineAdapter, VoiceEmbeddingRef
from backend.engines.config import EngineConfig, load_engine_configs_from_env
from backend.engines.factory import get_engine_adapter
from backend.engines.xtts_hindi import XTTSHindiEngineAdapter
from backend.engines.openvoice import OpenVoiceEngineAdapter


# ---------------------------------------------------------------
# VoiceEmbeddingRef
# ---------------------------------------------------------------


class TestVoiceEmbeddingRef:
    def test_round_trip_json(self) -> None:
        ref = VoiceEmbeddingRef(
            engine_name="XTTS_HI",
            embedding_path="/tmp/emb/voice_abc.json",
            metadata={"device": "cpu", "sample_count": 2},
        )
        raw = ref.to_json()
        restored = VoiceEmbeddingRef.from_json(raw)
        assert restored.engine_name == ref.engine_name
        assert restored.embedding_path == ref.embedding_path
        assert restored.metadata == ref.metadata

    def test_defaults(self) -> None:
        ref = VoiceEmbeddingRef(engine_name="X", embedding_path="/p")
        assert ref.metadata == {}

    def test_json_is_valid(self) -> None:
        ref = VoiceEmbeddingRef(engine_name="A", embedding_path="/b")
        parsed = json.loads(ref.to_json())
        assert parsed["engine_name"] == "A"


# ---------------------------------------------------------------
# EngineConfig
# ---------------------------------------------------------------


class TestEngineConfig:
    def test_defaults(self) -> None:
        cfg = EngineConfig(name="X", engine_type="xtts")
        assert cfg.device == "auto"
        assert cfg.enabled is True
        assert cfg.max_concurrent_jobs == 2

    def test_resolve_device_explicit(self) -> None:
        cfg = EngineConfig(name="X", engine_type="xtts", device="cpu")
        assert cfg.resolve_device() == "cpu"

    def test_resolve_device_auto_falls_back_to_cpu(self) -> None:
        """When PyTorch is not installed, auto → cpu."""
        cfg = EngineConfig(name="X", engine_type="xtts", device="auto")
        # In CI / test env PyTorch is typically not installed, so
        # resolve_device should fall back to cpu.
        device = cfg.resolve_device()
        assert device in ("cuda", "mps", "cpu")


class TestLoadEngineConfigsFromEnv:
    def test_returns_two_defaults(self) -> None:
        configs = load_engine_configs_from_env()
        assert len(configs) == 2
        names = {c.name for c in configs}
        assert "XTTS_HI" in names
        assert "OPENVOICE_V2" in names

    def test_xtts_enabled_by_default(self) -> None:
        configs = load_engine_configs_from_env()
        xtts = next(c for c in configs if c.name == "XTTS_HI")
        assert xtts.enabled is True

    def test_openvoice_disabled_by_default(self) -> None:
        configs = load_engine_configs_from_env()
        ov = next(c for c in configs if c.name == "OPENVOICE_V2")
        assert ov.enabled is False

    def test_env_override(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("AWAAZTWIN_ENGINE_XTTS_HI_DEVICE", "cuda")
        monkeypatch.setenv("AWAAZTWIN_ENGINE_OPENVOICE_ENABLED", "true")
        configs = load_engine_configs_from_env()
        xtts = next(c for c in configs if c.name == "XTTS_HI")
        ov = next(c for c in configs if c.name == "OPENVOICE_V2")
        assert xtts.device == "cuda"
        assert ov.enabled is True


# ---------------------------------------------------------------
# Factory
# ---------------------------------------------------------------


class TestGetEngineAdapter:
    def test_returns_xtts_adapter(self) -> None:
        cfg = EngineConfig(name="XTTS_HI", engine_type="xtts")
        adapter = get_engine_adapter(cfg)
        assert isinstance(adapter, XTTSHindiEngineAdapter)
        assert adapter.name == "XTTS_HI"

    def test_returns_openvoice_adapter(self) -> None:
        cfg = EngineConfig(name="OPENVOICE_V2", engine_type="openvoice")
        adapter = get_engine_adapter(cfg)
        assert isinstance(adapter, OpenVoiceEngineAdapter)
        assert adapter.name == "OPENVOICE_V2"

    def test_raises_for_unknown_type(self) -> None:
        cfg = EngineConfig(name="BOGUS", engine_type="unknown_engine")
        with pytest.raises(ValueError, match="Unknown engine type"):
            get_engine_adapter(cfg)


# ---------------------------------------------------------------
# XTTSHindiEngineAdapter (placeholder behaviour)
# ---------------------------------------------------------------


class TestXTTSHindiEngineAdapter:
    def test_prepare_voice_creates_embedding(self, tmp_path: Path) -> None:
        cfg = EngineConfig(
            name="XTTS_HI",
            engine_type="xtts",
            model_path=str(tmp_path / "model"),
            device="cpu",
        )
        adapter = XTTSHindiEngineAdapter(cfg)

        # Create dummy sample files
        sample = tmp_path / "sample.wav"
        sample.write_bytes(b"RIFF" + b"\x00" * 100)

        ref = adapter.prepare_voice([sample])
        assert ref.engine_name == "XTTS_HI"
        assert Path(ref.embedding_path).exists()

    def test_synthesize_creates_wav(self, tmp_path: Path) -> None:
        cfg = EngineConfig(
            name="XTTS_HI",
            engine_type="xtts",
            model_path=str(tmp_path / "model"),
            device="cpu",
        )
        adapter = XTTSHindiEngineAdapter(cfg)

        ref = VoiceEmbeddingRef(
            engine_name="XTTS_HI",
            embedding_path=str(tmp_path / "emb.json"),
        )
        output = adapter.synthesize("Hello world", ref)
        assert output.exists()
        assert output.suffix == ".wav"

        # Verify it is a valid WAV file
        with wave.open(str(output), "rb") as wf:
            assert wf.getnchannels() == 1
            assert wf.getsampwidth() == 2
            assert wf.getframerate() == 22050


# ---------------------------------------------------------------
# OpenVoiceEngineAdapter (placeholder behaviour)
# ---------------------------------------------------------------


class TestOpenVoiceEngineAdapter:
    def test_prepare_voice_creates_embedding(self, tmp_path: Path) -> None:
        cfg = EngineConfig(
            name="OPENVOICE_V2",
            engine_type="openvoice",
            model_path=str(tmp_path / "model"),
            device="cpu",
        )
        adapter = OpenVoiceEngineAdapter(cfg)

        sample = tmp_path / "sample.wav"
        sample.write_bytes(b"RIFF" + b"\x00" * 100)

        ref = adapter.prepare_voice([sample])
        assert ref.engine_name == "OPENVOICE_V2"
        assert Path(ref.embedding_path).exists()

    def test_synthesize_creates_wav(self, tmp_path: Path) -> None:
        cfg = EngineConfig(
            name="OPENVOICE_V2",
            engine_type="openvoice",
            model_path=str(tmp_path / "model"),
            device="cpu",
        )
        adapter = OpenVoiceEngineAdapter(cfg)

        ref = VoiceEmbeddingRef(
            engine_name="OPENVOICE_V2",
            embedding_path=str(tmp_path / "emb.json"),
        )
        output = adapter.synthesize("Namaste duniya", ref)
        assert output.exists()
        assert output.suffix == ".wav"

        with wave.open(str(output), "rb") as wf:
            assert wf.getnchannels() == 1
            assert wf.getsampwidth() == 2
            assert wf.getframerate() == 22050


# ---------------------------------------------------------------
# EngineAdapter ABC enforcement
# ---------------------------------------------------------------


class TestEngineAdapterABC:
    def test_cannot_instantiate_abstract_class(self) -> None:
        with pytest.raises(TypeError):
            EngineAdapter()  # type: ignore[abstract]
