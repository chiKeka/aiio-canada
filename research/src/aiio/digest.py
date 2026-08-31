from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from .constants import EvidenceStatus
from .schemas import ValidationError


def build_digest(items_path: Path, output_path: Path, edition_date: date) -> None:
    payload = json.loads(items_path.read_text(encoding="utf-8"))
    items: list[dict[str, Any]] = payload.get("items", [])
    if not items:
        raise ValidationError("digest requires at least one evidence item")
    for index, item in enumerate(items, start=1):
        missing = [
            key
            for key in ("headline", "source_id", "source_url", "observed_change", "model_implication", "evidence_status")
            if not item.get(key)
        ]
        if missing:
            raise ValidationError(f"digest item {index} is missing: {', '.join(missing)}")
        if EvidenceStatus(item["evidence_status"]) in {EvidenceStatus.ASSUMED, EvidenceStatus.SCENARIO}:
            raise ValidationError("weekly evidence items cannot present assumptions or scenarios as new evidence")

    lines = [
        f"# AIIO Canada weekly evidence digest — {edition_date.isoformat()}",
        "",
        "> New public evidence and its possible model implications. Implications are research notes, not findings, until incorporated into a reviewed release.",
        "",
    ]
    for item in items:
        lines.extend(
            [
                f"## {item['headline']}",
                "",
                f"**Evidence status:** `{item['evidence_status']}`  ",
                f"**Source:** [{item['source_id']}]({item['source_url']})",
                "",
                f"**Observed change:** {item['observed_change']}",
                "",
                f"**Potential model implication:** {item['model_implication']}",
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
