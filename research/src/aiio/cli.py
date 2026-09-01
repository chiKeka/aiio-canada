from __future__ import annotations

import argparse
import json
from dataclasses import asdict
from datetime import UTC, date, datetime
from pathlib import Path

from .adapters.statcan import (
    normalize_bcpi_alberta,
    normalize_bcpi_provinces,
    normalize_bcpi_reference_provinces,
    normalize_jvws_alberta,
    normalize_jvws_canada,
)
from .adapters.statcan_census import (
    fetch_census_trade_employment,
    normalize_census_trade_employment,
)
from .adapters.alberta_projects import fetch_major_projects, normalize_major_projects
from .adapters.provincial_projects import (
    BC_SOURCE_ID,
    ONTARIO_SOURCE_ID,
    QUEBEC_SOURCE_ID,
    normalize_provincial_projects,
)
from .calibration import (
    PROVINCIAL_REFERENCE_GEOGRAPHY_LABELS,
    PROVINCIAL_REFERENCE_LIMITATIONS,
    PROVINCIAL_REFERENCE_MODEL_ID,
    run_reference_class_baseline,
)
from .digest import build_digest, validate_digest_cadence
from .labour import run_labour_recruitment_pressure
from .materials import run_material_cost_screen, run_provincial_material_cost_screen
from .power_evidence import run_power_evidence_screen
from .power_planning import run_provincial_power_planning_contract
from .project_cost import run_project_reference_cost
from .public_projects import run_public_project_exposure
from .registry import load_registry
from .retrieval import retrieve
from .schemas import ValidationError
from .scenario import run_scenario
from .power import run_power_overlay
from .release import build_publication_artifacts, build_release, verify_manifest


