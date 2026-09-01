from __future__ import annotations

import csv
import hashlib
import io
import json
import re
import unicodedata
import urllib.request
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any

from .schemas import ValidationError


CATALOG_SOURCE_ID = "QUEBEC_PQI_ARCHIVE_CATALOG"
DASHBOARD_SOURCE_ID = "QUEBEC_PQI_PROJECT_DASHBOARD"
THRESHOLD_CHANGE_DATE = date(2020, 11, 1)
DATASET_ID = "67d85a7a-10af-4af0-b4da-abc64cfd735a"
MONTHS = {
    "janvier": 1,
    "fevrier": 2,
    "mars": 3,
    "avril": 4,
    "mai": 5,
    "juin": 6,
    "juillet": 7,
    "aout": 8,
    "septembre": 9,
    "octobre": 10,
    "novembre": 11,
    "decembre": 12,
}
NAME_DATE_PATTERN = re.compile(
    r"tableau de bord en date du\s+(?P<day>\d{1,2}|1er)\s+"
    r"(?P<month>[a-z]+)(?:\s+(?P<year>\d{4}))?\s*$",
    re.IGNORECASE,
)
URL_YEAR_PATTERN = re.compile(r"(?P<year>20\d{2})[-_]?\d{2}[-_]?\d{2}")
REQUIRED_DASHBOARD_FIELDS = {
    "no_projet",
    "nom_projet",
    "cout_total",
    "date_fin_mise_en_service",
    "etat_avancement",
    "suivi_modifications",
    "secteur_activite",
    "region",
    "localisation",
    "nature_travaux",
}


def sha256_bytes(content: bytes) -> str:
    return f"sha256:{hashlib.sha256(content).hexdigest()}"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return f"sha256:{digest.hexdigest()}"


