from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.utils import format_size, format_datetime_fr
from app.db.database import get_db
from app.models.models import UploadedFileModel, DataRecordModel
from app.schemas import schemas
from app.services.file_parser import parse_records

router = APIRouter(prefix="/api/files", tags=["Fichiers"])
settings = get_settings()

VALID_FORMATS = {"CSV", "XLSX", "XLS"}


@router.get("", response_model=list[schemas.UploadedFile])
def list_files(db: Session = Depends(get_db)):
    files = db.execute(select(UploadedFileModel).order_by(UploadedFileModel.created_at)).scalars().all()
    return [_to_schema(f) for f in files]


@router.post("/upload", response_model=schemas.UploadResponse)
async def upload_files(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    if not files:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")

    max_bytes = settings.MAX_UPLOAD_SIZE_MO * 1024 * 1024
    created_files: list[UploadedFileModel] = []
    created_records: list[DataRecordModel] = []
    warnings: list[str] = []

    for upload in files:
        extension = (upload.filename or "").rsplit(".", 1)[-1].upper()
        if extension not in VALID_FORMATS:
            warnings.append(f"Format non supporté pour « {upload.filename} » (CSV, XLSX ou XLS attendu).")
            continue

        content = await upload.read()
        if len(content) > max_bytes:
            warnings.append(f"« {upload.filename} » dépasse la taille maximale de {settings.MAX_UPLOAD_SIZE_MO} Mo.")
            continue

        try:
            parsed_records, row_count = parse_records(upload.filename, content)
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"Impossible de lire « {upload.filename} » : {exc}")
            continue

        file_row = UploadedFileModel(
            name=upload.filename,
            size=format_size(len(content)),
            size_bytes=len(content),
            format=extension,
            row_count=row_count,
            upload_date=format_datetime_fr(),
        )
        db.add(file_row)
        db.flush()  # récupère file_row.id

        for rec in parsed_records:
            record_row = DataRecordModel(
                nom=rec["nom"],
                prenom=rec.get("prenom"),
                email=rec["email"],
                telephone=rec["telephone"],
                adresse=rec["adresse"],
                ville=rec["ville"],
                source_file=rec["sourceFile"],
                file_id=file_row.id,
            )
            db.add(record_row)
            created_records.append(record_row)

        created_files.append(file_row)

    db.commit()
    for f in created_files:
        db.refresh(f)
    for r in created_records:
        db.refresh(r)

    return schemas.UploadResponse(
        files=[_to_schema(f) for f in created_files],
        records=[schemas.DataRecord.from_orm_record(r) for r in created_records],
        warnings=warnings,
    )


@router.delete("/{file_id}", status_code=204)
def delete_file(file_id: str, db: Session = Depends(get_db)):
    file_row = db.get(UploadedFileModel, file_id)
    if not file_row:
        raise HTTPException(status_code=404, detail="Fichier introuvable.")
    db.delete(file_row)  # cascade -> supprime aussi les DataRecord liés
    db.commit()
    return None


def _to_schema(file_row: UploadedFileModel) -> schemas.UploadedFile:
    return schemas.UploadedFile(
        id=file_row.id,
        name=file_row.name,
        size=file_row.size,
        sizeBytes=file_row.size_bytes,
        format=file_row.format,
        rowCount=file_row.row_count,
        uploadDate=file_row.upload_date,
    )
