from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.database import Base, engine
from app.models import models  # noqa: F401
from app.api import files, records, analysis, arbitration, history, stats

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crée les tables si elles n'existent pas encore.
    # Pratique en développement.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="API de détection de doublons — Onja / ConnectiQ",
    description=(
        "Moteur de rapprochement et de détection de doublons "
        "(FastAPI + pandas + textdistance + PostgreSQL)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files.router)
app.include_router(records.router)
app.include_router(analysis.router)
app.include_router(arbitration.router)
app.include_router(history.router)
app.include_router(stats.router)


@app.get("/api/health", tags=["Santé"])
def health_check():
    return {"status": "ok"}