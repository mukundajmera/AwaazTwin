"""Tests for the engine adapter abstraction layer."""

import asyncio
from pathlib import Path

import pytest

from backend.engines.base import EngineAdapter, VoiceEmbeddingRef
from backend.engines.factory import get_engine_adapter, list_engines
from backend.engines.xtts_hindi import XTTSHindiEngineAdapter
from backend.engines.openvoice import OpenVoiceEngineAdapter


class TestVoiceEmbeddingRef:
    def test_creation(self, tmp_path: Path) -> None:
        ref = VoiceEmbeddingRef(
            engine_name="test",
            embedding_path=tmp_path / "emb.pth",
            metadata={"lang": "hi"},
        )
        assert ref.engine_name == "test"
        assert ref.embedding_path == tmp_path / "emb.pth"
        assert ref.metadata == {"lang": "hi"}

    def test_default_metadata(self, tmp_path: Path) -> None:
        ref = VoiceEmbeddingRef(engine_name="test", embedding_path=tmp_path / "x.pth")
        assert ref.metadata == {}


class TestEngineFactory:
    def test_list_engines(self) -> None:
        engines = list_engines()
        assert "xtts-hindi" in engines
        assert "openvoice" in engines

    def test_get_xtts_hindi(self) -> None:
        adapter = get_engine_adapter("xtts-hindi")
        assert isinstance(adapter, XTTSHindiEngineAdapter)
        assert adapter.name == "xtts-hindi"

    def test_get_openvoice(self) -> None:
        adapter = get_engine_adapter("openvoice")
        assert isinstance(adapter, OpenVoiceEngineAdapter)
        assert adapter.name == "openvoice"

    def test_unknown_engine_raises(self) -> None:
        with pytest.raises(ValueError, match="Unknown engine"):
            get_engine_adapter("nonexistent")

    def test_factory_passes_config(self) -> None:
        adapter = get_engine_adapter("xtts-hindi", config={"device": "cpu"})
        assert adapter._config == {"device": "cpu"}


class TestXTTSHindiAdapter:
    @pytest.fixture
    def adapter(self) -> XTTSHindiEngineAdapter:
        return XTTSHindiEngineAdapter()

    def test_name(self, adapter: XTTSHindiEngineAdapter) -> None:
        assert adapter.name == "xtts-hindi"

    def test_is_engine_adapter(self, adapter: XTTSHindiEngineAdapter) -> None:
        assert isinstance(adapter, EngineAdapter)

    @pytest.mark.asyncio
    async def test_prepare_voice(self, adapter: XTTSHindiEngineAdapter) -> None:
        ref = await adapter.prepare_voice([Path("/dev/null")])
        assert isinstance(ref, VoiceEmbeddingRef)
        assert ref.engine_name == "xtts-hindi"
        assert ref.embedding_path.exists()
        assert ref.metadata["lang"] == "hi"
        ref.embedding_path.unlink(missing_ok=True)

    @pytest.mark.asyncio
    async def test_synthesize(self, adapter: XTTSHindiEngineAdapter) -> None:
        ref = await adapter.prepare_voice([Path("/dev/null")])
        output = await adapter.synthesize("test text", ref)
        assert output.exists()
        assert output.suffix == ".wav"
        # Verify it starts with RIFF WAV header
        data = output.read_bytes()
        assert data[:4] == b"RIFF"
        assert data[8:12] == b"WAVE"
        ref.embedding_path.unlink(missing_ok=True)
        output.unlink(missing_ok=True)


class TestOpenVoiceAdapter:
    @pytest.fixture
    def adapter(self) -> OpenVoiceEngineAdapter:
        return OpenVoiceEngineAdapter()

    def test_name(self, adapter: OpenVoiceEngineAdapter) -> None:
        assert adapter.name == "openvoice"

    def test_is_engine_adapter(self, adapter: OpenVoiceEngineAdapter) -> None:
        assert isinstance(adapter, EngineAdapter)

    @pytest.mark.asyncio
    async def test_prepare_voice(self, adapter: OpenVoiceEngineAdapter) -> None:
        ref = await adapter.prepare_voice([Path("/dev/null")])
        assert isinstance(ref, VoiceEmbeddingRef)
        assert ref.engine_name == "openvoice"
        assert ref.embedding_path.exists()
        ref.embedding_path.unlink(missing_ok=True)

    @pytest.mark.asyncio
    async def test_synthesize(self, adapter: OpenVoiceEngineAdapter) -> None:
        ref = await adapter.prepare_voice([Path("/dev/null")])
        output = await adapter.synthesize("hello", ref)
        assert output.exists()
        assert output.suffix == ".wav"
        data = output.read_bytes()
        assert data[:4] == b"RIFF"
        ref.embedding_path.unlink(missing_ok=True)
        output.unlink(missing_ok=True)
