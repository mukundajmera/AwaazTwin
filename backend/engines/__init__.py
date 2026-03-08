"""
AwaazTwin engine abstraction layer.

Provides a pluggable interface for TTS / voice-cloning engines
(XTTS Hindi-finetuned, OpenVoice, etc.) so that engines can be
added or removed without touching the API or UI layers.
"""

from backend.engines.base import EngineAdapter, VoiceEmbeddingRef
from backend.engines.config import EngineConfig
from backend.engines.factory import get_engine_adapter

__all__ = [
    "EngineAdapter",
    "VoiceEmbeddingRef",
    "EngineConfig",
    "get_engine_adapter",
]
