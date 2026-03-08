"""Engine adapter factory – central registry for all TTS/voice-cloning backends."""

from __future__ import annotations

from typing import Any

from backend.engines.base import EngineAdapter
from backend.engines.openvoice import OpenVoiceEngineAdapter
from backend.engines.xtts_hindi import XTTSHindiEngineAdapter

# ---------------------------------------------------------------------------
# Registry: maps engine name → adapter class
# ---------------------------------------------------------------------------
_REGISTRY: dict[str, type[EngineAdapter]] = {
    "xtts-hindi": XTTSHindiEngineAdapter,
    "openvoice": OpenVoiceEngineAdapter,
}


def get_engine_adapter(engine_name: str, config: dict[str, Any] | None = None) -> EngineAdapter:
    """Instantiate an engine adapter by name.

    Args:
        engine_name: Key in the registry (e.g. ``"xtts-hindi"``).
        config: Engine-specific configuration dict passed to the adapter constructor.

    Raises:
        ValueError: If *engine_name* is not registered.
    """
    adapter_cls = _REGISTRY.get(engine_name)
    if adapter_cls is None:
        available = ", ".join(sorted(_REGISTRY))
        raise ValueError(
            f"Unknown engine {engine_name!r}. Available engines: {available}"
        )
    return adapter_cls(config=config or {})


def list_engines() -> list[str]:
    """Return sorted list of registered engine names."""
    return sorted(_REGISTRY)
