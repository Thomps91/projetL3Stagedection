"""
Schémas Pydantic — miroir exact des interfaces TypeScript définies dans
`src/types.ts` du frontend, pour que le JSON renvoyé par l'API soit
directement utilisable sans adaptation.
"""
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# DataRecord
# ---------------------------------------------------------------------------
class DataRecordBase(BaseModel):
    nom: str
    prenom: Optional[str] = None
    email: str = ""
    telephone: str = ""
    adresse: str = ""
    ville: str = ""
    sourceFile: str


class DataRecordCreate(DataRecordBase):
    pass


class DataRecord(DataRecordBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str

    @classmethod
    def from_orm_record(cls, record) -> "DataRecord":
        """Construit le schéma depuis un DataRecordModel (source_file -> sourceFile)."""
        return cls(
            id=record.id,
            nom=record.nom,
            prenom=record.prenom,
            email=record.email,
            telephone=record.telephone,
            adresse=record.adresse,
            ville=record.ville,
            sourceFile=record.source_file,
        )


# ---------------------------------------------------------------------------
# UploadedFile
# ---------------------------------------------------------------------------
class UploadedFile(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    size: str
    sizeBytes: int
    format: Literal["CSV", "XLSX", "XLS"]
    rowCount: int
    uploadDate: str


class UploadResponse(BaseModel):
    files: list[UploadedFile]
    records: list[DataRecord]
    warnings: list[str] = []


# ---------------------------------------------------------------------------
# FieldComparison / MatchPair
# ---------------------------------------------------------------------------
class FieldComparison(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    field: str
    label: str
    valA: str
    valB: str
    isMatch: bool
    similarity: int


MatchStatus = Literal["duplicate", "uncertain", "different"]
ArbitrationDecision = Optional[Literal["confirmed", "rejected"]]


class MatchPair(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    recordA: DataRecord
    recordB: DataRecord
    score: int
    status: MatchStatus
    statusLabel: str
    fieldComparisons: list[FieldComparison]
    decision: ArbitrationDecision = None
    decisionDate: Optional[str] = None


class ArbitrationRequest(BaseModel):
    decision: Literal["confirmed", "rejected"]


# ---------------------------------------------------------------------------
# AnalysisHistoryItem
# ---------------------------------------------------------------------------
AnalysisStatus = Literal["Terminé", "En cours", "Arbitré"]


class AnalysisHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    date: str
    files: list[str]
    totalRecords: int
    duplicatesFound: int
    uncertainCases: int
    differentCount: int
    status: AnalysisStatus
    executionTime: str

    @classmethod
    def from_orm_history(cls, h) -> "AnalysisHistoryItem":
        return cls(
            id=h.id,
            date=h.date,
            files=h.files or [],
            totalRecords=h.total_records,
            duplicatesFound=h.duplicates_found,
            uncertainCases=h.uncertain_cases,
            differentCount=h.different_count,
            status=h.status,
            executionTime=h.execution_time,
        )


class AnalysisRunRequest(BaseModel):
    """Paramètres optionnels pour affiner une exécution du moteur."""
    seuil_doublon: Optional[int] = None
    seuil_incertain: Optional[int] = None
    file_ids: Optional[list[str]] = None  # restreindre l'analyse à certains fichiers


class AnalysisRunResponse(BaseModel):
    history: AnalysisHistoryItem
    matches: list[MatchPair]


# ---------------------------------------------------------------------------
# Statistiques / Dashboard
# ---------------------------------------------------------------------------
class DashboardStats(BaseModel):
    totalFiles: int
    totalRecords: int
    duplicatesFound: int
    uncertainCases: int
    differentCount: int
    pendingArbitrationCount: int
