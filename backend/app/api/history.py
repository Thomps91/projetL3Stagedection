from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import AnalysisHistoryModel
from app.schemas import schemas

router = APIRouter(prefix="/api/history", tags=["Historique"])


@router.get("", response_model=list[schemas.AnalysisHistoryItem])
def list_history(db: Session = Depends(get_db)):
    rows = db.execute(
        select(AnalysisHistoryModel).order_by(AnalysisHistoryModel.created_at.desc())
    ).scalars().all()
    return [schemas.AnalysisHistoryItem.from_orm_history(r) for r in rows]
