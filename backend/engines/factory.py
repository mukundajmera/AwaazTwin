"""
Engine factory.

Provides ``get_engine_adapter()`` which returns the correct
``EngineAdapter`` subclass for a given engine name and config.
"""

from __future__ import annotations

from backend.engines.base import EngineAdapter
from backend.engines.config import EngineConfig

# Registry of known engine types.
_ENGINE_REGISTRY: dict[str, type[EngineAdapter]] = {}


def _ensure_registry() -> None:
    """Lazily populate the registry so that adapters are imported only
    once and only when needed."""
    if _ENGINE_REGISTRY:
        return
    from backend.engines.xtts_hindi import XTTSHindiEngineAdapter
    from backend.engines.openvoice import OpenVoiceEngineAdapter

    _ENGINE_REGISTRY["xtts"] = XTTSHindiEngineAdapter
    _ENGINE_REGISTRY["openvoice"] = OpenVoiceEngineAdapter


def get_engine_adapter(config: EngineConfig) -> EngineAdapter:
    """Return an instantiated ``EngineAdapter`` for the given config.

    Parameters
    ----------
    config:
        An ``EngineConfig`` whose ``engine_type`` field selects the
        concrete adapter class.

    Raises
    ------
    ValueError
        If the ``engine_type`` is not recognised.
    """
    _ensure_registry()
    adapter_cls = _ENGINE_REGISTRY.get(config.engine_type)
    if adapter_cls is None:
        supported = ", ".join(sorted(_ENGINE_REGISTRY.keys()))
        raise ValueError(
            f"Unknown engine type {config.engine_type!r}. "
            f"Supported types: {supported}"
        )
    return adapter_cls(config)
