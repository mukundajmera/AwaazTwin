"""
OpenVoice v2 engine adapter (placeholder).

This adapter wraps OpenVoice's tone-color converter + base TTS model.
The current implementation is a **placeholder** that logs intended
operations and produces dummy WAV files.

TODO: Replace dummy logic with real OpenVoice loading and inference:
  1. Load the OpenVoice tone-color converter checkpoint and base-TTS
     model from ``config.model_path``.
  2. In ``prepare_voice``, extract tone-color embeddings from the
     reference audio samples and persist them.
  3. In ``synthesize``, run the base TTS model to generate speech, then
     apply the tone-color converter to match the target voice.
"""

from __future__ import annotations

import logging
import struct
import wave
from pathlib import Path
from typing import Any

from backend.engines.base import EngineAdapter, VoiceEmbeddingRef
from backend.engines.config import EngineConfig

logger = logging.getLogger(__name__)


class OpenVoiceEngineAdapter(EngineAdapter):
    """Placeholder adapter for the OpenVoice v2 model."""

    name = "OPENVOICE_V2"

    def __init__(self, config: EngineConfig) -> None:
        self._config = config
        self._device = config.resolve_device()
        logger.info(
            "OpenVoiceEngineAdapter initialised (device=%s, model_path=%s)",
            self._device,
            config.model_path,
        )

    def prepare_voice(self, samples: list[Path]) -> VoiceEmbeddingRef:
        """Create a dummy tone-color embedding reference.

        TODO: load samples, extract OpenVoice tone-color embedding via
        ``se_extractor.get_se()``, and persist the result.
        """
        logger.info(
            "[OPENVOICE_V2] prepare_voice called with %d sample(s): %s",
            len(samples),
            [str(s) for s in samples],
        )

        embedding_dir = Path(self._config.model_path) / "embeddings"
        embedding_dir.mkdir(parents=True, exist_ok=True)

        import hashlib

        sample_hash = hashlib.sha256(
            "|".join(str(s) for s in samples).encode()
        ).hexdigest()[:12]
        embedding_path = embedding_dir / f"tone_{sample_hash}.json"
        embedding_path.write_text(
            '{"type": "openvoice_v2_placeholder", "samples": '
            + str(len(samples))
            + "}"
        )

        ref = VoiceEmbeddingRef(
            engine_name=self.name,
            embedding_path=str(embedding_path),
            metadata={
                "device": self._device,
                "sample_count": len(samples),
                "model_path": self._config.model_path,
            },
        )
        logger.info(
            "[OPENVOICE_V2] Tone-color embedding created at %s", embedding_path
        )
        return ref

    def synthesize(
        self,
        text: str,
        voice_ref: VoiceEmbeddingRef,
        params: dict[str, Any] | None = None,
    ) -> Path:
        """Generate a dummy WAV file.

        TODO: run base TTS to generate speech, then apply the
        tone-color converter using the stored embedding to match the
        target voice timbre.
        """
        params = params or {}
        logger.info(
            "[OPENVOICE_V2] synthesize called – text=%r, voice=%s, params=%s",
            text[:80],
            voice_ref.embedding_path,
            params,
        )

        output_dir = Path(self._config.model_path) / "outputs"
        output_dir.mkdir(parents=True, exist_ok=True)

        import hashlib

        text_hash = hashlib.sha256(text.encode()).hexdigest()[:12]
        output_path = output_dir / f"synth_{text_hash}.wav"

        _write_silent_wav(output_path, duration_sec=1.0)

        logger.info("[OPENVOICE_V2] Synthesised audio written to %s", output_path)
        return output_path


def _write_silent_wav(
    path: Path,
    duration_sec: float = 1.0,
    sample_rate: int = 22050,
    channels: int = 1,
    sample_width: int = 2,
) -> None:
    """Write a valid silent WAV file."""
    n_frames = int(sample_rate * duration_sec)
    silent_data = struct.pack(
        f"<{n_frames * channels}h", *([0] * (n_frames * channels))
    )
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(silent_data)
