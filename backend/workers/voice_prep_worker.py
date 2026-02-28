"""
Voice-prep worker.

Processes uploaded audio samples into a reusable voice-profile
embedding that can later be used for synthesis.

Pipeline:
  1. Download raw audio from object storage.
  2. Convert mp3/flac to canonical 16-bit PCM WAV via ffmpeg.
  3. Call ``EngineAdapter.prepare_voice()`` for the configured engine.
  4. Persist the resulting ``VoiceEmbeddingRef`` and mark the profile
     as READY.

Run standalone::

    celery -A backend.workers.celery_app worker -Q voice_prep -l info
"""

from __future__ import annotations

import logging
import subprocess
import tempfile
from pathlib import Path

from backend.engines.config import EngineConfig, load_engine_configs_from_env
from backend.engines.factory import get_engine_adapter
from backend.workers.celery_app import app

logger = logging.getLogger(__name__)


def _download_file(uri: str, dest: Path) -> Path:
    """Download a file from object storage to *dest*.

    TODO: integrate with a real storage helper (boto3 / MinIO client).
    For now, if *uri* is a local path it is returned directly;
    otherwise a placeholder log is emitted.
    """
    local = Path(uri)
    if local.exists():
        return local
    logger.info("[voice-prep] Would download %s → %s (stub)", uri, dest)
    # Create a tiny placeholder so downstream code does not crash
    dest.write_bytes(b"")
    return dest


def _convert_to_wav(source: Path, output_dir: Path) -> Path:
    """Convert an audio file to canonical 16-bit 22050 Hz mono WAV.

    Uses ffmpeg if available, otherwise copies the file as-is with a
    warning (useful for testing without ffmpeg installed).
    """
    wav_path = output_dir / (source.stem + ".wav")
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(source),
                "-ar",
                "22050",
                "-ac",
                "1",
                "-sample_fmt",
                "s16",
                str(wav_path),
            ],
            check=True,
            capture_output=True,
        )
        logger.info("[voice-prep] Converted %s → %s", source, wav_path)
    except FileNotFoundError:
        logger.warning(
            "[voice-prep] ffmpeg not found – copying %s as-is", source
        )
        import shutil

        shutil.copy2(source, wav_path)
    return wav_path


def _get_default_engine_config() -> EngineConfig:
    """Return the first enabled engine config, or a sensible default."""
    for cfg in load_engine_configs_from_env():
        if cfg.enabled:
            return cfg
    return EngineConfig(
        name="XTTS_HI", engine_type="xtts", model_path="/models/xtts-hindi"
    )


@app.task(
    bind=True,
    name="backend.workers.voice_prep_worker.prepare_voice_profile",
    max_retries=3,
    default_retry_delay=30,
)
def prepare_voice_profile(
    self,  # noqa: ANN001 – Celery bound task
    voice_profile_id: str,
    sample_uris: list[str],
    engine_name: str | None = None,
) -> dict:
    """Celery task: process raw audio samples into a voice embedding.

    Parameters
    ----------
    voice_profile_id:
        ID of the ``VoiceProfile`` to update.
    sample_uris:
        List of object-storage URIs (or local paths) for the raw
        uploads.
    engine_name:
        Optional override for the engine to use (defaults to the
        first enabled engine).

    Returns
    -------
    dict
        JSON-serialisable result with the voice embedding reference.
    """
    logger.info(
        "[voice-prep] Starting preparation for profile=%s with %d sample(s)",
        voice_profile_id,
        len(sample_uris),
    )

    try:
        config = _get_default_engine_config()
        if engine_name:
            config = EngineConfig(
                name=engine_name,
                engine_type=config.engine_type,
                model_path=config.model_path,
                device=config.device,
            )

        adapter = get_engine_adapter(config)

        with tempfile.TemporaryDirectory(prefix="awaaztwin_prep_") as tmpdir:
            tmp = Path(tmpdir)
            wav_paths: list[Path] = []

            for uri in sample_uris:
                raw = _download_file(uri, tmp / Path(uri).name)
                wav = _convert_to_wav(raw, tmp)
                wav_paths.append(wav)

            voice_ref = adapter.prepare_voice(wav_paths)

        # TODO: persist voice_ref to DB and mark VoiceProfile as READY.
        logger.info(
            "[voice-prep] Profile %s preparation complete – embedding at %s",
            voice_profile_id,
            voice_ref.embedding_path,
        )

        return {
            "voice_profile_id": voice_profile_id,
            "status": "READY",
            "embedding": voice_ref.to_json(),
        }

    except Exception as exc:
        logger.exception(
            "[voice-prep] Failed to prepare profile %s", voice_profile_id
        )
        raise self.retry(exc=exc)


if __name__ == "__main__":
    # Allow running as a standalone worker:
    #   python -m backend.workers.voice_prep_worker
    app.worker_main(["worker", "-Q", "voice_prep", "-l", "info"])
