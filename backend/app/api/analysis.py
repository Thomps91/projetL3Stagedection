import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.core.utils import format_datetime_fr
from app.db.database import get_db
from app.models.models import (
    DataRecordModel,
    MatchPairModel,
    FieldComparisonModel,
    AnalysisHistoryModel,
)
from app.schemas import schemas
from app.services.matching import find_matches, classify_score


router = APIRouter(
    prefix="/api/analysis",
    tags=["Analyse"],
)

settings = get_settings()


@router.post("/run", response_model=schemas.AnalysisRunResponse)
def run_analysis(
    payload: schemas.AnalysisRunRequest,
    db: Session = Depends(get_db),
):
    started_at = time.perf_counter()

    # ============================================================
    # 1. Récupération des enregistrements
    # ============================================================

    query = select(DataRecordModel)

    if payload.file_ids:
        query = query.where(
            DataRecordModel.file_id.in_(payload.file_ids)
        )

    records = db.execute(query).scalars().all()

    if not records:
        raise HTTPException(
            status_code=400,
            detail=(
                "Aucun enregistrement à analyser. "
                "Importez d'abord des fichiers."
            ),
        )

    # ============================================================
    # 2. Vérification du nombre de fichiers
    # ============================================================

    file_ids = list(dict.fromkeys(r.file_id for r in records))

    if len(file_ids) < 2:
        raise HTTPException(
            status_code=400,
            detail=(
                "L'analyse de rapprochement nécessite au moins "
                "2 fichiers sources différents."
            ),
        )

    # ============================================================
    # 3. Préparation des enregistrements par fichier
    # ============================================================

    records_by_file: dict[str, list[dict]] = {}

    for record in records:
        record_dict = {
            "id": record.id,
            "nom": record.nom,
            "prenom": record.prenom,
            "email": record.email,
            "telephone": record.telephone,
            "adresse": record.adresse,
            "ville": record.ville,
        }

        records_by_file.setdefault(record.file_id, []).append(
            record_dict
        )

    # ============================================================
    # 4. Seuils
    # ============================================================

    seuil_doublon = (
        payload.seuil_doublon
        if payload.seuil_doublon is not None
        else settings.SEUIL_DOUBLON
    )

    seuil_incertain = (
        payload.seuil_incertain
        if payload.seuil_incertain is not None
        else settings.SEUIL_INCERTAIN
    )

    if seuil_incertain >= seuil_doublon:
        raise HTTPException(
            status_code=400,
            detail=(
                "Le seuil incertain doit être inférieur "
                "au seuil de doublon."
            ),
        )

    # ============================================================
    # 5. Comparaison entre fichiers uniquement
    # ============================================================

    results = []

    file_items = list(records_by_file.items())

    for i in range(len(file_items)):
        file_id_a, records_a = file_items[i]

        for j in range(i + 1, len(file_items)):
            file_id_b, records_b = file_items[j]

            # On compare uniquement les deux sources différentes.
            # Aucun record d'un fichier n'est comparé avec un autre
            # record du même fichier.

            pair_records = records_a + records_b

            pair_results = find_matches(
                pair_records,
                seuil_incertain=seuil_incertain,
            )

            # ----------------------------------------------------
            # Garder uniquement les correspondances A ↔ B
            # ----------------------------------------------------

            ids_a = {record["id"] for record in records_a}
            ids_b = {record["id"] for record in records_b}

            for result in pair_results:

                is_cross_file_match = (
                    (
                        result.record_a_id in ids_a
                        and result.record_b_id in ids_b
                    )
                    or
                    (
                        result.record_a_id in ids_b
                        and result.record_b_id in ids_a
                    )
                )

                if not is_cross_file_match:
                    continue

                result.status, result.status_label = classify_score(
                    result.score,
                    seuil_doublon=seuil_doublon,
                    seuil_incertain=seuil_incertain,
                )

                results.append(result)

    # ============================================================
    # 6. Suppression des anciens résultats courants
    # ============================================================

    db.execute(delete(MatchPairModel))
    db.flush()

    # ============================================================
    # 7. Statistiques
    # ============================================================

    file_names = sorted(
        {
            record.file.name
            for record in records
            if record.file is not None
        }
    )

    duplicates_found = sum(
        1
        for result in results
        if result.status == "duplicate"
    )

    uncertain_cases = sum(
        1
        for result in results
        if result.status == "uncertain"
    )

    different_count = sum(
        1
        for result in results
        if result.status == "different"
    )

    execution_time = (
        f"{time.perf_counter() - started_at:.2f}s"
    )

    # ============================================================
    # 8. Création de l'historique
    # ============================================================

    history = AnalysisHistoryModel(
        date=format_datetime_fr(),
        files=file_names,
        total_records=len(records),
        duplicates_found=duplicates_found,
        uncertain_cases=uncertain_cases,
        different_count=different_count,
        status="Terminé",
        execution_time=execution_time,
    )

    db.add(history)
    db.flush()

    # ============================================================
    # 9. Enregistrement des résultats
    # ============================================================

    match_rows: list[MatchPairModel] = []

    for result in results:

        match_row = MatchPairModel(
            record_a_id=result.record_a_id,
            record_b_id=result.record_b_id,
            score=result.score,
            status=result.status,
            status_label=result.status_label,
            analysis_id=history.id,
        )

        db.add(match_row)
        db.flush()

        for field_comparison in result.field_comparisons:

            db.add(
                FieldComparisonModel(
                    match_id=match_row.id,
                    field=field_comparison.field,
                    label=field_comparison.label,
                    val_a=field_comparison.val_a,
                    val_b=field_comparison.val_b,
                    is_match=field_comparison.is_match,
                    similarity=field_comparison.similarity,
                )
            )

        match_rows.append(match_row)

    # ============================================================
    # 10. Validation transactionnelle
    # ============================================================

    db.commit()

    # ============================================================
    # 11. Rechargement des résultats
    # ============================================================

    matches = _load_matches(
        db,
        [match.id for match in match_rows],
    )

    return schemas.AnalysisRunResponse(
        history=schemas.AnalysisHistoryItem.from_orm_history(
            history
        ),
        matches=matches,
    )


