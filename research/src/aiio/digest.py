from __future__ import annotations

import hashlib
import json
from datetime import date
from pathlib import Path
from typing import Any

from .constants import EvidenceStatus
from .schemas import ValidationError


ALLOWED_DIGEST_STATUSES = {"draft", "review", "approved"}
ALLOWED_MODEL_ACTIONS = {"no_change", "review_candidate", "promote_after_release"}
EVIDENCE_ONLY_STATUSES = {
    EvidenceStatus.OBSERVED,
    EvidenceStatus.CORROBORATED,
    EvidenceStatus.INFERRED,
}


def build_digest(
    items_path: Path,
    output_path: Path,
    edition_date: date,
    *,
    source_registry_path: Path | None = None,
    manifest_path: Path | None = None,
) -> dict[str, Any]:
    payload = json.loads(items_path.read_text(encoding="utf-8"))
    registry = load_registry(source_registry_path) if source_registry_path else None
    items: list[dict[str, Any]] = payload.get("items", [])
    if not items:
        raise ValidationError("digest requires at least one evidence item")

    item_ids: set[str] = set()
    normalized_items = []
    for index, item in enumerate(items, start=1):
        normalized = validate_item(item, index=index, registry=registry)
        if normalized["item_id"] in item_ids:
            raise ValidationError(
                f"digest item_id must be unique: {normalized['item_id']}"
            )
        item_ids.add(normalized["item_id"])
        normalized_items.append(normalized)

    payload_date = payload.get("edition_date")
    if payload_date != edition_date.isoformat():
        raise ValidationError(
            "digest edition_date must match the requested output date: "
            f"{payload_date!r} != {edition_date.isoformat()!r}"
        )
    status = payload.get("status")
    if status not in ALLOWED_DIGEST_STATUSES:
        raise ValidationError(
            "digest status must be one of: " + ", ".join(sorted(ALLOWED_DIGEST_STATUSES))
        )

    lines = [
        f"# AIIO Canada weekly evidence digest — {edition_date.isoformat()}",
        "",
        f"> Edition status: `{status}`. New public evidence and its possible model implications. Implications are research notes, not findings, until incorporated into a reviewed release.",
        "",
    ]
    for item in normalized_items:
        source_links = ", ".join(
            f"[{source['source_id']}]({source['source_url']})"
            for source in item["sources"]
        )
        geography = ", ".join(item["geography_ids"]) or "not specified"
        lines.extend(
            [
                f"## {item['headline']}",
                "",
                f"- **Item ID:** `{item['item_id']}`",
                f"- **Evidence status:** `{item['evidence_status']}`",
                f"- **Geography:** `{geography}`",
                f"- **Sources:** {source_links}",
                "",
                f"**Observed or inferred change:** {item['observed_change']}",
                "",
                f"**Potential model implication:** {item['model_implication']}",
                "",
                f"**Model action:** `{item['model_action']}` — no automatic parameter or baseline change.",
                "",
            ]
        )
    lines.extend(
        [
            "## Release note",
            "",
            "No model value changes automatically from a digest item. Promotion into the baseline requires schema validation, evidence review and a versioned release.",
            "",
        ]
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines), encoding="utf-8")

    registry_hash = sha256_file(source_registry_path) if source_registry_path else None
    manifest = {
        "schema_version": "1.0.0",
        "digest_id": payload.get(
            "digest_id", f"AIIO_DIGEST_{edition_date.isoformat().replace('-', '_')}"
        ),
        "edition_date": edition_date.isoformat(),
        "status": status,
        "automatic_model_change": False,
        "item_count": len(normalized_items),
        "item_ids": [item["item_id"] for item in normalized_items],
        "source_ids": sorted(
            {
                source["source_id"]
                for item in normalized_items
                for source in item["sources"]
            }
        ),
        "items_sha256": sha256_file(items_path),
        "markdown_sha256": sha256_file(output_path),
        "source_registry_sha256": registry_hash,
        "publication_boundary": {
            "model_parameters_changed": False,
            "baseline_changed": False,
            "release_required_for_promotion": True,
        },
    }
    resolved_manifest_path = manifest_path or output_path.with_suffix(".manifest.json")
    resolved_manifest_path.write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    return manifest


