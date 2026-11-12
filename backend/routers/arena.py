from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from routers.auth import get_current_user
import models
from services.toulmin_engine import toulmin_engine
from services.agent_swarm import tournament_swarm
from services.voice_engine import voice_engine_service

router = APIRouter(prefix="/api/v1/arena", tags=["Debate Arena & Agent Swarm"])


class ToulminParseRequest(BaseModel):
    argument_text: str = Field(min_length=5, max_length=10000)


class FactCheckRequest(BaseModel):
    speech_text: str = Field(min_length=5, max_length=15000)
    topic: Optional[str] = "General Debate Resolution"


class TournamentTurn(BaseModel):
    turn_index: int
    user_argument: str
    opponent_rebuttal: str
    opponent_persona: Optional[str] = "The Contrarian"


class TournamentAdjudicationRequest(BaseModel):
    session_id: Optional[int] = None
    topic: str
    turns: List[TournamentTurn]


class VoiceSynthesisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    persona: Optional[str] = "The Contrarian"


@router.post("/toulmin/parse")
def parse_toulmin_structure(
    payload: ToulminParseRequest,
    current_user: models.User = Depends(get_current_user),
):
    """Deconstructs speech into a 6-part Toulmin Model with visual graph nodes and edges."""
    try:
        return toulmin_engine.parse_argument(payload.argument_text)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.post("/fact-check")
def audit_factual_assertions(
    payload: FactCheckRequest,
    current_user: models.User = Depends(get_current_user),
):
    """Scans debate speech for empirical claims, numbers, statistics, and citations."""
    return tournament_swarm.audit_speech(payload.speech_text, payload.topic or "Debate Resolution")


@router.post("/match/adjudicate")
def adjudicate_tournament(
    payload: TournamentAdjudicationRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """3-Judge WSDC/BP Adjudication Panel evaluating Matter, Manner, and Method across all debate rounds."""
    if payload.session_id is not None:
        session = (
            db.query(models.DebateSession)
            .filter(models.DebateSession.id == payload.session_id, models.DebateSession.user_id == current_user.id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debate session not found.")

    turns_dicts = [t.model_dump() for t in payload.turns]
    ballot = tournament_swarm.adjudicate_match(turns_dicts)
    return {
        "session_id": payload.session_id,
        "topic": payload.topic,
        "ballot": ballot,
    }


@router.post("/voice/synthesize")
async def synthesize_opponent_voice(
    payload: VoiceSynthesisRequest,
    current_user: models.User = Depends(get_current_user),
):
    """Synthesizes high-fidelity neural audio for the AI opponent rebuttal."""
    audio_bytes = await voice_engine_service.synthesize_speech(payload.text, payload.persona or "The Contrarian")
    media_type = "audio/mpeg" if audio_bytes.startswith(b"\xff\xfb") or audio_bytes.startswith(b"ID3") else "audio/wav"
    return Response(content=audio_bytes, media_type=media_type)
