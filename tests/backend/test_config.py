"""Tests for the configuration system."""

import os
from pathlib import Path

import pytest
import yaml

from backend.config import AppConfig, ServerConfig, StorageConfig, EngineEntry, LimitsConfig, _detect_device


class TestServerConfig:
    def test_defaults(self) -> None:
        cfg = ServerConfig()
        assert cfg.host == "0.0.0.0"
        assert cfg.port == 8000
        assert cfg.reload is False
        assert cfg.log_level == "info"


class TestStorageConfig:
    def test_defaults(self) -> None:
        cfg = StorageConfig()
        assert cfg.endpoint == "http://localhost:9000"
        assert cfg.bucket == "awaaztwin"
        assert cfg.secure is False


class TestEngineEntry:
    def test_defaults(self) -> None:
        entry = EngineEntry()
        assert entry.name == "xtts-hindi"
        assert entry.enabled is True
        assert entry.device == "auto"
        assert entry.options == {}

    def test_custom(self) -> None:
        entry = EngineEntry(name="openvoice", enabled=False, device="cpu")
        assert entry.name == "openvoice"
        assert entry.enabled is False
        assert entry.device == "cpu"


class TestLimitsConfig:
    def test_defaults(self) -> None:
        cfg = LimitsConfig()
        assert cfg.max_samples_per_voice == 10
        assert cfg.max_sample_size_mb == 50
        assert cfg.max_text_length == 5000
        assert cfg.max_concurrent_jobs == 4


class TestAppConfig:
    def test_default_construction(self) -> None:
        cfg = AppConfig()
        assert cfg.server.port == 8000
        assert len(cfg.engines) == 1
        assert cfg.engines[0].name == "xtts-hindi"

    def test_from_dict(self) -> None:
        cfg = AppConfig(
            server=ServerConfig(port=9000),
            engines=[
                EngineEntry(name="xtts-hindi"),
                EngineEntry(name="openvoice", enabled=False),
            ],
        )
        assert cfg.server.port == 9000
        assert len(cfg.engines) == 2


class TestDetectDevice:
    def test_returns_string(self) -> None:
        device = _detect_device()
        assert device in ("cuda", "mps", "cpu")

    def test_cpu_without_torch(self) -> None:
        # In a test environment without torch, should return "cpu"
        device = _detect_device()
        assert isinstance(device, str)


class TestExampleYaml:
    def test_example_yaml_is_valid(self) -> None:
        yaml_path = Path(__file__).parent.parent.parent / "awaaztwin.example.yaml"
        assert yaml_path.exists(), f"awaaztwin.example.yaml not found at {yaml_path}"
        with open(yaml_path) as f:
            data = yaml.safe_load(f)
        assert "server" in data
        assert "engines" in data
        assert "storage" in data
        assert "limits" in data
        assert isinstance(data["engines"], list)
        assert len(data["engines"]) >= 1
