"""Synthesis worker – generates speech audio from text using voice embeddings.

Run with:
    rq worker synthesis --with-scheduler

TODO:
    - Wire up real DB session for status updates.
    - Handle transient failures with RQ retry.
    - Stream large text in chunks.
"""

from __future__ import annotations

import logging
import os
import tempfile
from pathlib import Path
from uuid import UUID

from workers.common import configure_logging

configure_logging()
logger = logging.getLogger(__name__)


def run_synthesis(job_id: str, engine_name: str, voice_profile_id: str,
                  text: str, params: dict | None = None) -> None:
    """Synthesize speech and upload the result.

    This function is meant to be enqueued onto the ``synthesis`` RQ queue.

    Args:
        job_id: UUID of the SynthesisJob row.
        engine_name: Engine adapter name.
        voice_profile_id: UUID of the voice profile to use.
        text: Input text to synthesize.
        params: Optional engine-specific synthesis parameters.
    """
    jid = UUID(job_id)
    pid = UUID(voice_profile_id)
    logger.info("synthesis starting job=%s engine=%s profile=%s", jid, engine_name, pid)

    # TODO: Update SynthesisJob.status → PROCESSING in DB.

    # TODO: Fetch VoiceProfile from DB to get embedding_path.
    # Placeholder: build a dummy VoiceEmbeddingRef
    from backend.engines.base import VoiceEmbeddingRef
    from backend.engines.factory import get_engine_adapter

    fd, tmp = tempfile.mkstemp(suffix=".pth")
    os.close(fd)
    voice_ref = VoiceEmbeddingRef(
        engine_name=engine_name,
        embedding_path=Path(tmp),
        metadata={},
    )

    adapter = get_engine_adapter(engine_name)

    import asyncio

    try:
        output_path = asyncio.run(
            adapter.synthesize(text, voice_ref, params or {})
        )
    except Exception:
        logger.exception("Synthesis failed for job=%s", jid)
        # TODO: Update SynthesisJob.status → FAILED, error_message in DB.
        return

    logger.info("Synthesis output at %s for job=%s", output_path, jid)

    # TODO: Upload output_path to object storage.
    # TODO: Update SynthesisJob with output_storage_key, status → COMPLETED.
    logger.info("synthesis complete for job=%s", jid)
