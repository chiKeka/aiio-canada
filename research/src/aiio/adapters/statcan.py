from __future__ import annotations

import csv
import hashlib
import io
import re
import zipfile
from pathlib import Path

from ..constants import EvidenceStatus
from ..schemas import ObservationRecord, ValidationError


def normalize_bcpi_alberta(zip_path: Path, output_path: Path) -> list[ObservationRecord]:
    """Normalize Alberta BCPI rows without erasing building/division detail."""
    with zipfile.ZipFile(zip_path) as archive:
        csv_names = [name for name in archive.namelist() if name.endswith(".csv") and "MetaData" not in name]
        if len(csv_names) != 1:
            raise ValidationError(f"expected one BCPI data CSV, found {csv_names}")
        csv_bytes = archive.read(csv_names[0])

    reader = csv.DictReader(io.StringIO(csv_bytes.decode("utf-8-sig")))
    rows = list(reader)
    required = {
        "REF_DATE",
        "GEO",
        "Type of building",
        "Division",
        "UOM",
        "VALUE",
    }
    if not reader.fieldnames or not required.issubset(reader.fieldnames):
        raise ValidationError(f"BCPI schema changed; missing {sorted(required - set(reader.fieldnames or []))}")

    observations: list[ObservationRecord] = []
    for raw in rows:
        geography = raw["GEO"].strip()
        if geography not in {"Calgary, Alberta", "Edmonton, Alberta"}:
            continue
        if not raw["VALUE"].strip():
            continue
        period_start, period_end = quarter_bounds(raw["REF_DATE"])
        building = raw["Type of building"].strip()
        division = raw["Division"].strip()
        identity = "|".join((raw["REF_DATE"], geography, building, division, raw["UOM"]))
        observation = ObservationRecord(
            observation_id=f"OBS_BCPI_{hashlib.sha256(identity.encode()).hexdigest()[:20].upper()}",
            indicator_id=f"BCPI_{slug(building)}_{slug(division)}",
            value=float(raw["VALUE"]),
            unit=raw["UOM"].strip(),
            geography_id="CMA_825" if geography.startswith("Calgary") else "CMA_835",
            period_start=period_start,
            period_end=period_end,
            source_id="STATCAN_BCPI_18100289",
            evidence_status=EvidenceStatus.OBSERVED,
            as_of_date=period_end,
            quality_flags=tuple(filter(None, (raw.get("STATUS", "").strip(), raw.get("SYMBOL", "").strip()))),
        )
        observation.validate()
        observations.append(observation)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=(
                "observation_id",
                "indicator_id",
                "value",
                "unit",
                "geography_id",
                "period_start",
                "period_end",
                "source_id",
                "evidence_status",
                "as_of_date",
                "transformation_id",
                "quality_flags",
            ),
        )
        writer.writeheader()
        for item in observations:
            writer.writerow(
                {
                    **item.__dict__,
                    "evidence_status": item.evidence_status.value,
                    "quality_flags": "|".join(item.quality_flags),
                }
            )
    return observations


def quarter_bounds(reference_period: str) -> tuple[str, str]:
    quarter_match = re.fullmatch(r"(\d{4})-Q([1-4])", reference_period)
    month_match = re.fullmatch(r"(\d{4})-(01|04|07|10)", reference_period)
    if quarter_match:
        year, quarter = int(quarter_match.group(1)), int(quarter_match.group(2))
    elif month_match:
        year = int(month_match.group(1))
        quarter = {"01": 1, "04": 2, "07": 3, "10": 4}[month_match.group(2)]
    else:
        raise ValidationError(f"unsupported quarterly period: {reference_period!r}")
    starts = {1: "01-01", 2: "04-01", 3: "07-01", 4: "10-01"}
    ends = {1: "03-31", 2: "06-30", 3: "09-30", 4: "12-31"}
    return f"{year}-{starts[quarter]}", f"{year}-{ends[quarter]}"


def slug(value: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "_", value.upper()).strip("_")
