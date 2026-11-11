from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List

from celery_app import celery_app
from database import SessionLocal
import models
from services.speech_engine import speech_engine_service

LOGGER = logging.getLogger(__name__)


@celery_app.task(name="tasks.process_audio_acoustics", bind=True)
def process_audio_acoustics(self, session_id: int, user_id: int, file_path_str: str, transcript: str = "") -> Dict[str, Any]:
    """Background task for heavy FFmpeg acoustic decoding and prosody calculation."""
    LOGGER.info("Starting acoustic processing task for session %s (file: %s)", session_id, file_path_str)
    path = Path(file_path_str)
    if not path.exists():
        raise FileNotFoundError(f"Audio file does not exist: {file_path_str}")

    resolved_transcript = transcript.strip() or speech_engine_service.transcribe_audio(path)
    metrics = speech_engine_service.analyze_audio(path, resolved_transcript)

    db = SessionLocal()
    try:
        persisted_fields = {
            key: metrics[key]
            for key in (
                "speech_pace_wpm", "filler_words_count", "filler_words_list",
                "confidence_score", "clarity_score", "engagement_score",
                "duration_seconds", "pause_count", "silence_ratio_percent", "average_volume_percent",
                "ai_feedback",
            )
            if key in metrics
        }
        metric_record = models.PresentationMetric(session_id=session_id, user_id=user_id, **persisted_fields)
        db.add(metric_record)
        db.commit()
        db.refresh(metric_record)
        LOGGER.info("Successfully persisted acoustic metrics with ID %s", metric_record.id)
        return {"status": "completed", "metric_id": metric_record.id, "metrics": metrics}
    except Exception as exc:
        db.rollback()
        LOGGER.exception("Failed to persist acoustic metrics: %s", exc)
        raise exc
    finally:
        db.close()


@celery_app.task(name="tasks.adjudicate_tournament_match", bind=True)
def adjudicate_tournament_match(self, session_id: int, affirmative_user_id: int, negative_user_id: int, rounds: List[Dict[str, str]]) -> Dict[str, Any]:
    """Background task running multi-judge WSDC/BP adjudication panel across all rounds."""
    from services.agent_swarm import tournament_swarm
    LOGGER.info("Adjudicating tournament match for session %s with %s turns", session_id, len(rounds))
    ballot = tournament_swarm.adjudicate_match(rounds)
    return {
        "session_id": session_id,
        "affirmative_user_id": affirmative_user_id,
        "negative_user_id": negative_user_id,
        "ballot": ballot,
    }


@celery_app.task(name="tasks.compile_pdf_report", bind=True)
def compile_pdf_report(self, session_id: int, user_id: int) -> Dict[str, Any]:
    """Pre-compiles complex PDF reports and caches the generated binary."""
    from routers.reports import _session_data, _report_lines, generate_pdf_bytes
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        data = _session_data(session_id, user, db)
        pdf_bytes = generate_pdf_bytes(f"LOGOS.AI ASSESSMENT REPORT // SESSION {session_id}", _report_lines(data))
        cache_path = Path("./uploads") / f"report_{session_id}_{user_id}.pdf"
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        cache_path.write_bytes(pdf_bytes)
        return {"status": "ready", "path": str(cache_path), "size": len(pdf_bytes)}
    finally:
        db.close()
