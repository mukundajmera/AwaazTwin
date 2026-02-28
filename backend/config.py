"""Application configuration loaded from ``awaaztwin.yaml`` + environment variables.

Resolution order (highest priority first):
    1. Environment variables prefixed with ``AWAAZTWIN_`` (nested with ``__``).
    2. Values in ``awaaztwin.yaml`` (or path set by ``AWAAZTWIN_CONFIG_PATH``).
    3. Defaults defined in the Pydantic model below.
"""

from __future__ import annotations

import functools
import logging
from pathlib import Path
from typing import Any

import yaml
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

_CONFIG_PATH_ENV = "AWAAZTWIN_CONFIG_PATH"
_DEFAULT_CONFIG_PATH = Path("awaaztwin.yaml")


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------

class ServerConfig(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AWAAZTWIN_SERVER_")
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = False
    log_level: str = "info"


class StorageConfig(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AWAAZTWIN_STORAGE_")
    endpoint: str = "http://localhost:9000"
    access_key: str = "minioadmin"
    secret_key: str = "minioadmin"
    bucket: str = "awaaztwin"
    region: str = "us-east-1"
    secure: bool = False


class EngineEntry(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AWAAZTWIN_ENGINE_")
    name: str = "xtts-hindi"
    enabled: bool = True
    device: str = "auto"
    options: dict[str, Any] = Field(default_factory=dict)


class LimitsConfig(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AWAAZTWIN_LIMITS_")
    max_samples_per_voice: int = 10
    max_sample_size_mb: int = 50
    max_text_length: int = 5000
    max_concurrent_jobs: int = 4


class DatabaseConfig(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AWAAZTWIN_DB_")
    url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/awaaztwin"


class RedisConfig(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AWAAZTWIN_REDIS_")
    url: str = "redis://localhost:6379/0"


# ---------------------------------------------------------------------------
# Root config
# ---------------------------------------------------------------------------

class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AWAAZTWIN_")
    server: ServerConfig = Field(default_factory=ServerConfig)
    storage: StorageConfig = Field(default_factory=StorageConfig)
    engines: list[EngineEntry] = Field(default_factory=lambda: [EngineEntry()])
    limits: LimitsConfig = Field(default_factory=LimitsConfig)
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    redis: RedisConfig = Field(default_factory=RedisConfig)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _detect_device() -> str:
    """Return the best available compute device: cuda > mps > cpu."""
    try:
        import torch  # type: ignore[import-untyped]

        if torch.cuda.is_available():
            return "cuda"
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
    except ImportError:
        pass
    return "cpu"


def _load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        logger.info("Config file %s not found – using defaults.", path)
        return {}
    with open(path) as fh:
        data = yaml.safe_load(fh) or {}
    logger.info("Loaded config from %s", path)
    return data


@functools.lru_cache(maxsize=1)
def get_config() -> AppConfig:
    """Return the singleton ``AppConfig``, loading from YAML + env vars."""
    import os

    yaml_path = Path(os.environ.get(_CONFIG_PATH_ENV, str(_DEFAULT_CONFIG_PATH)))
    yaml_data = _load_yaml(yaml_path)
    return AppConfig(**yaml_data)


def get_engine_configs() -> list[EngineEntry]:
    """Return engine entries with ``device`` resolved from ``auto``."""
    cfg = get_config()
    resolved: list[EngineEntry] = []
    for eng in cfg.engines:
        if eng.device == "auto":
            eng = eng.model_copy(update={"device": _detect_device()})
        resolved.append(eng)
    return resolved
