from __future__ import annotations

import csv
import hashlib
import json
import shutil
import subprocess
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from .schemas import ValidationError


def build_release(root: Path, version: str, created_at: str) -> dict[str, Any]:
    code_commit, dirty = git_state(root)
    if code_commit == "uncommitted" or dirty:
        raise ValidationError(
            "release builds require a clean committed source tree so the code revision is reproducible"
        )
    release_dir = root / "data" / "releases" / version
    public_dir = root / "public" / "data"
    release_dir.mkdir(parents=True, exist_ok=True)
    public_dir.mkdir(parents=True, exist_ok=True)

    inputs = release_input_paths(root)
    missing = [name for name, path in inputs.items() if not path.exists()]
    if missing:
        raise ValidationError(f"release inputs are missing: {', '.join(missing)}")

    baseline = build_baseline(
        inputs["alberta_ai_projects"],
        inputs["bcpi_alberta"],
        inputs["labour_availability_alberta"],
    )
    model_run = json.loads(inputs["model_run"].read_text(encoding="utf-8"))
    power_run = json.loads(inputs["power_run"].read_text(encoding="utf-8"))
    scenario = build_public_scenario(model_run)
    power_overlay = build_public_power_overlay(power_run)
    sources = build_public_sources(inputs["source_registry"])
    digest = build_public_digest(inputs["digest_items"])

    baseline_path = release_dir / "baseline.json"
    scenario_path = release_dir / "scenario.json"
    power_path = release_dir / "power_overlay.json"
    sources_path = release_dir / "sources.json"
    digest_path = release_dir / "digest.json"
    write_json(baseline_path, baseline)
    write_json(scenario_path, scenario)
    write_json(power_path, power_overlay)
    write_json(sources_path, sources)
    write_json(digest_path, digest)
    shutil.copyfile(inputs["alberta_ai_projects"], release_dir / "alberta_ai_projects.csv")
    shutil.copyfile(inputs["bcpi_alberta"], release_dir / "bcpi_alberta.csv")
    shutil.copyfile(
        inputs["labour_availability_alberta"],
        release_dir / "labour_availability_alberta.csv",
    )

    input_hashes = {name: sha256_file(path) for name, path in sorted(inputs.items())}
    input_manifest_hash = sha256_json(input_hashes)
    output_hashes = {
        "baseline.json": sha256_file(baseline_path),
        "scenario.json": sha256_file(scenario_path),
        "power_overlay.json": sha256_file(power_path),
        "sources.json": sha256_file(sources_path),
        "digest.json": sha256_file(digest_path),
        "alberta_ai_projects.csv": sha256_file(release_dir / "alberta_ai_projects.csv"),
        "bcpi_alberta.csv": sha256_file(release_dir / "bcpi_alberta.csv"),
        "labour_availability_alberta.csv": sha256_file(
            release_dir / "labour_availability_alberta.csv"
        ),
    }
    manifest = {
        "schema_version": "1.0.0",
        "release_id": f"AIIO_RELEASE_{version.upper().replace('.', '_').replace('-', '_')}",
        "version": version,
        "status": "research-prototype",
        "created_at": created_at,
        "code_commit": code_commit,
        "dirty_worktree": dirty,
        "model_version": model_run["model_id"],
        "engine_version": model_run["engine_version"],
        "parameter_set_id": model_run["parameter_set_id"],
        "power_overlay_version": power_run["overlay_id"],
        "input_manifest_hash": input_manifest_hash,
        "configuration_hash": sha256_json(
            {
                "graph": input_hashes["graph"],
                "scenario": input_hashes["scenario"],
                "power_definition": input_hashes["power_definition"],
            }
        ),
        "inputs": input_hashes,
        "outputs": output_hashes,
        "publication_note": "Uncalibrated research prototype. Observations, inferences and scenarios remain explicitly separated; diagnostic scores are not findings or forecasts.",
    }
    manifest_path = release_dir / "manifest.json"
    write_json(manifest_path, manifest)

    latest = {
        "manifest": manifest,
        "baseline": baseline,
        "scenario": scenario,
        "power_overlay": power_overlay,
        "sources": sources,
        "digest": digest,
    }
    latest_path = public_dir / "latest.json"
    write_json(latest_path, latest)
    shutil.copyfile(manifest_path, public_dir / "manifest.json")
    downloads_dir = root / "public" / "downloads"
    downloads_dir.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(release_dir / "alberta_ai_projects.csv", downloads_dir / "alberta_ai_projects.csv")
    shutil.copyfile(release_dir / "bcpi_alberta.csv", downloads_dir / "bcpi_alberta.csv")
    shutil.copyfile(
        release_dir / "labour_availability_alberta.csv",
        downloads_dir / "labour_availability_alberta.csv",
    )
    return manifest


