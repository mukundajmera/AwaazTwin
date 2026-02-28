"""
XTTS Hindi–finetuned engine adapter (placeholder).

This adapter wraps the XTTS v2 Hindi-finetuned model.  The current
implementation is a **placeholder** that logs intended operations and
produces dummy WAV files so the rest of the pipeline can be tested
end-to-end without real model weights.

TODO: Replace dummy logic with real XTTS model loading and inference:
  1. Load the XTTS Hindi-finetuned checkpoint from ``config.model_path``.
  2. In ``prepare_voice``, extract speaker embeddings using the model's
     ``get_conditioning_latents()`` method and persist them.
  3. In ``synthesize``, run ``model.inference()`` with the embeddings
     and text to produce real audio output.
"""

from __future__ import annotations

import logging
import wave
from pathlib import Path
from typing import Any

from backend.engines.base import EngineAdapter, VoiceEmbeddingRef
from backend.engines.config import EngineConfig

logger = logging.getLogger(__name__)


class XTTSHindiEngineAdapter(EngineAdapter):
    """Placeholder adapter for the XTTS Hindi-finetuned model."""

    name = "XTTS_HI"

    def __init__(self, config: EngineConfig) -> None:
        self._config = config
        self._device = config.resolve_device()
        logger.info(
            "XTTSHindiEngineAdapter initialised (device=%s, model_path=%s)",
            self._device,
            config.model_path,
        )

    def prepare_voice(self, samples: list[Path]) -> VoiceEmbeddingRef:
        """Create a dummy voice embedding reference.

        TODO: load samples, run XTTS ``get_conditioning_latents()``,
        and persist the resulting embedding tensor.
        """
        logger.info(
            "[XTTS_HI] prepare_voice called with %d sample(s): %s",
            len(samples),
            [str(s) for s in samples],
        )

        # Create a minimal placeholder embedding file
        embedding_dir = Path(self._config.model_path) / "embeddings"
        embedding_dir.mkdir(parents=True, exist_ok=True)

        import hashlib

        sample_hash = hashlib.sha256(
            "|".join(str(s) for s in samples).encode()
        ).hexdigest()[:12]
        embedding_path = embedding_dir / f"voice_{sample_hash}.json"
        embedding_path.write_text(
            '{"type": "xtts_hi_placeholder", "samples": '
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
        logger.info("[XTTS_HI] Voice embedding created at %s", embedding_path)
        return ref

    def synthesize(
        self,
        text: str,
        voice_ref: VoiceEmbeddingRef,
        params: dict[str, Any] | None = None,
    ) -> Path:
        """Generate a dummy WAV file.

        TODO: load the voice embedding, run XTTS inference with the
        text, and write real audio data.
        """
        params = params or {}
        logger.info(
            "[XTTS_HI] synthesize called – text=%r, voice=%s, params=%s",
            text[:80],
            voice_ref.embedding_path,
            params,
        )

        output_dir = Path(self._config.model_path) / "outputs"
        output_dir.mkdir(parents=True, exist_ok=True)

        import hashlib

        text_hash = hashlib.sha256(text.encode()).hexdigest()[:12]
        output_path = output_dir / f"synth_{text_hash}.wav"

        # Write a valid but silent 1-second WAV file
        _write_silent_wav(output_path, duration_sec=1.0)

        logger.info("[XTTS_HI] Synthesised audio written to %s", output_path)
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
    silent_data = bytes(n_frames * channels * sample_width)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(silent_data)