def main() -> None:
    utc_today = datetime.now(UTC).date().isoformat()
    parser = argparse.ArgumentParser(prog="aiio", description="AIIO Canada research pipeline")
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="repository root")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("validate-registry", help="validate the machine-readable source registry")

    fetch_parser = subparsers.add_parser("fetch", help="retrieve one registered public source")
    fetch_parser.add_argument("source_id")

    bcpi_parser = subparsers.add_parser("normalize-bcpi", help="normalize Alberta rows from a BCPI zip")
    bcpi_parser.add_argument("zip_path", type=Path)

    bcpi_canada_parser = subparsers.add_parser(
        "normalize-bcpi-provinces",
        help="normalize selected province-level BCPI material observations",
    )
    bcpi_canada_parser.add_argument("zip_path", type=Path)

    bcpi_reference_provinces_parser = subparsers.add_parser(
        "normalize-bcpi-reference-provinces",
        help="normalize BC, Ontario and Quebec public-building BCPI reference classes",
    )
    bcpi_reference_provinces_parser.add_argument("zip_path", type=Path)

    labour_parser = subparsers.add_parser(
        "normalize-jvws",
        help="normalize Alberta job-vacancy and offered-wage rows for graph-relevant trades",
    )
    labour_parser.add_argument("zip_path", type=Path)

    labour_canada_parser = subparsers.add_parser(
        "normalize-jvws-canada",
        help="normalize provincial and territorial trade labour observations",
    )
    labour_canada_parser.add_argument("zip_path", type=Path)

    subparsers.add_parser(
        "fetch-census-workforce",
        help="retrieve selected provincial and territorial detailed-trade employment cells",
    )

    census_workforce_parser = subparsers.add_parser(
        "normalize-census-workforce",
        help="normalize selected 2021 Census detailed-trade employment cells",
    )
    census_workforce_parser.add_argument("raw_path", type=Path)

    labour_pressure_parser = subparsers.add_parser(
        "run-labour-pressure",
        help="build the cross-vintage vacancy/workforce recruitment-pressure diagnostic",
    )
    labour_pressure_parser.add_argument("vacancy_path", type=Path)
    labour_pressure_parser.add_argument("workforce_path", type=Path)
    labour_pressure_parser.add_argument("output_path", type=Path)

    materials_parser = subparsers.add_parser(
        "run-material-screen",
        help="build the Alberta BCPI component-overlap material cost diagnostic",
    )
    materials_parser.add_argument("bcpi_path", type=Path)
    materials_parser.add_argument("output_json_path", type=Path)
    materials_parser.add_argument("output_csv_path", type=Path)

    provincial_materials_parser = subparsers.add_parser(
        "run-provincial-material-screen",
        help="build the common province-level BCPI material-cost screen",
    )
    provincial_materials_parser.add_argument("bcpi_path", type=Path)
    provincial_materials_parser.add_argument("output_json_path", type=Path)
    provincial_materials_parser.add_argument("output_csv_path", type=Path)

    public_projects_parser = subparsers.add_parser(
        "run-public-project-exposure",
        help="build the Alberta public-delivery asset overlap diagnostic",
    )
    public_projects_parser.add_argument("projects_path", type=Path)
    public_projects_parser.add_argument("output_json_path", type=Path)
    public_projects_parser.add_argument("output_csv_path", type=Path)
    public_projects_parser.add_argument("--window-start", type=int, default=2027)
    public_projects_parser.add_argument("--window-end", type=int, default=2036)

    cost_baseline_parser = subparsers.add_parser(
        "run-cost-baseline",
        help="build the held-out Alberta BCPI public-building reference baseline",
    )
    cost_baseline_parser.add_argument("bcpi_path", type=Path)
    cost_baseline_parser.add_argument("output_path", type=Path)

    provincial_cost_baseline_parser = subparsers.add_parser(
        "run-cost-baseline-provinces",
        help="run the held-out BC, Ontario and Quebec BCPI reference baseline",
    )
    provincial_cost_baseline_parser.add_argument("bcpi_path", type=Path)
    provincial_cost_baseline_parser.add_argument("output_path", type=Path)

    project_cost_parser = subparsers.add_parser(
        "run-project-reference-cost",
        help="apply a validated BCPI reference path to an explicit expenditure profile",
    )
    project_cost_parser.add_argument("project_path", type=Path)
    project_cost_parser.add_argument("baseline_path", type=Path)
    project_cost_parser.add_argument("output_path", type=Path)

    power_evidence_parser = subparsers.add_parser(
        "run-power-evidence",
        help="build the observed AESO request, contract and transmission-boundary screen",
    )
    power_evidence_parser.add_argument("manual_extract_path", type=Path)
    power_evidence_parser.add_argument("source_pdf_path", type=Path)
    power_evidence_parser.add_argument("large_load_html_path", type=Path)
    power_evidence_parser.add_argument("interim_html_path", type=Path)
    power_evidence_parser.add_argument("output_json_path", type=Path)
    power_evidence_parser.add_argument("output_csv_path", type=Path)

    provincial_power_parser = subparsers.add_parser(
        "run-provincial-power-planning",
        help="validate the Ontario, B.C. and Quebec power-planning source contract",
    )
    provincial_power_parser.add_argument("extract_path", type=Path)
    provincial_power_parser.add_argument("output_json_path", type=Path)
    provincial_power_parser.add_argument("output_csv_path", type=Path)

    subparsers.add_parser(
        "fetch-major-projects",
        help="retrieve the Alberta Major Projects public full-dataset CSV export",
    )

    projects_parser = subparsers.add_parser(
        "normalize-major-projects",
        help="normalize Alberta Major Projects and classify AI-relevant records",
    )
    projects_parser.add_argument("csv_path", type=Path)
    projects_parser.add_argument("--as-of", required=True)

    provincial_projects_parser = subparsers.add_parser(
        "normalize-provincial-projects",
        help="normalize BC, Ontario and Quebec official project inventories",
    )
    provincial_projects_parser.add_argument("bc_geojson_path", type=Path)
    provincial_projects_parser.add_argument("ontario_csv_path", type=Path)
    provincial_projects_parser.add_argument("quebec_csv_path", type=Path)

    digest_parser = subparsers.add_parser("build-digest", help="render a reviewed weekly evidence digest")
    digest_parser.add_argument("items_path", type=Path)
    digest_parser.add_argument("--date", default=utc_today)

    digest_audit_parser = subparsers.add_parser(
        "audit-digest-cadence",
        help="fail when the latest dated digest intake is older than the weekly tolerance",
    )
    digest_audit_parser.add_argument("--as-of", default=utc_today)
    digest_audit_parser.add_argument("--max-age-days", type=int, default=8)

    scenario_parser = subparsers.add_parser(
        "run-scenario", help="run a versioned graph scenario and write auditable JSON output"
    )
    scenario_parser.add_argument("graph_path", type=Path)
    scenario_parser.add_argument("scenario_path", type=Path)
    scenario_parser.add_argument("output_path", type=Path)

    power_parser = subparsers.add_parser(
        "run-power-overlay", help="run the independent MW-based power overlay"
    )
    power_parser.add_argument("input_path", type=Path)
    power_parser.add_argument("output_path", type=Path)

    release_parser = subparsers.add_parser(
        "build-release", help="build one immutable research release and public data bundle"
    )
    release_parser.add_argument("version")
    release_parser.add_argument("--created-at", required=True)

    verify_parser = subparsers.add_parser("verify-release", help="verify release and public hashes")
    verify_parser.add_argument("version")

    publication_parser = subparsers.add_parser(
        "build-publication-artifacts",
        help="publish the workbook and hash the complete user-facing artifact set",
    )
    publication_parser.add_argument("version")
    publication_parser.add_argument("workbook_path", type=Path)

    args = parser.parse_args()
    root = args.root.resolve()
    registry_path = root / "data" / "registry" / "sources.json"

    try:
        if args.command == "validate-registry":
            sources = load_registry(registry_path)
            print(json.dumps({"status": "passed", "source_count": len(sources)}))
        elif args.command == "fetch":
            sources = {source.source_id: source for source in load_registry(registry_path)}
            if args.source_id not in sources:
                raise ValidationError(f"unknown source_id: {args.source_id}")
            record = retrieve(sources[args.source_id], root / "data" / "raw")
            print(json.dumps(asdict(record), indent=2))
        elif args.command == "normalize-bcpi":
            observations = normalize_bcpi_alberta(
                args.zip_path.resolve(),
                root / "data" / "processed" / "bcpi_alberta.csv",
            )
            print(json.dumps({"status": "passed", "observation_count": len(observations)}))
        elif args.command == "normalize-bcpi-provinces":
            observations = normalize_bcpi_provinces(
                args.zip_path.resolve(),
                root / "data" / "processed" / "bcpi_material_provinces.csv",
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "observation_count": len(observations),
                        "geography_count": len(
                            {item.geography_id for item in observations}
                        ),
                    }
                )
            )
        elif args.command == "normalize-bcpi-reference-provinces":
            observations = normalize_bcpi_reference_provinces(
                args.zip_path.resolve(),
                root
                / "data"
                / "processed"
                / "bcpi_reference_bc_on_qc.csv",
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "observation_count": len(observations),
                        "geography_count": len(
                            {item.geography_id for item in observations}
                        ),
                    }
                )
            )
        elif args.command == "normalize-jvws":
            observations = normalize_jvws_alberta(
                args.zip_path.resolve(),
                root / "data" / "processed" / "labour_availability_alberta.csv",
            )
            print(json.dumps({"status": "passed", "observation_count": len(observations)}))
        elif args.command == "normalize-jvws-canada":
            observations = normalize_jvws_canada(
                args.zip_path.resolve(),
                root / "data" / "processed" / "labour_availability_canada.csv",
            )
            print(json.dumps({"status": "passed", "observation_count": len(observations)}))
        elif args.command == "fetch-major-projects":
            record = fetch_major_projects(root / "data" / "raw")
            print(json.dumps(asdict(record), indent=2))
        elif args.command == "normalize-major-projects":
            project_count, ai_count = normalize_major_projects(
                args.csv_path.resolve(),
                root / "data" / "processed" / "alberta_major_projects.csv",
                root / "data" / "processed" / "alberta_ai_projects.csv",
                args.as_of,
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "project_count": project_count,
                        "ai_relevant_count": ai_count,
                    }
                )
            )
        elif args.command == "normalize-provincial-projects":
            source_records = {
                source.source_id: source for source in load_registry(registry_path)
            }
            source_ids = (BC_SOURCE_ID, ONTARIO_SOURCE_ID, QUEBEC_SOURCE_ID)
            missing = [source_id for source_id in source_ids if source_id not in source_records]
            if missing:
                raise ValidationError(
                    f"provincial project sources missing from registry: {missing}"
                )
            report = normalize_provincial_projects(
                args.bc_geojson_path.resolve(),
                args.ontario_csv_path.resolve(),
                args.quebec_csv_path.resolve(),
                root / "data" / "processed" / "public_projects_bc_on_qc.csv",
                root
                / "data"
                / "model-runs"
                / "public_projects_bc_on_qc_intake_v0.1.json",
                source_as_of_dates={
                    source_id: source_records[source_id].as_of_date
                    for source_id in source_ids
                },
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "transformation_id": report["transformation_id"],
                        "record_count": report["record_count"],
                        "geography_count": report["geography_count"],
                    }
                )
            )
        elif args.command == "fetch-census-workforce":
            record = fetch_census_trade_employment(root / "data" / "raw")
            print(json.dumps(asdict(record), indent=2))
        elif args.command == "normalize-census-workforce":
            observations = normalize_census_trade_employment(
                args.raw_path.resolve(),
                root / "data" / "processed" / "labour_workforce_stock_canada.csv",
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "observation_count": len(observations),
                        "output": "data/processed/labour_workforce_stock_canada.csv",
                    }
                )
            )
        elif args.command == "run-labour-pressure":
            output = run_labour_recruitment_pressure(
                args.vacancy_path.resolve(),
                args.workforce_path.resolve(),
                args.output_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": output["model_id"],
                        "occupation_diagnostic_count": len(
                            output["occupation_diagnostics"]
                        ),
                        "trade_diagnostic_count": len(output["trade_diagnostics"]),
                    }
                )
            )
        elif args.command == "run-material-screen":
            output = run_material_cost_screen(
                args.bcpi_path.resolve(),
                args.output_json_path.resolve(),
                args.output_csv_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": output["model_id"],
                        "observation_count": output["observation_count"],
                    }
                )
            )
        elif args.command == "run-provincial-material-screen":
            output = run_provincial_material_cost_screen(
                args.bcpi_path.resolve(),
                args.output_json_path.resolve(),
                args.output_csv_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": output["model_id"],
                        "observation_count": output["observation_count"],
                        "geography_count": len(output["geography_scope"]),
                    }
                )
            )
        elif args.command == "run-public-project-exposure":
            output = run_public_project_exposure(
                args.projects_path.resolve(),
                args.output_json_path.resolve(),
                args.output_csv_path.resolve(),
                window_start=args.window_start,
                window_end=args.window_end,
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": output["model_id"],
                        "screened_project_count": output["screened_project_count"],
                    }
                )
            )
        elif args.command == "run-cost-baseline":
            output = run_reference_class_baseline(
                args.bcpi_path.resolve(),
                args.output_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": output["model_id"],
                        "release_state": output["release_state"],
                        "reference_class_count": len(
                            output["reference_class_results"]
                        ),
                    }
                )
            )
        elif args.command == "run-cost-baseline-provinces":
            output = run_reference_class_baseline(
                args.bcpi_path.resolve(),
                args.output_path.resolve(),
                geography_labels=PROVINCIAL_REFERENCE_GEOGRAPHY_LABELS,
                model_id=PROVINCIAL_REFERENCE_MODEL_ID,
                limitations=PROVINCIAL_REFERENCE_LIMITATIONS,
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": output["model_id"],
                        "release_state": output["release_state"],
                        "reference_class_count": len(
                            output["reference_class_results"]
                        ),
                    }
                )
            )
        elif args.command == "run-project-reference-cost":
            output = run_project_reference_cost(
                args.project_path.resolve(),
                args.baseline_path.resolve(),
                args.output_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": output["status"],
                        "model_id": output["model_id"],
                        "project_id": output["project_id"],
                    }
                )
            )
        elif args.command == "run-power-evidence":
            output = run_power_evidence_screen(
                args.manual_extract_path.resolve(),
                args.source_pdf_path.resolve(),
                args.large_load_html_path.resolve(),
                args.interim_html_path.resolve(),
                args.output_json_path.resolve(),
                args.output_csv_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": output["model_id"],
                        "metric_count": len(output["metrics"]),
                    }
                )
            )
        elif args.command == "run-provincial-power-planning":
            output = run_provincial_power_planning_contract(
                args.extract_path.resolve(),
                root,
                args.output_json_path.resolve(),
                args.output_csv_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": output["model_id"],
                        "metric_count": output["metric_count"],
                        "publication_authorized": output["publication_boundary"][
                            "provincial_power_profile_authorized"
                        ],
                    }
                )
            )
        elif args.command == "build-digest":
            edition_date = date.fromisoformat(args.date)
            output = root / "data" / "digests" / f"{edition_date.isoformat()}.md"
            manifest = build_digest(
                args.items_path.resolve(),
                output,
                edition_date,
                source_registry_path=root / "data" / "registry" / "sources.json",
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "output": str(output),
                        "manifest": str(output.with_suffix(".manifest.json")),
                        "digest_id": manifest["digest_id"],
                    }
                )
            )
        elif args.command == "audit-digest-cadence":
            result = validate_digest_cadence(
                root / "data" / "digests" / "items",
                as_of_date=date.fromisoformat(args.as_of),
                max_age_days=args.max_age_days,
            )
            print(json.dumps(result))
        elif args.command == "run-scenario":
            output = run_scenario(
                args.graph_path.resolve(),
                args.scenario_path.resolve(),
                args.output_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "scenario_id": output["scenario_id"],
                        "pressure_node_count": len(output["pressure_peaks"]),
                    }
                )
            )
        elif args.command == "run-power-overlay":
            output = run_power_overlay(
                args.input_path.resolve(),
                args.output_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "overlay_id": output["overlay_id"],
                        "case_count": len(output["cases"]),
                    }
                )
            )
        elif args.command == "build-release":
            manifest = build_release(root, args.version, args.created_at)
            print(json.dumps({"status": "passed", "release_id": manifest["release_id"]}))
        elif args.command == "verify-release":
            verify_manifest(root, args.version)
            print(json.dumps({"status": "passed", "version": args.version}))
        elif args.command == "build-publication-artifacts":
            artifacts = build_publication_artifacts(
                root,
                args.version,
                args.workbook_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "version": args.version,
                        "artifact_count": len(artifacts["artifacts"]),
                    }
                )
            )
    except ValidationError as exc:
        parser.error(str(exc))


if __name__ == "__main__":
    main()