def build_baseline(
    projects_path: Path,
    bcpi_path: Path,
    labour_path: Path,
) -> dict[str, Any]:
    with projects_path.open(encoding="utf-8") as handle:
        projects = list(csv.DictReader(handle))
    if not projects:
        raise ValidationError("AI project baseline cannot be empty")
    core = [item for item in projects if item["ai_relevance"] == "core_data_centre"]
    enabling = [item for item in projects if item["ai_relevance"] == "enabling_power"]
    known_core = [item for item in core if item["estimated_cost_cad"]]
    known_enabling = [item for item in enabling if item["estimated_cost_cad"]]
    stages = Counter(item["stage"] for item in projects)

    bcpi_latest = latest_bcpi(bcpi_path)
    labour_latest = latest_labour_availability(labour_path)
    return {
        "schema_version": "1.1.0",
        "geography_id": "PR_48",
        "as_of_date": max(item["as_of_date"] for item in projects),
        "evidence_status": "observed_with_inferred_classification",
        "ai_project_pipeline": {
            "core_project_count": len(core),
            "enabling_power_project_count": len(enabling),
            "stage_counts": dict(sorted(stages.items())),
            "known_core_capex_cad": sum(float(item["estimated_cost_cad"]) for item in known_core),
            "known_core_capex_coverage": {"projects_with_value": len(known_core), "core_projects": len(core)},
            "known_enabling_capex_cad": sum(
                float(item["estimated_cost_cad"]) for item in known_enabling
            ),
            "known_enabling_capex_coverage": {
                "projects_with_value": len(known_enabling),
                "enabling_projects": len(enabling),
            },
            "source_id": "ALBERTA_MAJOR_PROJECTS",
            "warning": "Reported project values are announcements, not commitments or realized spend. Totals are not probability-weighted and may contain portfolio or phase overlap.",
        },
        "construction_prices": bcpi_latest,
        "labour_availability": labour_latest,
        "projects": [
            {
                "project_id": item["project_id"],
                "name": item["name"],
                "estimated_cost_cad": float(item["estimated_cost_cad"])
                if item["estimated_cost_cad"]
                else None,
                "municipality": item["municipality"],
                "start_year": int(item["start_year"]) if item["start_year"] else None,
                "end_year": int(item["end_year"]) if item["end_year"] else None,
                "stage": item["stage"],
                "developer": item["developer"],
                "project_website": item["project_website"] or None,
                "longitude": float(item["longitude"]) if item["longitude"] else None,
                "latitude": float(item["latitude"]) if item["latitude"] else None,
                "location_precision": item["location_precision"],
                "ai_relevance": item["ai_relevance"],
                "source_evidence_status": item["source_evidence_status"],
                "classification_evidence_status": item["classification_evidence_status"],
                "as_of_date": item["as_of_date"],
            }
            for item in sorted(projects, key=lambda row: row["name"])
        ],
    }


