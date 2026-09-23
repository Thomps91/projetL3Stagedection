from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import UploadedFileModel, DataRecordModel, MatchPairModel
from app.schemas import schemas

router = APIRouter(prefix="/api/stats", tags=["Statistiques"])


@router.get("/dashboard", response_model=schemas.DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    total_files = db.execute(select(func.count(UploadedFileModel.id))).scalar_one()
    total_records = db.execute(select(func.count(DataRecordModel.id))).scalar_one()

    def count_status(status: str) -> int:
        return db.execute(
            select(func.count(MatchPairModel.id)).where(MatchPairModel.status == status)
        ).scalar_one()

    duplicates_found = count_status("duplicate")
    uncertain_cases = count_status("uncertain")
    different_count = count_status("different")

    pending_arbitration = db.execute(
        select(func.count(MatchPairModel.id)).where(
            MatchPairModel.status == "uncertain",
            MatchPairModel.decision.is_(None),
        )
    ).scalar_one()

    return schemas.DashboardStats(
        totalFiles=total_files,
        totalRecords=total_records,
        duplicatesFound=duplicates_found,
        uncertainCases=uncertain_cases,
        differentCount=different_count,
        pendingArbitrationCount=pending_arbitration,
    )
