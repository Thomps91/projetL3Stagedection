"""
Moteur de rapprochement / détection de doublons.

Techniques utilisées :
  - Distance de Levenshtein (textdistance) -> similarité orthographique
  - Jaro-Winkler (textdistance)            -> similarité orthographique,
    plus tolérante aux inversions locales de caractères
  - Codage phonétique (Soundex, implémenté ici en pur Python, adapté
    pour rester utilisable sur des noms malgaches/français une fois les
    accents supprimés) -> rapproche des noms qui se prononcent pareil
    mais s'écrivent différemment (ex: "Rakoto" / "Rakotto")

Le score final par paire d'enregistrements est une moyenne pondérée des
similarités par champ (nom, email, téléphone, adresse, ville), puis
classé en duplicate / uncertain / different selon des seuils
configurables (SEUIL_DOUBLON / SEUIL_INCERTAIN).
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from itertools import combinations

import textdistance

from app.core.config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# Normalisation
# ---------------------------------------------------------------------------

_WS_RE = re.compile(r"\s+")
_NON_ALNUM_RE = re.compile(r"[^a-z0-9\s]")
_NON_DIGIT_RE = re.compile(r"\D")


def strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(c for c in normalized if not unicodedata.combining(c))


def normalize_text(text: str | None) -> str:
    if not text:
        return ""
    text = strip_accents(text).lower()
    text = _NON_ALNUM_RE.sub(" ", text)
    text = _WS_RE.sub(" ", text).strip()
    return text


def normalize_phone(phone: str | None) -> str:
    """Ne garde que les chiffres et retire l'indicatif Madagascar (+261 / 0)."""
    if not phone:
        return ""
    digits = _NON_DIGIT_RE.sub("", phone)
    if digits.startswith("261"):
        digits = digits[3:]
    if digits.startswith("0"):
        digits = digits[1:]
    return digits


# ---------------------------------------------------------------------------
# Codage phonétique (Soundex)
# ---------------------------------------------------------------------------

_SOUNDEX_CODES = {
    **{c: "1" for c in "bfpv"},
    **{c: "2" for c in "cgjkqsxz"},
    **{c: "3" for c in "dt"},
    "l": "4",
    **{c: "5" for c in "mn"},
    "r": "6",
}


def soundex(word: str) -> str:
    """Implémentation classique du Soundex (indépendante de librairie externe)."""
    w = strip_accents(word).lower()
    w = re.sub(r"[^a-z]", "", w)
    if not w:
        return "0000"

    first_letter = w[0].upper()
    codes = [_SOUNDEX_CODES.get(c, "") for c in w]

    # Supprime les doublons consécutifs de code
    deduped = [codes[0]]
    for c in codes[1:]:
        if c != deduped[-1]:
            deduped.append(c)

    digits = "".join(c for c in deduped if c)[:]
    # Le premier code correspondant à la première lettre est déjà "consommé"
    if codes and codes[0]:
        digits = digits[1:] if digits.startswith(codes[0]) else digits

    digits = (digits + "000")[:3]
    return f"{first_letter}{digits}"


def phonetic_match(a: str, b: str) -> bool:
    """Compare les codes phonétiques token à token (au moins un token commun)."""
    tokens_a = {soundex(t) for t in normalize_text(a).split() if t}
    tokens_b = {soundex(t) for t in normalize_text(b).split() if t}
    if not tokens_a or not tokens_b:
        return False
    return bool(tokens_a & tokens_b)


# ---------------------------------------------------------------------------
# Similarité de chaînes
# ---------------------------------------------------------------------------

_jaro_winkler = textdistance.JaroWinkler()


def string_similarity(a: str, b: str) -> float:
    """Similarité 0-1 combinant Levenshtein (normalisé) et Jaro-Winkler."""
    na, nb = normalize_text(a), normalize_text(b)
    if not na and not nb:
        return 1.0
    if not na or not nb:
        return 0.0
    if na == nb:
        return 1.0

    max_len = max(len(na), len(nb))
    levenshtein_sim = 1 - (textdistance.levenshtein(na, nb) / max_len)
    jw_sim = _jaro_winkler.normalized_similarity(na, nb)

    return max(0.0, (0.5 * levenshtein_sim) + (0.5 * jw_sim))


def name_similarity(a: str, b: str) -> float:
    """
    Similarité de noms, tolérante à l'inversion de mots
    (ex: "Jean Rakoto" vs "Rakoto Jean") et boostée par le phonétique.
    """
    direct = string_similarity(a, b)

    tokens_a = sorted(normalize_text(a).split())
    tokens_b = sorted(normalize_text(b).split())
    reordered = string_similarity(" ".join(tokens_a), " ".join(tokens_b))

    base = max(direct, reordered)

    if phonetic_match(a, b) and base < 0.97:
        base = min(1.0, base + 0.08)

    return base


def phone_similarity(a: str, b: str) -> float:
    na, nb = normalize_phone(a), normalize_phone(b)
    if not na and not nb:
        return 1.0
    if not na or not nb:
        return 0.0
    if na == nb:
        return 1.0
    max_len = max(len(na), len(nb))
    return max(0.0, 1 - (textdistance.levenshtein(na, nb) / max_len))


