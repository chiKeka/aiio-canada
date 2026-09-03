from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from .registry import load_registry
from .schemas import ValidationError


POLICY_VERSION = "AIIO_SOURCE_FRESHNESS_0_1"


def _maximum_age_days(frequency: str) -> int:
    value = frequency.lower().strip()
    if "daily" in value or "continuous" in value:
        return 10
    if "monthly" in value:
        return 45
    if "quarter" in value:
        return 120
    if "annual" in value or "quinquennial" in value:
        return 400
    if any(token in value for token in ("event", "irregular", "ongoing", "periodic", "cycle", "dashboard", "methodology", "one-time", "discontinued")):
        return 190
    raise ValidationError(f"no freshness policy for update_frequency: {frequency!r}")


def build_source_freshness_report(
    registry_path: Path,
    as_of: str,
    output_path: Path | None = None,
) -> dict[str, Any]:
    try:
        report_date = date.fromisoformat(as_of)
    except ValueError as exc:
        raise ValidationError(f"as_of must be an ISO date: {as_of!r}") from exc

    sources = []
    by_domain: dict[str, dict[str, int]] = {}
    for source in sorted(load_registry(registry_path), key=lambda item: item.source_id):
        verified = date.fromisoformat(source.last_verified)
        age_days = (report_date - verified).days
        if age_days < 0:
            raise ValidationError(f"source {source.source_id} was verified after report date")
        maximum_age_days = _maximum_age_days(source.update_frequency)
        state = "current" if age_days <= maximum_age_days else "stale"
        record = {
            "source_id": source.source_id,
            "domain": source.domain,
            "registry_status": source.status.value,
            "last_verified": source.last_verified,
            "age_days": age_days,
            "maximum_age_days": maximum_age_days,
            "update_frequency": source.update_frequency,
            "freshness_state": state,
        }
        sources.append(record)
        domain = by_domain.setdefault(source.domain, {"source_count": 0, "current_count": 0, "stale_count": 0})
        domain["source_count"] += 1
        domain[f"{state}_count"] += 1

    stale = [source["source_id"] for source in sources if source["freshness_state"] == "stale"]
    report = {
        "schema_version": "1.0.0",
        "report_id": POLICY_VERSION,
        "as_of_date": as_of,
        "status": "operational" if not stale else "degraded",
        "source_count": len(sources),
        "current_count": len(sources) - len(stale),
        "stale_count": len(stale),
        "stale_source_ids": stale,
        "domain_summary": [
            {"domain": domain, **counts} for domain, counts in sorted(by_domain.items())
        ],
        "sources": sources,
        "methodology": {
            "basis": "calendar days since registry last_verified",
            "policy": "daily/continuous=10; monthly=45; quarterly=120; annual/quinquennial=400; event, irregular, periodic and documentary sources=190",
            "boundary": "Freshness confirms source verification cadence only. It does not authorize causal attribution or forecasts.",
        },
    }
    if output_path is not None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return report
