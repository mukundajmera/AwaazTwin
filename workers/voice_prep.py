"""Voice-prep worker – processes uploaded audio samples into voice embeddings.

Run with:
    rq worker voice-prep --with-scheduler

TODO:
    - Wire up real DB session for status updates.
    - Handle transient failures with RQ retry.
"""

from __future__ import annotations

import logging
import os
import subprocess
import tempfile
from pathlib import Path
from uuid import UUID

from workers.common import configure_logging

configure_logging()
logger = logging.getLogger(__name__)


def prepare_voice(voice_profile_id: str, engine_name: str, sample_keys: list[str]) -> None:
    """Download audio samples, convert to WAV, and extract a speaker embedding.

    This function is meant to be enqueued onto the ``voice-prep`` RQ queue.

    Args:
        voice_profile_id: UUID of the voice profile being processed.
        engine_name: Engine adapter name to use for embedding extraction.
        sample_keys: Object-storage keys of uploaded audio samples.
    """
    profile_id = UUID(voice_profile_id)
    logger.info("voice-prep starting for profile=%s engine=%s samples=%d",
                profile_id, engine_name, len(sample_keys))

    # TODO: Update VoiceProfile.status → PROCESSING in DB.

    wav_paths: list[Path] = []
    for key in sample_keys:
        # TODO: Download from object storage using backend.storage.download_file.
        logger.info("  downloading sample %s", key)
        fd, tmp = tempfile.mkstemp(suffix=".raw", prefix="vp_")
        raw_path = Path(tmp)
        raw_path.write_bytes(b"\x00" * 100)  # placeholder
        os.close(fd)

        # Convert to WAV via ffmpeg
        wav_path = raw_path.with_suffix(".wav")
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-i", str(raw_path), "-ar", "22050", "-ac", "1", str(wav_path)],
                capture_output=True,
                check=True,
                timeout=120,
            )
        except FileNotFoundError:
            logger.warning("ffmpeg not found – skipping conversion for %s", key)
            wav_path = raw_path  # fallback: use raw file as-is
        except subprocess.CalledProcessError as exc:
            logger.error("ffmpeg failed for %s: %s", key, exc.stderr[:500])
            continue

        wav_paths.append(wav_path)

    if not wav_paths:
        logger.error("No usable samples for profile=%s – marking FAILED", profile_id)
        # TODO: Update VoiceProfile.status → FAILED in DB.
        return

    # Get engine adapter and run prepare_voice
    from backend.engines.factory import get_engine_adapter

    adapter = get_engine_adapter(engine_name)
    # NOTE: EngineAdapter.prepare_voice is async; run it synchronously in the worker.
    import asyncio

    embedding_ref = asyncio.get_event_loop().run_until_complete(
        adapter.prepare_voice(wav_paths)
    )

    logger.info("Embedding created at %s for profile=%s", embedding_ref.embedding_path, profile_id)

    # TODO: Upload embedding to object storage.
    # TODO: Update VoiceProfile with embedding_path, status → READY.
    logger.info("voice-prep complete for profile=%s", profile_id)
