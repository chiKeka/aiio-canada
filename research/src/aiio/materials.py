from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any

from .schemas import ValidationError


ARCHETYPES = {
    "industrial_factory_proxy": "BCPI_FACTORY_",
    "institutional_buildings": "BCPI_INSTITUTIONAL_BUILDINGS_62213_",
    "schools": "BCPI_SCHOOL_",
    "municipal_operations_bus_depot": (
        "BCPI_BUS_DEPOT_WITH_MAINTENANCE_AND_REPAIR_FACILITIES_"
    ),
}
COMPONENT_SUFFIXES = {
    "concrete": "CONCRETE",
    "structural_steel_framing": "STRUCTURAL_STEEL_FRAMING",
    "electrical_systems": "ELECTRICAL",
    "hvac": "HEATING_VENTILATION_AND_AIR_CONDITIONING",
}


def percent_change(current: float, previous: float | None) -> float | None:
    if previous in (None, 0):
        return None
    return round((current / previous - 1) * 100, 3)


def run_material_cost_screen(
    bcpi_path: Path,
    output_json_path: Path,
    output_csv_path: Path,
) -> dict[str, Any]:
    with bcpi_path.open(encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise ValidationError("BCPI material-cost screen cannot use an empty input")

    targets: dict[str, tuple[str, str]] = {}
    for archetype, prefix in ARCHETYPES.items():
        for component, suffix in COMPONENT_SUFFIXES.items():
            targets[f"{prefix}{suffix}"] = (archetype, component)

    grouped: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    for item in rows:
        if item["indicator_id"] in targets:
            grouped[(item["geography_id"], item["indicator_id"])].append(item)

    expected = 2 * len(targets)
    if len(grouped) != expected:
        raise ValidationError(
            f"BCPI material screen expected {expected} Calgary/Edmonton series, found {len(grouped)}"
        )

    observations = []
    for (geography_id, indicator_id), items in sorted(grouped.items()):
        ordered = sorted(items, key=lambda item: item["period_end"])
        latest = ordered[-1]
        latest_date = date.fromisoformat(latest["period_end"])
        year_ago_date = latest_date.replace(year=latest_date.year - 1).isoformat()
        year_ago = next(
            (item for item in ordered if item["period_end"] == year_ago_date), None
        )
        prior_quarter = ordered[-2] if len(ordered) >= 2 else None
        current_value = float(latest["value"])
        prior_value = float(prior_quarter["value"]) if prior_quarter else None
        year_ago_value = float(year_ago["value"]) if year_ago else None
        archetype, component = targets[indicator_id]
        observations.append(
            {
                "geography_id": geography_id,
                "archetype": archetype,
                "component": component,
                "indicator_id": indicator_id,
                "period_end": latest["period_end"],
                "index_value": current_value,
                "unit": latest["unit"],
                "index_points_since_2023_base": round(current_value - 100, 3),
                "previous_quarter_period_end": (
                    prior_quarter["period_end"] if prior_quarter else None
                ),
                "previous_quarter_index": prior_value,
                "quarter_over_quarter_percent_change": percent_change(
                    current_value, prior_value
                ),
                "year_ago_period_end": year_ago_date,
                "year_ago_index": year_ago_value,
                "year_over_year_percent_change": percent_change(
                    current_value, year_ago_value
                ),
                "source_id": latest["source_id"],
                "source_evidence_status": latest["evidence_status"],
                "change_evidence_status": "inferred",
                "quality_flags": [
                    flag for flag in latest["quality_flags"].split("|") if flag
                ],
            }
        )

    period_end = max(item["period_end"] for item in observations)
    if {item["period_end"] for item in observations} != {period_end}:
        raise ValidationError("BCPI material screen latest periods do not align")

    result = {
        "model_id": "AIIO_AB_BCPI_MATERIAL_COST_SCREEN_0_1",
        "geography_scope": ["CMA_825", "CMA_835"],
        "period_end": period_end,
        "source_id": "STATCAN_BCPI_18100289",
        "evidence_status": "observed_with_inferred_changes",
        "observation_count": len(observations),
        "observations": observations,
        "limitations": [
            "The industrial factory series is a public BCPI archetype proxy, not a data-centre construction index.",
            "BCPI divisions measure contractor bid-price change for model buildings; they are not commodity spot prices, quantities, lead times or local production capacity.",
            "Index levels and changes do not identify AI-caused effects. They describe a shared construction-cost baseline only.",
            "Calgary and Edmonton are separate CMAs and are not substituted for all Alberta regions.",
        ],
    }
    output_json_path.parent.mkdir(parents=True, exist_ok=True)
    output_json_path.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    output_csv_path.parent.mkdir(parents=True, exist_ok=True)
    fields = list(observations[0].keys())
    with output_csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for item in observations:
            writer.writerow({**item, "quality_flags": "|".join(item["quality_flags"])})
    return result
