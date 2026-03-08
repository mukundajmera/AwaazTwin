"""
Celery application configuration for AwaazTwin workers.

We use **Celery** (rather than RQ) because:
  - Built-in retry policies with exponential backoff.
  - Mature task routing: different queues for voice-prep vs synthesis.
  - Built-in worker monitoring (Flower) and graceful shutdown.
  - Widely adopted in production Python stacks.

The broker is Redis, keeping infra simple (Redis is already needed for
caching and lightweight pub/sub in the main API).
"""

from __future__ import annotations

import os

from celery import Celery

REDIS_URL = os.environ.get("AWAAZTWIN_REDIS_URL", "redis://localhost:6379/0")

app = Celery(
    "awaaztwin",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

app.conf.update(
    # Routing: each task type goes to its own queue
    task_routes={
        "backend.workers.voice_prep_worker.prepare_voice_profile": {
            "queue": "voice_prep",
        },
        "backend.workers.synthesis_worker.run_synthesis": {
            "queue": "synthesis",
        },
    },
    # Serialisation
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    # Timezone
    timezone="UTC",
    enable_utc=True,
    # Worker
    worker_prefetch_multiplier=1,
    worker_concurrency=2,
    # Retry defaults
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)