def validate_item(
    item: dict[str, Any],
    *,
    index: int,
    registry: dict[str, dict[str, Any]] | None,
) -> dict[str, Any]:
    missing = [
        key
        for key in (
            "headline",
            "observed_change",
            "model_implication",
            "evidence_status",
        )
        if not item.get(key)
    ]
    if missing:
        raise ValidationError(f"digest item {index} is missing: {', '.join(missing)}")

    try:
        evidence_status = EvidenceStatus(item["evidence_status"])
    except ValueError as exc:
        raise ValidationError(
            f"digest item {index} has an invalid evidence_status"
        ) from exc
    if evidence_status not in EVIDENCE_ONLY_STATUSES:
        raise ValidationError(
            "weekly evidence items cannot present assumptions or scenarios as new evidence"
        )

    sources = item.get("sources")
    if sources is None and item.get("source_id") and item.get("source_url"):
        sources = [
            {"source_id": item["source_id"], "source_url": item["source_url"]}
        ]
    if not isinstance(sources, list) or not sources:
        raise ValidationError(f"digest item {index} requires at least one source")
    normalized_sources = []
    seen_sources: set[str] = set()
    for source in sources:
        if not isinstance(source, dict) or not source.get("source_id") or not source.get(
            "source_url"
        ):
            raise ValidationError(
                f"digest item {index} has an incomplete source reference"
            )
        source_id = source["source_id"]
        if source_id in seen_sources:
            raise ValidationError(
                f"digest item {index} repeats source_id {source_id}"
            )
        seen_sources.add(source_id)
        if registry is not None:
            registered = registry.get(source_id)
            if registered is None:
                raise ValidationError(
                    f"digest item {index} references unknown source_id {source_id}"
                )
            if source["source_url"] != registered["canonical_url"]:
                raise ValidationError(
                    f"digest item {index} source URL does not match registry for {source_id}"
                )
        normalized_sources.append(
            {"source_id": source_id, "source_url": source["source_url"]}
        )

    item_id = item.get("item_id") or f"DIGEST_ITEM_{index:02d}"
    model_action = item.get("model_action", "no_change")
    if model_action not in ALLOWED_MODEL_ACTIONS:
        raise ValidationError(
            f"digest item {index} has an invalid model_action: {model_action}"
        )
    if item.get("automatic_model_change") not in (None, False):
        raise ValidationError(
            f"digest item {index} cannot authorize an automatic model change"
        )
    geography_ids = item.get("geography_ids", [])
    if not isinstance(geography_ids, list) or any(
        not isinstance(value, str) or not value for value in geography_ids
    ):
        raise ValidationError(
            f"digest item {index} geography_ids must be a list of identifiers"
        )

    return {
        "item_id": item_id,
        "headline": item["headline"],
        "sources": normalized_sources,
        "observed_change": item["observed_change"],
        "model_implication": item["model_implication"],
        "evidence_status": evidence_status.value,
        "geography_ids": geography_ids,
        "model_action": model_action,
    }


def validate_digest_cadence(
    items_dir: Path,
    *,
    as_of_date: date,
    max_age_days: int = 8,
) -> dict[str, Any]:
    if max_age_days < 1:
        raise ValidationError("digest cadence max_age_days must be positive")
    editions = []
    for path in sorted(items_dir.glob("*.json")):
        try:
            filename_date = date.fromisoformat(path.stem)
        except ValueError:
            continue
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload.get("edition_date") != filename_date.isoformat():
            raise ValidationError(
                f"digest filename and edition_date disagree: {path.name}"
            )
        editions.append((filename_date, path))
    if not editions:
        raise ValidationError("no dated digest item files found")
    latest_date, latest_path = max(editions)
    age_days = (as_of_date - latest_date).days
    if age_days < 0:
        raise ValidationError("latest digest edition is dated after the audit date")
    if age_days > max_age_days:
        raise ValidationError(
            f"weekly digest is stale: latest edition is {age_days} days old"
        )
    return {
        "status": "current",
        "as_of_date": as_of_date.isoformat(),
        "latest_edition": latest_date.isoformat(),
        "latest_items_path": str(latest_path),
        "age_days": age_days,
        "max_age_days": max_age_days,
    }


def load_registry(path: Path) -> dict[str, dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    sources = payload.get("sources", [])
    return {source["source_id"]: source for source in sources}


def sha256_file(path: Path) -> str:
    return f"sha256:{hashlib.sha256(path.read_bytes()).hexdigest()}"
