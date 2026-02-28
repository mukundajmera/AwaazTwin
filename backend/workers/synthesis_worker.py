"""
Synthesis worker.

Generates audio from text using a voice-profile embedding and the
configured TTS / voice-cloning engine.

Pipeline:
  1. Load the correct ``EngineAdapter`` from ``EngineConfig``.
  2. Call ``synthesize()`` with text + voice reference.
  3. Upload the generated WAV to object storage.
  4. Update the ``SynthesisJob`` with status, duration, and output URI.

Run standalone::

    celery -A backend.workers.celery_app worker -Q synthesis -l info
"""

from __future__ import annotations

import logging
import time
from pathlib import Path

from backend.engines.base import VoiceEmbeddingRef
from backend.engines.config import EngineConfig, load_engine_configs_from_env
from backend.engines.factory import get_engine_adapter
from backend.workers.celery_app import app

logger = logging.getLogger(__name__)


def _upload_file(local_path: Path, dest_uri: str) -> str:
    """Upload a local file to object storage.

    TODO: integrate with a real storage helper (boto3 / MinIO client).
    For now this is a stub that returns the local path as the URI.
    """
    logger.info(
        "[synthesis] Would upload %s → %s (stub)", local_path, dest_uri
    )
    return str(local_path)


def _find_engine_config(engine_name: str) -> EngineConfig:
    """Find the matching ``EngineConfig`` or fall back to defaults."""
    for cfg in load_engine_configs_from_env():
        if cfg.name == engine_name and cfg.enabled:
            return cfg
    return EngineConfig(
        name="XTTS_HI", engine_type="xtts", model_path="/models/xtts-hindi"
    )


@app.task(
    bind=True,
    name="backend.workers.synthesis_worker.run_synthesis",
    max_retries=3,
    default_retry_delay=30,
)
def run_synthesis(
    self,  # noqa: ANN001 – Celery bound task
    job_id: str,
    text: str,
    voice_embedding_json: str,
    engine_name: str = "XTTS_HI",
    params: dict | None = None,
) -> dict:
    """Celery task: generate speech audio for a ``SynthesisJob``.

    Parameters
    ----------
    job_id:
        Unique identifier for the synthesis job.
    text:
        The text to convert to speech.
    voice_embedding_json:
        JSON string of a ``VoiceEmbeddingRef`` (from
        ``prepare_voice_profile``).
    engine_name:
        Which engine to use (must match an ``EngineConfig.name``).
    params:
        Optional engine-specific synthesis parameters.

    Returns
    -------
    dict
        JSON-serialisable result with job status, duration, and
        output URI.
    """
    logger.info(
        "[synthesis] Starting job=%s engine=%s text=%r",
        job_id,
        engine_name,
        text[:80],
    )

    start = time.monotonic()

    try:
        config = _find_engine_config(engine_name)
        adapter = get_engine_adapter(config)

        voice_ref = VoiceEmbeddingRef.from_json(voice_embedding_json)
        output_path = adapter.synthesize(text, voice_ref, params or {})

        duration_sec = round(time.monotonic() - start, 3)

        # Upload to object storage
        output_uri = _upload_file(
            output_path, f"outputs/{job_id}.wav"
        )

        # TODO: update SynthesisJob in DB with status, duration, output_uri.
        logger.info(
            "[synthesis] Job %s completed in %.3fs – output at %s",
            job_id,
            duration_sec,
            output_uri,
        )

        return {
            "job_id": job_id,
            "status": "completed",
            "duration_sec": duration_sec,
            "output_uri": output_uri,
        }

    except Exception as exc:
        logger.exception("[synthesis] Job %s failed", job_id)
        raise self.retry(exc=exc)


if __name__ == "__main__":
    # Allow running as a standalone worker:
    #   python -m backend.workers.synthesis_worker
    app.worker_main(["worker", "-Q", "synthesis", "-l", "info"])
