from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.utils import format_time_fr
from app.db.database import get_db
from app.models.models import MatchPairModel
from app.schemas import schemas
from app.api.analysis import _load_matches

router = APIRouter(prefix="/api/arbitration", tags=["Arbitrage"])

STATUS_LABELS = {
    "confirmed": "Doublon confirmé (Arbitré)",
    "rejected": "Ressemblance rejetée (Arbitré)",
}


@router.post("/{match_id}", response_model=schemas.MatchPair)
def arbitrate(match_id: str, payload: schemas.ArbitrationRequest, db: Session = Depends(get_db)):
    match_row = db.get(MatchPairModel, match_id)
    if not match_row:
        raise HTTPException(status_code=404, detail="Correspondance introuvable.")

    match_row.decision = payload.decision
    match_row.decision_date = format_time_fr()
    match_row.status_label = STATUS_LABELS[payload.decision]
    db.commit()

    return _load_matches(db, [match_id])[0]


@router.post("/reset", response_model=list[schemas.MatchPair])
def reset_arbitration(db: Session = Depends(get_db)):
    """Réinitialise l'arbitrage de toutes les correspondances incertaines."""
    rows = db.execute(
        select(MatchPairModel).where(MatchPairModel.status == "uncertain")
    ).scalars().all()

    for row in rows:
        row.decision = None
        row.decision_date = None
        row.status_label = "Cas incertain"

    db.commit()
    return _load_matches(db, [r.id for r in rows])
