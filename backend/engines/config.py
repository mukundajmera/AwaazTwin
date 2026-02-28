"""
Engine configuration model.

``EngineConfig`` can be populated from a YAML config file
(``awaaztwin.yaml``) or from environment variables.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field


@dataclass
class EngineConfig:
    """Configuration for a single TTS / voice-cloning engine.

    Attributes
    ----------
    name:
        Unique identifier, e.g. ``"XTTS_HI"`` or ``"OPENVOICE_V2"``.
    engine_type:
        Engine family, e.g. ``"xtts"`` or ``"openvoice"``.
    model_path:
        Filesystem path to the model weights directory.
    device:
        Compute device — ``"auto"``, ``"cuda"``, ``"cpu"``, or
        ``"mps"``.  ``"auto"`` means: prefer CUDA if available, then
        MPS (Apple Silicon), then CPU.
    enabled:
        Whether the engine should be loaded at startup.
    max_concurrent_jobs:
        Maximum number of jobs this engine should serve in parallel.
    """

    name: str
    engine_type: str
    model_path: str = "/models/default"
    device: str = "auto"
    enabled: bool = True
    max_concurrent_jobs: int = 2

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def resolve_device(self) -> str:
        """Return an explicit device string based on ``self.device``.

        When *device* is ``"auto"`` the method probes for CUDA and MPS
        availability (import-safe — falls back to ``"cpu"`` if PyTorch
        is not installed).
        """
        if self.device != "auto":
            return self.device
        try:
            import torch  # type: ignore[import-untyped]

            if torch.cuda.is_available():
                return "cuda"
            if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                return "mps"
        except ImportError:
            pass
        return "cpu"


def load_engine_configs_from_env() -> list[EngineConfig]:
    """Build a list of ``EngineConfig`` from environment variables.

    Expected variables (all optional, with sensible defaults):

    * ``AWAAZTWIN_ENGINE_XTTS_HI_PATH``  — model path for XTTS Hindi
    * ``AWAAZTWIN_ENGINE_XTTS_HI_DEVICE`` — device for XTTS Hindi
    * ``AWAAZTWIN_ENGINE_XTTS_HI_ENABLED`` — ``"true"`` / ``"false"``
    * ``AWAAZTWIN_ENGINE_OPENVOICE_PATH``  — model path for OpenVoice
    * ``AWAAZTWIN_ENGINE_OPENVOICE_DEVICE`` — device for OpenVoice
    * ``AWAAZTWIN_ENGINE_OPENVOICE_ENABLED`` — ``"true"`` / ``"false"``
    """

    def _bool(val: str | None, default: bool = True) -> bool:
        if val is None:
            return default
        return val.strip().lower() in ("1", "true", "yes")

    configs: list[EngineConfig] = []

    configs.append(
        EngineConfig(
            name="XTTS_HI",
            engine_type="xtts",
            model_path=os.environ.get(
                "AWAAZTWIN_ENGINE_XTTS_HI_PATH", "/models/xtts-hindi"
            ),
            device=os.environ.get("AWAAZTWIN_ENGINE_XTTS_HI_DEVICE", "auto"),
            enabled=_bool(os.environ.get("AWAAZTWIN_ENGINE_XTTS_HI_ENABLED")),
        )
    )

    configs.append(
        EngineConfig(
            name="OPENVOICE_V2",
            engine_type="openvoice",
            model_path=os.environ.get(
                "AWAAZTWIN_ENGINE_OPENVOICE_PATH", "/models/openvoice-v2"
            ),
            device=os.environ.get("AWAAZTWIN_ENGINE_OPENVOICE_DEVICE", "auto"),
            enabled=_bool(
                os.environ.get("AWAAZTWIN_ENGINE_OPENVOICE_ENABLED"), default=False
            ),
        )
    )

    return configs
