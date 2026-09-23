"""
Lecture et normalisation des fichiers CSV / XLSX / XLS importés,
à l'aide de pandas.

Les colonnes du fichier source sont mises en correspondance
avec le modèle DataRecord :

nom, prenom, email, telephone, adresse, ville.

Les téléphones sont normalisés afin de conserver un format
malgache cohérent.
"""

from __future__ import annotations

import io
import re
import unicodedata

import pandas as pd


COLUMN_ALIASES: dict[str, list[str]] = {
    "nom": [
        "nom",
        "name",
        "nom complet",
        "fullname",
        "full name",
        "nom prenom",
        "client",
    ],
    "prenom": [
        "prenom",
        "firstname",
        "first name",
    ],
    "email": [
        "email",
        "mail",
        "e mail",
        "courriel",
        "adresse email",
        "adresse mail",
    ],
    "telephone": [
        "telephone",
        "tel",
        "phone",
        "numero",
        "contact",
        "mobile",
    ],
    "adresse": [
        "adresse",
        "address",
        "adress",
    ],
    "ville": [
        "ville",
        "city",
        "commune",
        "localite",
    ],
}


def _strip_accents(text: str) -> str:
    """Supprime les accents d'un texte."""
    normalized = unicodedata.normalize("NFKD", text)

    return "".join(
        char
        for char in normalized
        if not unicodedata.combining(char)
    )


def _normalize_col(col: str) -> str:
    """Normalise le nom d'une colonne."""
    return _strip_accents(str(col)).strip().lower()


def _map_columns(columns: list[str]) -> dict[str, str]:
    """Associe les champs du système aux colonnes du fichier."""

    normalized_cols = {
        original: _normalize_col(original)
        for original in columns
    }

    mapping: dict[str, str] = {}

    for field, aliases in COLUMN_ALIASES.items():

        normalized_aliases = {
            _normalize_col(alias)
            for alias in aliases
        }

        for original, normalized in normalized_cols.items():

            if normalized in normalized_aliases:
                mapping[field] = original
                break

    return mapping


def _normalize_phone(value: str | None) -> str:
    """
    Normalise un numéro de téléphone malgache.

    Exemples :

    0341234567      -> 0341234567
    341234567       -> 0341234567
    +261341234567   -> 0341234567
    261341234567    -> 0341234567
    034 12 34 567   -> 0341234567
    034-12-34-567   -> 0341234567

    Si la valeur ne correspond pas à un numéro malgache
    identifiable, elle est simplement nettoyée sans
    inventer de chiffres.
    """

    if value is None:
        return ""

    text = str(value).strip()

    if not text:
        return ""

    # Supprime les espaces, tirets, parenthèses, etc.
    digits = re.sub(r"\D", "", text)

    if not digits:
        return ""

    # Format international malgache :
    # +261 34 xxx xx xx
    if digits.startswith("261"):
        local_number = digits[3:]

        if len(local_number) == 9 and local_number.startswith(
            ("32", "33", "34")
        ):
            return "0" + local_number

    # Format local sans le 0 :
    # 34 xxx xx xx
    if len(digits) == 9 and digits.startswith(
        ("32", "33", "34")
    ):
        return "0" + digits

    # Format local normal :
    # 032..., 033..., 034...
    if len(digits) == 10 and digits.startswith(
        ("032", "033", "034")
    ):
        return digits

    # Si le numéro ne correspond pas aux formats
    # malgaches attendus, on conserve seulement les chiffres.
    return digits


def read_tabular_file(
    filename: str,
    content: bytes,
) -> pd.DataFrame:
    """
    Lit un fichier CSV, XLSX ou XLS.

    Toutes les colonnes sont lues comme texte afin de
    conserver les zéros situés au début des valeurs.
    """

    if "." not in filename:
        raise ValueError(
            "Le fichier ne possède pas d'extension."
        )

    ext = filename.rsplit(".", 1)[-1].lower()

    if ext == "csv":

        for sep in (",", ";", "\t"):

            try:
                df = pd.read_csv(
                    io.BytesIO(content),
                    sep=sep,
                    encoding="utf-8-sig",
                    dtype=str,
                    keep_default_na=False,
                )

                if df.shape[1] > 1:
                    return df

            except Exception:
                continue

        return pd.read_csv(
            io.BytesIO(content),
            sep=None,
            engine="python",
            encoding="utf-8-sig",
            dtype=str,
            keep_default_na=False,
        )

    if ext in ("xlsx", "xls"):

        return pd.read_excel(
            io.BytesIO(content),
            dtype=str,
        )

    raise ValueError(
        f"Format de fichier non supporté : .{ext}"
    )


def parse_records(
    filename: str,
    content: bytes,
) -> tuple[list[dict], int]:
    """
    Parse un fichier importé.

    Retourne :
    - la liste des enregistrements ;
    - le nombre de lignes réellement lues.
    """

    df = read_tabular_file(
        filename,
        content,
    )

    # Supprime les lignes complètement vides.
    df = df.dropna(how="all")

    mapping = _map_columns(
        list(df.columns)
    )

    records: list[dict] = []

    for _, row in df.iterrows():

        telephone = _cell(
            row,
            mapping.get("telephone"),
        )

        record = {
            "nom": (
                _cell(
                    row,
                    mapping.get("nom"),
                )
                or "Contact inconnu"
            ),
            "prenom": _cell(
                row,
                mapping.get("prenom"),
            ),
            "email": (
                _cell(
                    row,
                    mapping.get("email"),
                )
                or ""
            ),
            "telephone": _normalize_phone(
                telephone
            ),
            "adresse": (
                _cell(
                    row,
                    mapping.get("adresse"),
                )
                or ""
            ),
            "ville": (
                _cell(
                    row,
                    mapping.get("ville"),
                )
                or ""
            ),
            "sourceFile": filename,
        }

        # Ignore les lignes complètement vides.
        if any(
            value
            for key, value in record.items()
            if key != "sourceFile"
        ):
            records.append(record)

    return records, len(df)


def _cell(
    row: pd.Series,
    column: str | None,
) -> str | None:
    """
    Récupère proprement la valeur d'une cellule.

    Retourne None si la colonne ou la valeur est absente.
    """

    if not column or column not in row:
        return None

    value = row[column]

    if pd.isna(value):
        return None

    text = str(value).strip()

    return text or None