def _normalize_french(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    return "".join(character for character in decomposed if not unicodedata.combining(character))


def parse_snapshot_date(resource: dict[str, Any]) -> date:
    normalized_name = _normalize_french(str(resource.get("name", "")).strip()).lower()
    match = NAME_DATE_PATTERN.fullmatch(normalized_name)
    if match is None:
        raise ValidationError(f"unparseable Quebec dashboard resource date: {resource.get('name')!r}")
    month_name = match.group("month")
    if month_name not in MONTHS:
        raise ValidationError(f"unknown French month in resource name: {month_name!r}")
    year_text = match.group("year")
    if year_text is None:
        url_match = URL_YEAR_PATTERN.search(str(resource.get("url", "")))
        if url_match is None:
            raise ValidationError("resource name omits year and URL does not supply one")
        year_text = url_match.group("year")
    day_text = match.group("day")
    return date(int(year_text), MONTHS[month_name], 1 if day_text == "1er" else int(day_text))


def verify_catalog_retrieval(catalog_path: Path) -> dict[str, Any]:
    manifest_path = catalog_path.with_suffix(catalog_path.suffix + ".manifest.json")
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        payload = json.loads(catalog_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValidationError(f"unable to read Quebec archive catalog retrieval: {exc}") from exc
    if manifest.get("source_id") != CATALOG_SOURCE_ID:
        raise ValidationError("Quebec archive catalog manifest source_id mismatch")
    if manifest.get("content_hash") != sha256_file(catalog_path):
        raise ValidationError("Quebec archive catalog hash mismatch")
    if payload.get("success") is not True or not isinstance(payload.get("result"), dict):
        raise ValidationError("Quebec archive catalog API response is unsuccessful")
    return payload


def inventory_csv_resources(catalog_payload: dict[str, Any]) -> list[dict[str, Any]]:
    resources = catalog_payload.get("result", {}).get("resources", [])
    if not isinstance(resources, list):
        raise ValidationError("Quebec archive catalog resources must be a list")
    inventory: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for resource in resources:
        if not isinstance(resource, dict) or str(resource.get("format", "")).upper() != "CSV":
            continue
        resource_id = str(resource.get("id", "")).strip()
        url = str(resource.get("url", "")).strip()
        if not resource_id or resource_id in seen_ids:
            raise ValidationError("Quebec archive catalog has a missing or duplicate CSV resource ID")
        if DATASET_ID not in url or not url.startswith("https://www.donneesquebec.ca/"):
            raise ValidationError(f"unexpected Quebec dashboard resource URL: {url!r}")
        seen_ids.add(resource_id)
        snapshot_date = parse_snapshot_date(resource)
        inventory.append(
            {
                "resource_id": resource_id,
                "resource_name": str(resource.get("name", "")).strip(),
                "snapshot_date": snapshot_date.isoformat(),
                "created": resource.get("created"),
                "last_modified": resource.get("last_modified"),
                "url": url,
                "threshold_regime": (
                    "cad_50m_and_over"
                    if snapshot_date < THRESHOLD_CHANGE_DATE
                    else "cad_20m_and_over"
                ),
            }
        )
    inventory.sort(key=lambda item: (item["snapshot_date"], item["resource_id"]))
    dates = [item["snapshot_date"] for item in inventory]
    if not inventory or len(dates) != len(set(dates)):
        raise ValidationError("Quebec CSV resource snapshot dates must be unique")
    return inventory


def select_milestone_resources(inventory: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not inventory:
        raise ValidationError("cannot select Quebec milestones from an empty inventory")
    dated = [(date.fromisoformat(item["snapshot_date"]), item) for item in inventory]
    pre_threshold = [pair for pair in dated if pair[0] < THRESHOLD_CHANGE_DATE]
    post_threshold = [pair for pair in dated if pair[0] >= THRESHOLD_CHANGE_DATE]
    if not pre_threshold or not post_threshold:
        raise ValidationError("Quebec archive must span both publication-threshold regimes")

    selected_by_id: dict[str, tuple[dict[str, Any], set[str]]] = {}

    def include(item: dict[str, Any], reason: str) -> None:
        existing = selected_by_id.setdefault(item["resource_id"], (item, set()))
        existing[1].add(reason)

    include(dated[0][1], "earliest_official_csv")
    include(pre_threshold[-1][1], "last_pre_threshold_snapshot")
    include(post_threshold[0][1], "first_post_threshold_snapshot")
    years = sorted({snapshot_date.year for snapshot_date, _ in dated})
    for year in years:
        year_items = [pair for pair in dated if pair[0].year == year]
        include(year_items[-1][1], "latest_snapshot_in_calendar_year")
    include(dated[-1][1], "latest_official_csv")

    output: list[dict[str, Any]] = []
    for item, reasons in sorted(
        selected_by_id.values(), key=lambda pair: pair[0]["snapshot_date"]
    ):
        output.append({**item, "selection_reasons": sorted(reasons)})
    return output


def milestone_candidate_slots(
    inventory: list[dict[str, Any]],
) -> list[tuple[str, list[dict[str, Any]]]]:
    if not inventory:
        raise ValidationError("cannot select Quebec milestones from an empty inventory")
    dated = [(date.fromisoformat(item["snapshot_date"]), item) for item in inventory]
    pre_threshold = [pair for pair in dated if pair[0] < THRESHOLD_CHANGE_DATE]
    post_threshold = [pair for pair in dated if pair[0] >= THRESHOLD_CHANGE_DATE]
    if not pre_threshold or not post_threshold:
        raise ValidationError("Quebec archive must span both publication-threshold regimes")
    slots: list[tuple[str, list[dict[str, Any]]]] = [
        ("earliest_official_csv", [item for _, item in dated]),
        (
            "last_pre_threshold_snapshot",
            [item for _, item in reversed(pre_threshold)],
        ),
        ("first_post_threshold_snapshot", [item for _, item in post_threshold]),
    ]
    for year in sorted({snapshot_date.year for snapshot_date, _ in dated}):
        year_items = [item for snapshot_date, item in dated if snapshot_date.year == year]
        slots.append(
            (f"latest_schema_valid_snapshot_in_{year}", list(reversed(year_items)))
        )
    slots.append(("latest_official_csv", [item for _, item in reversed(dated)]))
    return slots


def retrieve_milestone_resources(
    catalog_path: Path,
    raw_root: Path,
    contract_path: Path,
) -> dict[str, Any]:
    payload = verify_catalog_retrieval(catalog_path)
    inventory = inventory_csv_resources(payload)
    raw_root.mkdir(parents=True, exist_ok=True)
    retrieved_by_id: dict[str, tuple[dict[str, Any], dict[str, Any], set[str]]] = {}
    rejected_by_id: dict[str, dict[str, Any]] = {}
    for reason, candidates in milestone_candidate_slots(inventory):
        selected_for_slot = False
        for item in candidates:
            if item["resource_id"] in retrieved_by_id:
                retrieved_by_id[item["resource_id"]][2].add(reason)
                selected_for_slot = True
                break
            if item["resource_id"] in rejected_by_id:
                continue
            try:
                record = _retrieve_resource(item, raw_root)
            except ValidationError as exc:
                rejected_by_id[item["resource_id"]] = {
                    "resource_id": item["resource_id"],
                    "resource_name": item["resource_name"],
                    "snapshot_date": item["snapshot_date"],
                    "url": item["url"],
                    "reason": str(exc),
                }
                continue
            retrieved_by_id[item["resource_id"]] = (item, record, {reason})
            selected_for_slot = True
            break
        if not selected_for_slot:
            raise ValidationError(f"no schema-valid Quebec resource satisfies slot: {reason}")
    retrieved = [
        {**item, **record, "selection_reasons": sorted(reasons)}
        for item, record, reasons in sorted(
            retrieved_by_id.values(), key=lambda triple: triple[0]["snapshot_date"]
        )
    ]

    result = {
        "schema_version": "1.0.0",
        "contract_id": "AIIO_QUEBEC_PQI_MILESTONE_VINTAGES_0_1",
        "catalog_source_id": CATALOG_SOURCE_ID,
        "dashboard_source_id": DASHBOARD_SOURCE_ID,
        "catalog_content_hash": sha256_file(catalog_path),
        "catalog_csv_resource_count": len(inventory),
        "catalog_start_date": inventory[0]["snapshot_date"],
        "catalog_end_date": inventory[-1]["snapshot_date"],
        "threshold_change_date": THRESHOLD_CHANGE_DATE.isoformat(),
        "selection_rule": {
            "earliest_official_csv": True,
            "last_pre_threshold_snapshot": True,
            "first_post_threshold_snapshot": True,
            "latest_snapshot_in_each_calendar_year": True,
            "schema_invalid_candidates_fall_back_with_audit_record": True,
            "latest_official_csv": True,
            "complete_monthly_panel": False,
        },
        "selected_vintage_count": len(retrieved),
        "selected_vintages": retrieved,
        "rejected_candidate_count": len(rejected_by_id),
        "rejected_candidates": sorted(
            rejected_by_id.values(), key=lambda item: item["snapshot_date"]
        ),
        "publication_boundary": {
            "longitudinal_outcome_panel_authorized": False,
            "attrition_interpretation_authorized": False,
            "ai_attributable_effect_authorized": False,
            "status": "milestone_vintage_research_candidate",
            "reason": "The milestone design can reveal entry, persistence and interval disappearance across official snapshots, including the November 2020 threshold change, but it is not the complete 69-vintage panel and disappearance does not identify completion, cancellation or another exit cause.",
        },
    }
    contract_path.parent.mkdir(parents=True, exist_ok=True)
    contract_path.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return result


def _retrieve_resource(item: dict[str, Any], raw_root: Path) -> dict[str, Any]:
    request = urllib.request.Request(
        item["url"],
        headers={"User-Agent": "AIIO-Canada-Research/0.1 (+public research retrieval)"},
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        content = response.read()
        effective_url = response.geturl()
        content_type = response.headers.get_content_type()
    if effective_url != item["url"]:
        raise ValidationError("Quebec milestone resource redirected unexpectedly")
    text = _decode_csv(content)
    delimiter = ";" if text.splitlines()[0].count(";") > text.splitlines()[0].count(",") else ","
    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    rows = list(reader)
    normalized_fields = {field.strip() for field in (reader.fieldnames or [])}
    missing_fields = REQUIRED_DASHBOARD_FIELDS - normalized_fields
    if not rows or missing_fields:
        raise ValidationError(
            "Quebec milestone CSV schema is incomplete "
            f"for {item['snapshot_date']}: missing {sorted(missing_fields)}"
        )
    digest = sha256_bytes(content)
    destination = raw_root / f"{item['snapshot_date']}_{digest.split(':', 1)[1][:12]}.csv"
    manifest_path = destination.with_suffix(".csv.manifest.json")
    if destination.exists() and sha256_file(destination) != digest:
        raise ValidationError(f"existing Quebec milestone archive hash mismatch: {destination}")
    if not destination.exists():
        destination.write_bytes(content)
    retrieved_at = datetime.now(UTC).replace(microsecond=0).isoformat()
    if manifest_path.exists():
        existing_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if existing_manifest.get("content_hash") != digest:
            raise ValidationError(f"existing Quebec milestone manifest hash mismatch: {manifest_path}")
        retrieved_at = existing_manifest["retrieved_at"]
    manifest = {
        "retrieval_id": f"RET_{DASHBOARD_SOURCE_ID}_{item['resource_id'].replace('-', '')[:12]}",
        "source_id": DASHBOARD_SOURCE_ID,
        "archive_catalog_source_id": CATALOG_SOURCE_ID,
        "resource_id": item["resource_id"],
        "resource_name": item["resource_name"],
        "snapshot_date": item["snapshot_date"],
        "threshold_regime": item["threshold_regime"],
        "retrieved_at": retrieved_at,
        "effective_url": effective_url,
        "content_hash": digest,
        "content_type": content_type,
        "byte_length": len(content),
        "row_count": len(rows),
        "archive_path": str(destination),
        "result": "success",
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return {
        "archive_path": str(destination),
        "manifest_path": str(manifest_path),
        "content_hash": digest,
        "byte_length": len(content),
        "row_count": len(rows),
        "retrieved_at": retrieved_at,
    }


def _decode_csv(content: bytes) -> str:
    for encoding in ("utf-8-sig", "cp1252"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValidationError("Quebec milestone CSV is not valid UTF-8 or CP1252")
