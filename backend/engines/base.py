"""
Abstract base class for TTS / voice-cloning engines.

Every concrete engine (XTTS Hindi, OpenVoice, …) implements this
interface.  Workers call ``prepare_voice`` and ``synthesize`` without
knowing which model is actually loaded.
"""

from __future__ import annotations

import json
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any


@dataclass
class VoiceEmbeddingRef:
    """Lightweight reference to an engine-specific voice embedding.

    Stores the engine name, a path to the stored embedding file (or
    directory), and an arbitrary metadata dict for engine-specific info
    (e.g. speaker ID, language tag, model version).
    """

    engine_name: str
    embedding_path: str
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_json(self) -> str:
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, raw: str) -> VoiceEmbeddingRef:
        data = json.loads(raw)
        return cls(**data)


class EngineAdapter(ABC):
    """Common interface every TTS / voice-cloning engine must implement.

    Attributes
    ----------
    name : str
        Human-readable engine identifier, e.g. ``"XTTS_HI"`` or
        ``"OPENVOICE_V2"``.  Must match the value used in
        ``EngineConfig.name``.
    """

    name: str

    @abstractmethod
    def prepare_voice(
        self,
        samples: list[Path],
    ) -> VoiceEmbeddingRef:
        """Process raw audio samples and produce a reusable voice reference.

        Parameters
        ----------
        samples:
            Paths to canonical 16-bit PCM WAV files (already converted
            from the user's original uploads by the voice-prep worker).

        Returns
        -------
        VoiceEmbeddingRef
            A reference that ``synthesize`` can use later.

        .. note::
            Real XTTS / OpenVoice model loading & embedding extraction
            will be plugged in here.  For now the concrete adapters
            create a placeholder embedding file.
        """
        ...

    @abstractmethod
    def synthesize(
        self,
        text: str,
        voice_ref: VoiceEmbeddingRef,
        params: dict[str, Any] | None = None,
    ) -> Path:
        """Generate an audio file from *text* using the given voice.

        Parameters
        ----------
        text:
            The text to speak.
        voice_ref:
            A ``VoiceEmbeddingRef`` previously returned by
            ``prepare_voice``.
        params:
            Optional engine-specific synthesis parameters (speed,
            language override, etc.).

        Returns
        -------
        pathlib.Path
            Path to the generated WAV file on local disk.

        .. note::
            Real model inference will be plugged in here.  For now the
            concrete adapters create a silent dummy WAV file.
        """
        ...