def latest_labour_availability(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise ValidationError("labour availability baseline cannot be empty")
    groups: dict[tuple[str, str], list[dict[str, str]]] = {}
    for item in rows:
        groups.setdefault((item["noc_code"], item["statistic"]), []).append(item)

    latest_rows = [
        sorted(items, key=lambda item: item["period_end"])[-1]
        for _, items in sorted(groups.items())
    ]
    period_end = max(item["period_end"] for item in latest_rows)
    observations = []
    for item in sorted(latest_rows, key=lambda row: (row["trade_node_id"], row["noc_code"], row["statistic"])):
        value = float(item["value"]) if item["value"] else None
        observations.append(
            {
                "observation_id": item["observation_id"],
                "indicator_id": item["indicator_id"],
                "noc_code": item["noc_code"],
                "occupation_label": item["occupation_label"],
                "trade_node_id": item["trade_node_id"],
                "statistic": item["statistic"],
                "value": value,
                "unit": item["unit"],
                "period_end": item["period_end"],
                "source_id": item["source_id"],
                "evidence_status": item["evidence_status"],
                "transformation_id": item["transformation_id"],
                "quality_flags": [flag for flag in item["quality_flags"].split("|") if flag],
            }
        )
    return {
        "period_end": period_end,
        "source_id": "STATCAN_JVWS_14100444",
        "evidence_status": "observed",
        "observations": observations,
        "warning": (
            "Job vacancies measure unmet labour demand, not total labour supply. Offered wages are "
            "posted offers, not realized earnings. Suppressed Statistics Canada values remain missing "
            "and are never interpreted as zero."
        ),
    }


def latest_bcpi(path: Path) -> list[dict[str, Any]]:
    indicators = {
        "BCPI_NON_RESIDENTIAL_BUILDINGS_622_DIVISION_COMPOSITE",
        "BCPI_SCHOOL_DIVISION_COMPOSITE",
    }
    with path.open(encoding="utf-8") as handle:
        rows = [item for item in csv.DictReader(handle) if item["indicator_id"] in indicators]
    groups: dict[tuple[str, str], list[dict[str, str]]] = {}
    for item in rows:
        groups.setdefault((item["indicator_id"], item["geography_id"]), []).append(item)
    output: list[dict[str, Any]] = []
    for (indicator, geography), items in sorted(groups.items()):
        ordered = sorted(items, key=lambda item: item["period_end"])
        latest = ordered[-1]
        previous = ordered[-2] if len(ordered) > 1 else None
        change = None
        if previous and float(previous["value"]) != 0:
            change = (float(latest["value"]) / float(previous["value"]) - 1) * 100
        output.append(
            {
                "indicator_id": indicator,
                "geography_id": geography,
                "period_end": latest["period_end"],
                "value": float(latest["value"]),
                "unit": latest["unit"],
                "quarter_over_quarter_percent": round(change, 2) if change is not None else None,
                "evidence_status": "observed",
                "source_id": "STATCAN_BCPI_18100289",
            }
        )
    return output


def build_public_scenario(model_run: dict[str, Any]) -> dict[str, Any]:
    public_peaks = [public_pressure_row(item) for item in model_run["pressure_peaks"]]
    resources = [item for item in public_peaks if item["node_type"] == "resource"]
    outcomes = [item for item in public_peaks if item["node_type"] == "outcome"]
    return {
        "schema_version": "1.1.0",
        "scenario_id": model_run["scenario_id"],
        "parameter_set_id": model_run["parameter_set_id"],
        "name": model_run["scenario_name"],
        "description": model_run["scenario_description"],
        "evidence_status": "scenario",
        "structural_test_banner": model_run["structural_test_banner"],
        "investment_total_cad": model_run["investment_total_cad"],
        "modelled_component_share": model_run["modelled_component_share"],
        "excluded_component_share": model_run["excluded_component_share"],
        "local_capture_share": model_run["local_capture_share"],
        "annual_flows": model_run["annual_flows"],
        "trade_pressure_order": sorted(resources, key=lambda item: -item["central"]),
        "public_delivery_pressure_order": sorted(outcomes, key=lambda item: -item["central"]),
        "dominant_outcome_paths": model_run["dominant_outcome_paths"],
        "sensitivity": [public_sensitivity_row(item) for item in model_run["sensitivity"]],
        "diagnostic_scale": {
            "display_score_range": "[0, 1)",
            "display_transform": "raw_pressure / (1 + raw_pressure)",
            "interpretation": "Monotone bounded display score only; not a probability, percentage, effect size or delay estimate.",
        },
        "case_note": model_run["case_note"],
        "limitations": model_run["limitations"],
    }


def bounded_display_score(raw_pressure: float) -> float:
    if raw_pressure < 0:
        raise ValidationError("absolute pressure scores cannot be negative")
    return min(0.9999, round(raw_pressure / (1 + raw_pressure), 4))


def public_pressure_row(item: dict[str, Any]) -> dict[str, Any]:
    output = dict(item)
    for case in ("low", "central", "high"):
        output[f"raw_{case}"] = item[case]
        output[case] = bounded_display_score(item[case])
    return output


def public_sensitivity_row(item: dict[str, Any]) -> dict[str, Any]:
    output = dict(item)
    for key in ("top_resource", "top_public_delivery_outcome"):
        peak = dict(item[key])
        peak["raw_pressure_score"] = peak["pressure_score"]
        peak["pressure_score"] = bounded_display_score(peak["pressure_score"])
        output[key] = peak
    return output


def build_public_power_overlay(power_run: dict[str, Any]) -> dict[str, Any]:
    return {
        "schema_version": power_run["schema_version"],
        "overlay_id": power_run["overlay_id"],
        "parameter_set_id": power_run["parameter_set_id"],
        "name": power_run["name"],
        "description": power_run["description"],
        "evidence_status": power_run["evidence_status"],
        "structural_test_banner": power_run["structural_test_banner"],
        "start_year": power_run["start_year"],
        "end_year": power_run["end_year"],
        "cases": power_run["cases"],
        "limitations": power_run["limitations"],
    }


def build_public_sources(path: Path) -> list[dict[str, Any]]:
    sources = json.loads(path.read_text(encoding="utf-8"))["sources"]
    return [
        {
            "source_id": item["source_id"],
            "title": item["title"],
            "publisher": item["publisher"],
            "canonical_url": item["canonical_url"],
            "domain": item["domain"],
            "geography": item["geography"],
            "as_of_date": item["as_of_date"],
            "evidence_status": item["evidence_status"],
            "status": item["status"],
        }
        for item in sources
    ]


def build_public_digest(path: Path) -> dict[str, Any]:
    digest = json.loads(path.read_text(encoding="utf-8"))
    return {
        "edition_date": digest["edition_date"],
        "status": digest["status"],
        "items": digest["items"],
        "promotion_rule": "Digest evidence does not change model values until reviewed and included in a versioned release.",
    }


def verify_manifest(root: Path, version: str) -> None:
    release_dir = root / "data" / "releases" / version
    manifest = json.loads((release_dir / "manifest.json").read_text(encoding="utf-8"))
    for name, expected in manifest["outputs"].items():
        actual = sha256_file(release_dir / name)
        if actual != expected:
            raise ValidationError(f"release output hash mismatch: {name}")
    current_inputs = release_input_paths(root)
    if set(current_inputs) != set(manifest["inputs"]):
        raise ValidationError("release input key set does not match the manifest")
    for name, path in current_inputs.items():
        actual = sha256_file(path)
        expected = manifest["inputs"].get(name)
        if actual != expected:
            raise ValidationError(f"release input hash mismatch: {name}")
    current_commit, _ = git_state(root)
    if current_commit != manifest["code_commit"]:
        raise ValidationError("current HEAD does not match the release code_commit")
    latest = json.loads((root / "public" / "data" / "latest.json").read_text(encoding="utf-8"))
    if latest["manifest"] != manifest:
        raise ValidationError("public latest manifest does not match the immutable release")


def release_input_paths(root: Path) -> dict[str, Path]:
    return {
        "source_registry": root / "data" / "registry" / "sources.json",
        "bcpi_alberta": root / "data" / "processed" / "bcpi_alberta.csv",
        "labour_availability_alberta": (
            root / "data" / "processed" / "labour_availability_alberta.csv"
        ),
        "alberta_ai_projects": root / "data" / "processed" / "alberta_ai_projects.csv",
        "graph": root / "data" / "model" / "alberta_graph_v0.2.json",
        "scenario": root / "data" / "scenarios" / "alberta_50b_counterfactual_v0.2.json",
        "model_run": root / "data" / "model-runs" / "alberta_50b_counterfactual_v0.2.json",
        "power_definition": root / "data" / "scenarios" / "alberta_power_overlay_v0.1.json",
        "power_run": root / "data" / "model-runs" / "alberta_power_overlay_v0.1.json",
        "digest_items": root / "data" / "digests" / "items" / "2026-08-31.json",
    }


def build_publication_artifacts(
    root: Path,
    version: str,
    workbook_path: Path,
) -> dict[str, Any]:
    """Publish and hash all user-facing artifacts after the workbook is generated."""

    verify_manifest(root, version)
    if not workbook_path.exists():
        raise ValidationError(f"workbook does not exist: {workbook_path}")
    manifest = json.loads(
        (root / "data" / "releases" / version / "manifest.json").read_text(encoding="utf-8")
    )
    downloads_dir = root / "public" / "downloads"
    downloads_dir.mkdir(parents=True, exist_ok=True)
    workbook_name = f"AIIO_Alberta_Pilot_{version}.xlsx"
    public_workbook = downloads_dir / workbook_name
    shutil.copyfile(workbook_path, public_workbook)

    relative_paths = [
        Path("public/data/latest.json"),
        Path("public/data/manifest.json"),
        Path(f"public/downloads/{workbook_name}"),
        Path("public/downloads/alberta_ai_projects.csv"),
        Path("public/downloads/bcpi_alberta.csv"),
        Path("public/downloads/labour_availability_alberta.csv"),
    ]
    artifacts = {
        "schema_version": "1.0.0",
        "release_version": version,
        "release_id": manifest["release_id"],
        "code_commit": manifest["code_commit"],
        "input_manifest_hash": manifest["input_manifest_hash"],
        "artifacts": [
            {
                "path": str(relative_path),
                "sha256": hashlib.sha256((root / relative_path).read_bytes()).hexdigest(),
            }
            for relative_path in relative_paths
        ],
    }
    release_path = root / "data" / "releases" / version / "publication-artifacts.json"
    public_path = root / "public" / "data" / "publication-artifacts.json"
    write_json(release_path, artifacts)
    write_json(public_path, artifacts)
    return artifacts


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def sha256_file(path: Path) -> str:
    return f"sha256:{hashlib.sha256(path.read_bytes()).hexdigest()}"


def sha256_json(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return f"sha256:{hashlib.sha256(encoded).hexdigest()}"


def git_state(root: Path) -> tuple[str, bool]:
    commit = subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=root, capture_output=True, text=True, check=False
    )
    status = subprocess.run(
        ["git", "status", "--porcelain"], cwd=root, capture_output=True, text=True, check=False
    )
    return (commit.stdout.strip() or "uncommitted", bool(status.stdout.strip()))
