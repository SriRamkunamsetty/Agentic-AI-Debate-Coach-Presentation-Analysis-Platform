from __future__ import annotations

import os
from celery import Celery
from config import settings

celery_app = Celery(
    "logos_ai",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes maximum for long speech tasks
    task_soft_time_limit=240,
    worker_prefetch_multiplier=1,
    worker_concurrency=int(os.getenv("CELERY_CONCURRENCY", "4")),
    task_routes={
        "tasks.process_audio_acoustics": {"queue": "audio"},
        "tasks.adjudicate_tournament_match": {"queue": "ai_agents"},
        "tasks.compile_pdf_report": {"queue": "reports"},
    },
)