@router.get(
    "/results",
    response_model=list[schemas.MatchPair],
)
def get_results(
    db: Session = Depends(get_db),
):
    ids = db.execute(
        select(MatchPairModel.id)
    ).scalars().all()

    return _load_matches(db, ids)


@router.get(
    "/results/{match_id}",
    response_model=schemas.MatchPair,
)
def get_result(
    match_id: str,
    db: Session = Depends(get_db),
):
    matches = _load_matches(
        db,
        [match_id],
    )

    if not matches:
        raise HTTPException(
            status_code=404,
            detail="Correspondance introuvable.",
        )

    return matches[0]


def _load_matches(
    db: Session,
    ids: list[str],
) -> list[schemas.MatchPair]:

    if not ids:
        return []

    rows = (
        db.execute(
            select(MatchPairModel)
            .where(MatchPairModel.id.in_(ids))
            .options(
                selectinload(MatchPairModel.record_a),
                selectinload(MatchPairModel.record_b),
                selectinload(
                    MatchPairModel.field_comparisons
                ),
            )
            .order_by(
                MatchPairModel.score.desc()
            )
        )
        .scalars()
        .all()
    )

    return [
        schemas.MatchPair(
            id=match.id,
            recordA=schemas.DataRecord.from_orm_record(
                match.record_a
            ),
            recordB=schemas.DataRecord.from_orm_record(
                match.record_b
            ),
            score=match.score,
            status=match.status,
            statusLabel=match.status_label,
            fieldComparisons=[
                schemas.FieldComparison(
                    field=field_comparison.field,
                    label=field_comparison.label,
                    valA=field_comparison.val_a,
                    valB=field_comparison.val_b,
                    isMatch=field_comparison.is_match,
                    similarity=field_comparison.similarity,
                )
                for field_comparison
                in match.field_comparisons
            ],
            decision=match.decision,
            decisionDate=match.decision_date,
        )
        for match in rows
    ]