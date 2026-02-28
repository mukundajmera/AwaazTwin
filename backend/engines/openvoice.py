"""Placeholder OpenVoice engine adapter.

TODO: Replace stubs with real OpenVoice model loading and inference.
      - Load the OpenVoice checkpoint on first call.
      - Support tone-colour cloning from a short reference clip.
      - Handle multi-lingual synthesis.
"""

from __future__ import annotations

import logging
import struct
import tempfile
from pathlib import Path
from typing import Any

from backend.engines.base import EngineAdapter, VoiceEmbeddingRef

logger = logging.getLogger(__name__)

_WAV_HEADER = struct.pack(
    "<4sI4s4sIHHIIHH4sI",
    b"RIFF",
    36,
    b"WAVE",
    b"fmt ",
    16,
    1,  # PCM
    1,  # mono
    22050,
    44100,
    2,
    16,
    b"data",
    0,
)


class OpenVoiceEngineAdapter(EngineAdapter):
    """OpenVoice tone-colour cloning adapter.

    This is a **placeholder** – every method logs what it *would* do and returns
    a dummy artefact so the rest of the pipeline can be exercised end-to-end
    without a real model.
    """

    def __init__(self, config: dict[str, Any] | None = None) -> None:
        self._config = config or {}
        # TODO: Load OpenVoice model checkpoint here

    @property
    def name(self) -> str:
        return "openvoice"

    async def prepare_voice(self, samples: list[Path]) -> VoiceEmbeddingRef:
        logger.info(
            "[openvoice] prepare_voice called with %d sample(s): %s",
            len(samples),
            [s.name for s in samples],
        )
        # TODO: Extract tone-colour embedding from samples.
        fd, tmp = tempfile.mkstemp(suffix=".pth", prefix="ov_emb_")
        embedding_path = Path(tmp)
        embedding_path.write_bytes(b"\x00" * 64)
        __import__("os").close(fd)
        return VoiceEmbeddingRef(
            engine_name=self.name,
            embedding_path=embedding_path,
            metadata={"sample_count": len(samples)},
        )

    async def synthesize(
        self,
        text: str,
        voice_ref: VoiceEmbeddingRef,
        params: dict[str, Any] | None = None,
    ) -> Path:
        logger.info(
            "[openvoice] synthesize called: text=%r, voice=%s, params=%s",
            text[:80],
            voice_ref.embedding_path.name,
            params,
        )
        # TODO: Run OpenVoice inference, write real audio to output_path.
        fd, tmp = tempfile.mkstemp(suffix=".wav", prefix="ov_out_")
        output_path = Path(tmp)
        output_path.write_bytes(_WAV_HEADER)
        __import__("os").close(fd)
        return output_path