# ---------------------------------------------------------------------------
# Comparaison d'une paire d'enregistrements
# ---------------------------------------------------------------------------

# (clé, libellé affiché côté frontend, poids, fonction de similarité)
FIELD_WEIGHTS: list[tuple[str, str, float]] = [
    ("nom", "Nom complet", 0.35),
    ("email", "Email", 0.25),
    ("telephone", "Téléphone", 0.20),
    ("adresse", "Adresse", 0.12),
    ("ville", "Ville", 0.08),
]

FIELD_MATCH_THRESHOLD = 0.70  # similarité à partir de laquelle un champ est "isMatch"


@dataclass
class FieldComparisonResult:
    field: str
    label: str
    val_a: str
    val_b: str
    is_match: bool
    similarity: int


@dataclass
class MatchResult:
    record_a_id: str
    record_b_id: str
    score: int
    status: str
    status_label: str
    field_comparisons: list[FieldComparisonResult] = field(default_factory=list)


def _full_name(record: dict) -> str:
    parts = [record.get("nom") or "", record.get("prenom") or ""]
    return " ".join(p for p in parts if p).strip()


def compare_records(a: dict, b: dict) -> MatchResult:
    comparisons: list[FieldComparisonResult] = []
    weighted_sum = 0.0

    for key, label, weight in FIELD_WEIGHTS:
        val_a = str(a.get(key) or "")
        val_b = str(b.get(key) or "")

        if key == "nom":
            sim = name_similarity(_full_name(a), _full_name(b))
        elif key == "telephone":
            sim = phone_similarity(val_a, val_b)
        else:
            sim = string_similarity(val_a, val_b)

        sim_pct = round(sim * 100)
        comparisons.append(
            FieldComparisonResult(
                field=key,
                label=label,
                val_a=val_a,
                val_b=val_b,
                is_match=sim >= FIELD_MATCH_THRESHOLD,
                similarity=sim_pct,
            )
        )
        weighted_sum += sim * weight

    score = round(weighted_sum * 100)
    status, status_label = classify_score(score)

    return MatchResult(
        record_a_id=a["id"],
        record_b_id=b["id"],
        score=score,
        status=status,
        status_label=status_label,
        field_comparisons=comparisons,
    )


def classify_score(
    score: int,
    seuil_doublon: int | None = None,
    seuil_incertain: int | None = None,
) -> tuple[str, str]:
    seuil_doublon = seuil_doublon if seuil_doublon is not None else settings.SEUIL_DOUBLON
    seuil_incertain = seuil_incertain if seuil_incertain is not None else settings.SEUIL_INCERTAIN

    if score >= seuil_doublon:
        return "duplicate", "Doublon probable"
    if score >= seuil_incertain:
        return "uncertain", "Cas incertain"
    return "different", "Différent"


# ---------------------------------------------------------------------------
# Blocage (pour limiter le nombre de comparaisons sur de gros volumes)
# ---------------------------------------------------------------------------

def _block_key(record: dict) -> str:
    """
    Clé de blocage : code phonétique du premier token du nom.
    Deux enregistrements ne sont comparés que s'ils partagent au moins
    une clé de blocage (évite le O(n²) complet sur de gros volumes tout
    en restant tolérant aux fautes de frappe sur le premier caractère).
    """
    tokens = sorted(normalize_text(_full_name(record)).split())
    if not tokens:
        return "∅"
    return soundex(tokens[0])


def build_candidate_pairs(records: list[dict]) -> set[tuple[int, int]]:
    """Retourne les index de paires candidates (i < j) à comparer."""
    blocks: dict[str, list[int]] = {}
    for idx, rec in enumerate(records):
        blocks.setdefault(_block_key(rec), []).append(idx)

    pairs: set[tuple[int, int]] = set()
    for indices in blocks.values():
        for i, j in combinations(indices, 2):
            pairs.add((i, j) if i < j else (j, i))

    # Filet de sécurité : pour de petits volumes, on compare aussi tout le
    # monde entre eux (le blocage sert surtout à partir de quelques
    # centaines d'enregistrements).
    if len(records) <= 400:
        for i, j in combinations(range(len(records)), 2):
            pairs.add((i, j))

    return pairs


def find_matches(
    records: list[dict],
    seuil_incertain: int | None = None,
) -> list[MatchResult]:
    """
    Compare les enregistrements deux à deux (via blocage) et ne conserve
    que les paires dont le score dépasse le seuil "incertain" (les paires
    clairement différentes ne sont pas remontées pour éviter d'inonder
    l'utilisateur).
    """
    seuil = seuil_incertain if seuil_incertain is not None else settings.SEUIL_INCERTAIN
    pairs = build_candidate_pairs(records)

    results: list[MatchResult] = []
    for i, j in pairs:
        result = compare_records(records[i], records[j])
        if result.score >= seuil:
            results.append(result)

    results.sort(key=lambda r: r.score, reverse=True)
    return results
