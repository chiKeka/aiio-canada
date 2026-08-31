from __future__ import annotations

import csv
import hashlib
import io
import re
from contextlib import closing
from io import TextIOWrapper
import zipfile
from pathlib import Path

from ..constants import EvidenceStatus
from ..schemas import ObservationRecord, ValidationError


ALBERTA_TRADE_NOC_TO_NODE = {
    "72200": "trade_electricians",
    "72201": "trade_electricians",
    "72202": "trade_power_line",
    "72203": "trade_power_line",
    "72402": "trade_hvac",
    "73100": "trade_concrete",
}

JVWS_STATISTICS = {"Job vacancies", "Average offered hourly wage"}
JVWS_TRANSFORMATION_ID = "TR_STATCAN_JVWS_AB_NOC_1_0_0"


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


def normalize_jvws_alberta(zip_path: Path, output_path: Path) -> list[ObservationRecord]:
    """Normalize Alberta vacancy and offered-wage rows for graph-relevant trades.

    Statistics Canada suppression and quality codes are retained. A suppressed
    value is published as missing with flags and is never converted to zero.
    """
    observations: list[tuple[ObservationRecord, dict[str, str]]] = []
    with zipfile.ZipFile(zip_path) as archive:
        csv_names = [
            name for name in archive.namelist() if name.endswith(".csv") and "MetaData" not in name
        ]
        if len(csv_names) != 1:
            raise ValidationError(f"expected one JVWS data CSV, found {csv_names}")
        with closing(archive.open(csv_names[0])) as binary_handle:
            with TextIOWrapper(binary_handle, encoding="utf-8-sig", newline="") as text_handle:
                reader = csv.DictReader(text_handle)
                required = {
                    "REF_DATE",
                    "GEO",
                    "DGUID",
                    "National Occupational Classification",
                    "Statistics",
                    "UOM",
                    "VALUE",
                    "STATUS",
                    "SYMBOL",
                    "TERMINATED",
                }
                if not reader.fieldnames or not required.issubset(reader.fieldnames):
                    raise ValidationError(
                        f"JVWS schema changed; missing {sorted(required - set(reader.fieldnames or []))}"
                    )

                for raw in reader:
                    if raw["GEO"].strip() != "Alberta":
                        continue
                    occupation = raw["National Occupational Classification"].strip()
                    match = re.search(r"\[(\d{5})\]\s*$", occupation)
                    if not match:
                        continue
                    noc_code = match.group(1)
                    if noc_code not in ALBERTA_TRADE_NOC_TO_NODE:
                        continue
                    statistic = raw["Statistics"].strip()
                    if statistic not in JVWS_STATISTICS:
                        continue

                    period_start, period_end = quarter_bounds(raw["REF_DATE"].strip())
                    value_text = raw["VALUE"].strip()
                    quality_flags = tuple(
                        flag
                        for flag in (
                            f"status:{raw['STATUS'].strip()}" if raw["STATUS"].strip() else "",
                            f"symbol:{raw['SYMBOL'].strip()}" if raw["SYMBOL"].strip() else "",
                            f"terminated:{raw['TERMINATED'].strip()}"
                            if raw["TERMINATED"].strip()
                            else "",
                            "value_missing_or_suppressed" if not value_text else "",
                        )
                        if flag
                    )
                    identity = "|".join(
                        (
                            raw["REF_DATE"].strip(),
                            raw["DGUID"].strip(),
                            noc_code,
                            statistic,
                            raw["UOM"].strip(),
                        )
                    )
                    observation = ObservationRecord(
                        observation_id=(
                            f"OBS_JVWS_{hashlib.sha256(identity.encode()).hexdigest()[:20].upper()}"
                        ),
                        indicator_id=f"JVWS_{slug(statistic)}_NOC_{noc_code}",
                        value=float(value_text) if value_text else None,
                        unit=raw["UOM"].strip(),
                        geography_id="PR_48",
                        period_start=period_start,
                        period_end=period_end,
                        source_id="STATCAN_JVWS_14100444",
                        evidence_status=EvidenceStatus.OBSERVED,
                        as_of_date=period_end,
                        transformation_id=JVWS_TRANSFORMATION_ID,
                        quality_flags=quality_flags,
                    )
                    observation.validate()
                    observations.append(
                        (
                            observation,
                            {
                                "noc_code": noc_code,
                                "occupation_label": occupation.rsplit(" [", 1)[0],
                                "trade_node_id": ALBERTA_TRADE_NOC_TO_NODE[noc_code],
                                "statistic": statistic,
                            },
                        )
                    )

    observations.sort(
        key=lambda item: (
            item[0].period_start,
            item[1]["trade_node_id"],
            item[1]["noc_code"],
            item[1]["statistic"],
        )
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = (
        "observation_id",
        "indicator_id",
        "noc_code",
        "occupation_label",
        "trade_node_id",
        "statistic",
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
    )
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for observation, dimensions in observations:
            writer.writerow(
                {
                    **dimensions,
                    **observation.__dict__,
                    "value": "" if observation.value is None else observation.value,
                    "evidence_status": observation.evidence_status.value,
                    "quality_flags": "|".join(observation.quality_flags),
                }
            )
    return [observation for observation, _ in observations]


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
