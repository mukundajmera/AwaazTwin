"""Engine adapter ABC and shared types for AwaazTwin TTS/voice-cloning backends."""

from __future__ import annotations

import abc
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class VoiceEmbeddingRef:
    """Pointer to a voice embedding produced by a specific engine.

    Attributes:
        engine_name: Name of the engine that created this embedding.
        embedding_path: Path to the stored embedding/checkpoint file.
        metadata: Arbitrary engine-specific metadata (sample rate, language, etc.).
    """

    engine_name: str
    embedding_path: Path
    metadata: dict[str, Any] = field(default_factory=dict)


class EngineAdapter(abc.ABC):
    """Abstract base for every TTS / voice-cloning engine.

    Concrete adapters wrap a specific model (XTTS, OpenVoice, …) and expose a
    uniform interface so the rest of the system never talks to model code
    directly.

    Subclasses must implement:
        * ``prepare_voice``  – extract a speaker embedding from audio samples.
        * ``synthesize``     – generate speech audio from text + embedding.

    Real model loading / GPU management will happen inside these methods.
    """

    @property
    @abc.abstractmethod
    def name(self) -> str:
        """Unique machine-readable engine identifier (e.g. ``xtts-hindi``)."""
        ...

    @abc.abstractmethod
    async def prepare_voice(
        self,
        samples: list[Path],
    ) -> VoiceEmbeddingRef:
        """Extract a speaker embedding from one or more audio samples.

        Args:
            samples: Paths to WAV/MP3 audio files of the target speaker.

        Returns:
            A ``VoiceEmbeddingRef`` that can later be passed to ``synthesize``.

        .. note::
            In the real implementation this is where the model will be loaded
            (lazily / on first call) and inference will run.  For now the
            placeholder returns a dummy reference.
        """
        ...

    @abc.abstractmethod
    async def synthesize(
        self,
        text: str,
        voice_ref: VoiceEmbeddingRef,
        params: dict[str, Any] | None = None,
    ) -> Path:
        """Generate speech audio for *text* using the given voice embedding.

        Args:
            text: The text to speak.
            voice_ref: A voice embedding previously created by ``prepare_voice``.
            params: Optional engine-specific synthesis parameters (speed, pitch …).

        Returns:
            Path to the generated WAV file.

        .. note::
            Real model inference code will be added here.  The placeholder
            writes a tiny valid WAV file so downstream code can exercise the
            full pipeline without a GPU.
        """
        ...
