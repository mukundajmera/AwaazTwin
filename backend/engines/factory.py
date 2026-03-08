"""
Engine factory.

Provides ``get_engine_adapter()`` which returns the correct
``EngineAdapter`` subclass for a given engine name and config.

Adapter instances are cached per process (keyed by
``name + model_path + resolved device``) so that heavy model weights
are loaded only once per worker process.
"""

from __future__ import annotations

from backend.engines.base import EngineAdapter
from backend.engines.config import EngineConfig

# Registry of known engine types.
_ENGINE_REGISTRY: dict[str, type[EngineAdapter]] = {}

# Per-process adapter instance cache (keyed by config identity).
_ADAPTER_CACHE: dict[str, EngineAdapter] = {}


def _ensure_registry() -> None:
    """Lazily populate the registry so that adapters are imported only
    once and only when needed."""
    if _ENGINE_REGISTRY:
        return
    from backend.engines.xtts_hindi import XTTSHindiEngineAdapter
    from backend.engines.openvoice import OpenVoiceEngineAdapter

    _ENGINE_REGISTRY["xtts"] = XTTSHindiEngineAdapter
    _ENGINE_REGISTRY["openvoice"] = OpenVoiceEngineAdapter


def _cache_key(config: EngineConfig) -> str:
    """Derive a stable cache key from the engine config."""
    return f"{config.name}|{config.model_path}|{config.resolve_device()}"


def get_engine_adapter(config: EngineConfig) -> EngineAdapter:
    """Return a (cached) ``EngineAdapter`` for the given config.

    Adapter instances are cached per process so that model weights are
    loaded only once.  The cache is keyed by ``name + model_path +
    resolved device``.

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

    key = _cache_key(config)
    cached = _ADAPTER_CACHE.get(key)
    if cached is not None:
        return cached

    adapter_cls = _ENGINE_REGISTRY.get(config.engine_type)
    if adapter_cls is None:
        supported = ", ".join(sorted(_ENGINE_REGISTRY.keys()))
        raise ValueError(
            f"Unknown engine type {config.engine_type!r}. "
            f"Supported types: {supported}"
        )
    adapter = adapter_cls(config)
    _ADAPTER_CACHE[key] = adapter
    return adapter
