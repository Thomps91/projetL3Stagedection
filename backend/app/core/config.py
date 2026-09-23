"""
Configuration centralisée de l'application, lue depuis les variables
d'environnement / fichier .env.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    # Base de données
    DATABASE_URL: str = (
        "postgresql://onja:onja_password@localhost:5433/doublons_db"
    )

    # CORS
    CORS_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    )

    # Moteur de rapprochement
    SEUIL_DOUBLON: int = 85
    SEUIL_INCERTAIN: int = 60

    # Upload
    MAX_UPLOAD_SIZE_MO: int = 50

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()