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
from .adapters.statcan_investment import normalize_investment_controls
from .adapters.statcan_capex import normalize_information_sector_construction_capex
from .adapters.canadabuys import (
    AWARD_SOURCE_ID as CANADABUYS_AWARD_SOURCE_ID,
    CONTRACT_SOURCE_ID as CANADABUYS_CONTRACT_SOURCE_ID,
    TENDER_SOURCE_ID as CANADABUYS_TENDER_SOURCE_ID,
    normalize_canadabuys_outcome_intake,
)
from .adapters.edmonton_permits import (
    SOURCE_ID as EDMONTON_PERMIT_SOURCE_ID,
    fetch_edmonton_permit_candidates,
    normalize_edmonton_permit_proxy,
)
from .audited_outcomes import run_audited_project_outcomes
from .quebec_revisions import (
    DICTIONARY_SOURCE_ID as QUEBEC_DICTIONARY_SOURCE_ID,
    run_quebec_authorized_revisions,
)
from .quebec_vintages import (
    retrieve_full_archive_resources,
    retrieve_milestone_resources,
)
from .quebec_longitudinal import run_quebec_milestone_longitudinal
from .quebec_review import build_quebec_parser_review_package
from .quebec_full_archive import run_quebec_full_archive_longitudinal
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
from .attribution import build_attribution_readiness
from .digest import build_digest, validate_digest_cadence
from .historical_envelope import run_historical_reference_envelope
from .labour import run_labour_recruitment_pressure
from .materials import run_material_cost_screen, run_provincial_material_cost_screen
from .model_review import (
    build_reference_cost_review_package,
    validate_reference_cost_review_verdict,
)
from .power_evidence import run_power_evidence_screen
from .power_planning import run_provincial_power_planning_contract
from .project_cost import run_project_reference_cost
from .public_projects import run_public_project_exposure
from .registry import load_registry
from .readiness import audit_program_readiness, require_release_ready
from .retrieval import retrieve
from .schemas import ValidationError
from .scenario import run_scenario
from .scenario_suite import run_scenario_suite
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

    investment_parser = subparsers.add_parser(
        "normalize-investment-controls",
        help="normalize quarterly regional non-residential building-investment controls",
    )
    investment_parser.add_argument("zip_path", type=Path)

    capex_treatment_parser = subparsers.add_parser(
        "normalize-capex-treatment-screen",
        help="build the fail-closed NAICS 51 construction-capex treatment feasibility screen",
    )
    capex_treatment_parser.add_argument("zip_path", type=Path)
    capex_treatment_parser.add_argument("output_csv_path", type=Path)
    capex_treatment_parser.add_argument("output_json_path", type=Path)

    canadabuys_parser = subparsers.add_parser(
        "normalize-canadabuys-outcomes",
        help="build the fail-closed CanadaBuys construction procurement outcome-feasibility intake",
    )
    canadabuys_parser.add_argument("tender_path", type=Path)
    canadabuys_parser.add_argument("award_path", type=Path)
    canadabuys_parser.add_argument("contract_path", type=Path)

    subparsers.add_parser(
        "fetch-edmonton-permits",
        help="retrieve a field-minimized broad screen from the Edmonton building-permit API",
    )

    edmonton_permits_parser = subparsers.add_parser(
        "normalize-edmonton-permits",
        help="build the fail-closed Edmonton data-centre permit activity proxy",
    )
    edmonton_permits_parser.add_argument("raw_path", type=Path)

    audited_outcomes_parser = subparsers.add_parser(
        "normalize-audited-project-outcomes",
        help="build fail-closed named project outcome references from the Ontario audit",
    )
    audited_outcomes_parser.add_argument("manual_extract_path", type=Path)
    audited_outcomes_parser.add_argument("source_pdf_path", type=Path)

    quebec_revisions_parser = subparsers.add_parser(
        "normalize-quebec-authorized-revisions",
        help="build a fail-closed panel of Quebec authorized cost and completion revisions",
    )
    quebec_revisions_parser.add_argument("dashboard_csv_path", type=Path)
    quebec_revisions_parser.add_argument("dictionary_pdf_path", type=Path)

    quebec_vintages_parser = subparsers.add_parser(
        "fetch-quebec-milestone-vintages",
        help="retrieve a threshold-aware milestone sample from the official Quebec dashboard archive",
    )
    quebec_vintages_parser.add_argument("catalog_json_path", type=Path)

    quebec_longitudinal_parser = subparsers.add_parser(
        "normalize-quebec-milestone-vintages",
        help="build a fail-closed stable-ID longitudinal panel from Quebec milestone snapshots",
    )
    quebec_longitudinal_parser.add_argument("contract_path", type=Path)

    quebec_review_parser = subparsers.add_parser(
        "build-quebec-parser-review",
        help="build a deterministic, still-unauthorized independent parser-review package",
    )
    quebec_review_parser.add_argument("dashboard_csv_path", type=Path)

    quebec_full_archive_parser = subparsers.add_parser(
        "fetch-quebec-full-archive",
        help="hash-lock every official Quebec dashboard CSV date and any required paired-workbook fallback",
    )
    quebec_full_archive_parser.add_argument("catalog_json_path", type=Path)

    quebec_full_normalize_parser = subparsers.add_parser(
        "normalize-quebec-full-archive",
        help="build the complete-catalog stable-ID Quebec longitudinal selection panel",
    )
    quebec_full_normalize_parser.add_argument("contract_path", type=Path)

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

    historical_envelope_parser = subparsers.add_parser(
        "run-historical-cost-envelope",
        help="build the descriptive Alberta BCPI historical planning envelope",
    )
    historical_envelope_parser.add_argument("bcpi_path", type=Path)
    historical_envelope_parser.add_argument("output_path", type=Path)

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

    reference_review_parser = subparsers.add_parser(
        "build-reference-cost-review",
        help="build the deterministic independent-review packet for the Alberta E1 baseline",
    )
    reference_review_parser.add_argument("output_json_path", type=Path)
    reference_review_parser.add_argument("output_prompt_path", type=Path)

    reference_verdict_parser = subparsers.add_parser(
        "validate-reference-cost-verdict",
        help="validate an independent Alberta E1 review verdict without authorizing publication",
    )
    reference_verdict_parser.add_argument("package_path", type=Path)
    reference_verdict_parser.add_argument("verdict_path", type=Path)

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

    readiness_parser = subparsers.add_parser(
        "audit-program-readiness",
        help="audit structural, decision-grade, review and publication gates",
    )
    readiness_parser.add_argument("--as-of", default=utc_today)
    readiness_parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/model-runs/program_readiness_current.json"),
    )
    readiness_parser.add_argument("--require-release-ready", action="store_true")

    attribution_parser = subparsers.add_parser(
        "run-attribution-readiness",
        help="validate the E2 causal-panel contract and write a fail-closed readiness run",
    )
    attribution_parser.add_argument("contract_path", type=Path)
    attribution_parser.add_argument("output_path", type=Path)

    scenario_parser = subparsers.add_parser(
        "run-scenario", help="run a versioned graph scenario and write auditable JSON output"
    )
    scenario_parser.add_argument("graph_path", type=Path)
    scenario_parser.add_argument("scenario_path", type=Path)
    scenario_parser.add_argument("output_path", type=Path)

    scenario_suite_parser = subparsers.add_parser(
        "run-scenario-suite",
        help="run and compare the versioned Alberta scenario variants",
    )
    scenario_suite_parser.add_argument("contract_path", type=Path)
    scenario_suite_parser.add_argument("output_path", type=Path)

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
        elif args.command == "normalize-investment-controls":
            observations = normalize_investment_controls(
                args.zip_path.resolve(),
                root / "data/processed/building_investment_controls_canada.csv",
                root
                / "data/model-runs/building_investment_controls_canada_v0.1.json",
                args.zip_path.resolve().with_suffix(
                    args.zip_path.resolve().suffix + ".manifest.json"
                ),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "observation_count": len(observations),
                        "geography_count": len(
                            {item["geography_id"] for item in observations}
                        ),
                    }
                )
            )
        elif args.command == "normalize-capex-treatment-screen":
            manifest_path = args.zip_path.resolve().with_suffix(
                args.zip_path.resolve().suffix + ".manifest.json"
            )
            output = normalize_information_sector_construction_capex(
                args.zip_path.resolve(),
                args.output_csv_path.resolve(),
                args.output_json_path.resolve(),
                retrieval_manifest_path=(
                    manifest_path if manifest_path.exists() else None
                ),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": output["model_id"],
                        "observation_count": output["observation_count"],
                        "authorizing_treatment_present": output[
                            "treatment_requirement_assessment"
                        ]["authorizing_treatment_present"],
                    }
                )
            )
        elif args.command == "normalize-canadabuys-outcomes":
            input_paths = {
                CANADABUYS_TENDER_SOURCE_ID: args.tender_path.resolve(),
                CANADABUYS_AWARD_SOURCE_ID: args.award_path.resolve(),
                CANADABUYS_CONTRACT_SOURCE_ID: args.contract_path.resolve(),
            }
            report = normalize_canadabuys_outcome_intake(
                input_paths[CANADABUYS_TENDER_SOURCE_ID],
                input_paths[CANADABUYS_AWARD_SOURCE_ID],
                input_paths[CANADABUYS_CONTRACT_SOURCE_ID],
                root
                / "data"
                / "processed"
                / "canadabuys_construction_outcome_feasibility.csv",
                root
                / "data"
                / "model-runs"
                / "canadabuys_construction_outcome_feasibility_v0.1.json",
                retrieval_manifest_paths={
                    source_id: path.with_suffix(path.suffix + ".manifest.json")
                    for source_id, path in input_paths.items()
                },
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": report["model_id"],
                        "construction_linkage_count": report[
                            "construction_linkage_count"
                        ],
                        "public_project_cost_outcome_authorized": report[
                            "publication_boundary"
                        ]["public_project_cost_outcome_authorized"],
                    }
                )
            )
        elif args.command == "fetch-edmonton-permits":
            source_records = {
                source.source_id: source for source in load_registry(registry_path)
            }
            if EDMONTON_PERMIT_SOURCE_ID not in source_records:
                raise ValidationError("Edmonton permit source is missing from the registry")
            record = fetch_edmonton_permit_candidates(root / "data" / "raw")
            print(json.dumps(record, indent=2, sort_keys=True))
        elif args.command == "normalize-edmonton-permits":
            source_records = {
                source.source_id: source for source in load_registry(registry_path)
            }
            if EDMONTON_PERMIT_SOURCE_ID not in source_records:
                raise ValidationError("Edmonton permit source is missing from the registry")
            raw_path = args.raw_path.resolve()
            report = normalize_edmonton_permit_proxy(
                raw_path,
                root
                / "data"
                / "processed"
                / "edmonton_data_centre_permit_proxy.csv",
                root
                / "data"
                / "model-runs"
                / "edmonton_data_centre_permit_proxy_v0.1.json",
                source_as_of_date=source_records[
                    EDMONTON_PERMIT_SOURCE_ID
                ].as_of_date,
                retrieval_manifest_path=raw_path.with_suffix(
                    raw_path.suffix + ".manifest.json"
                ),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": report["model_id"],
                        "broad_screen_row_count": report["broad_screen_row_count"],
                        "data_centre_candidate_count": report[
                            "data_centre_candidate_count"
                        ],
                        "realized_ai_construction_treatment_authorized": report[
                            "publication_boundary"
                        ]["realized_ai_construction_treatment_authorized"],
                    }
                )
            )
        elif args.command == "normalize-audited-project-outcomes":
            source_records = {
                source.source_id: source for source in load_registry(registry_path)
            }
            source_id = "OAGO_SELECTED_INFRASTRUCTURE_PROJECTS_2024"
            if source_id not in source_records:
                raise ValidationError(
                    "Ontario audited-outcome source is missing from the registry"
                )
            report = run_audited_project_outcomes(
                args.manual_extract_path.resolve(),
                args.source_pdf_path.resolve(),
                root
                / "data"
                / "model-runs"
                / "oago_audited_project_outcomes_v0.1.json",
                root
                / "data"
                / "processed"
                / "oago_audited_project_outcomes.csv",
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": report["model_id"],
                        "named_completed_project_count": report[
                            "coverage_summary"
                        ]["named_completed_project_count"],
                        "public_project_cost_outcome_authorized": report[
                            "publication_boundary"
                        ]["public_project_cost_outcome_authorized"],
                        "public_project_schedule_outcome_authorized": report[
                            "publication_boundary"
                        ]["public_project_schedule_outcome_authorized"],
                    }
                )
            )
        elif args.command == "normalize-quebec-authorized-revisions":
            source_records = {
                source.source_id: source for source in load_registry(registry_path)
            }
            required_source_ids = (QUEBEC_SOURCE_ID, QUEBEC_DICTIONARY_SOURCE_ID)
            missing_source_ids = [
                source_id
                for source_id in required_source_ids
                if source_id not in source_records
            ]
            if missing_source_ids:
                raise ValidationError(
                    "Quebec revision sources are missing from the registry: "
                    + ", ".join(missing_source_ids)
                )
            report = run_quebec_authorized_revisions(
                args.dashboard_csv_path.resolve(),
                args.dictionary_pdf_path.resolve(),
                root
                / "data"
                / "model-runs"
                / "quebec_pqi_authorized_project_revisions_v0.1.json",
                root
                / "data"
                / "processed"
                / "quebec_pqi_authorized_project_revisions.csv",
                root
                / "data"
                / "processed"
                / "quebec_pqi_authorized_revision_events.csv",
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": report["model_id"],
                        **report["coverage_summary"],
                        "authorized_revision_reference_panel_authorized": report[
                            "publication_boundary"
                        ]["authorized_revision_reference_panel_authorized"],
                    }
                )
            )
        elif args.command == "fetch-quebec-milestone-vintages":
            report = retrieve_milestone_resources(
                args.catalog_json_path.resolve(),
                root / "data" / "raw" / "quebec_pqi_project_dashboard_vintages",
                root
                / "data"
                / "model"
                / "quebec_pqi_milestone_vintage_contract_v0.1.json",
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "contract_id": report["contract_id"],
                        "catalog_csv_resource_count": report[
                            "catalog_csv_resource_count"
                        ],
                        "selected_vintage_count": report["selected_vintage_count"],
                        "catalog_start_date": report["catalog_start_date"],
                        "catalog_end_date": report["catalog_end_date"],
                        "longitudinal_outcome_panel_authorized": report[
                            "publication_boundary"
                        ]["longitudinal_outcome_panel_authorized"],
                    }
                )
            )
        elif args.command == "normalize-quebec-milestone-vintages":
            report = run_quebec_milestone_longitudinal(
                args.contract_path.resolve(),
                root / "data" / "raw" / "quebec_pqi_project_dashboard_vintages",
                root
                / "data"
                / "model-runs"
                / "quebec_pqi_milestone_longitudinal_v0.1.json",
                root
                / "data"
                / "processed"
                / "quebec_pqi_milestone_project_vintages.csv",
                root
                / "data"
                / "processed"
                / "quebec_pqi_milestone_project_lifecycles.csv",
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": report["model_id"],
                        "vintage_count": report["vintage_count"],
                        "snapshot_observation_count": report[
                            "snapshot_observation_count"
                        ],
                        "unique_project_count": report["unique_project_count"],
                        "present_in_latest_project_count": report[
                            "present_in_latest_project_count"
                        ],
                        "complete_longitudinal_panel_authorized": report[
                            "publication_boundary"
                        ]["complete_longitudinal_panel_authorized"],
                    }
                )
            )
        elif args.command == "build-quebec-parser-review":
            report = build_quebec_parser_review_package(
                args.dashboard_csv_path.resolve(),
                root
                / "data"
                / "model-runs"
                / "quebec_pqi_authorized_project_revisions_v0.1.json",
                root
                / "data"
                / "processed"
                / "quebec_pqi_authorized_project_revisions.csv",
                root
                / "data"
                / "processed"
                / "quebec_pqi_authorized_revision_events.csv",
                root
                / "data"
                / "model-runs"
                / "quebec_pqi_milestone_longitudinal_v0.1.json",
                root
                / "data"
                / "processed"
                / "quebec_pqi_milestone_project_lifecycles.csv",
                root / "data" / "reviews" / "quebec_pqi_parser_review_sample_v0.1.csv",
                root
                / "data"
                / "model-runs"
                / "quebec_pqi_parser_review_package_v0.1.json",
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "package_id": report["package_id"],
                        "review_status": report["review_status"],
                        "sample_project_count": report["sample_project_count"],
                        "source_project_count": report["source_project_count"],
                        "independent_parser_review_complete": report[
                            "publication_boundary"
                        ]["independent_parser_review_complete"],
                    }
                )
            )
        elif args.command == "fetch-quebec-full-archive":
            report = retrieve_full_archive_resources(
                args.catalog_json_path.resolve(),
                root
                / "data"
                / "model"
                / "quebec_pqi_milestone_vintage_contract_v0.1.json",
                root / "data" / "raw" / "quebec_pqi_project_dashboard_full_archive",
                root
                / "data"
                / "model"
                / "quebec_pqi_full_archive_contract_v0.1.json",
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "contract_id": report["contract_id"],
                        "snapshot_date_count": report["snapshot_date_count"],
                        "direct_csv_snapshot_count": report[
                            "direct_csv_snapshot_count"
                        ],
                        "paired_xlsx_fallback_count": report[
                            "paired_xlsx_fallback_count"
                        ],
                        "project_exit_outcome_authorized": report[
                            "publication_boundary"
                        ]["project_exit_outcome_authorized"],
                    }
                )
            )
        elif args.command == "normalize-quebec-full-archive":
            report = run_quebec_full_archive_longitudinal(
                args.contract_path.resolve(),
                root,
                root
                / "data"
                / "model-runs"
                / "quebec_pqi_milestone_longitudinal_v0.1.json",
                root
                / "data"
                / "model-runs"
                / "quebec_pqi_full_archive_longitudinal_v0.1.json",
                root
                / "data"
                / "processed"
                / "quebec_pqi_full_archive_project_vintages.csv",
                root
                / "data"
                / "processed"
                / "quebec_pqi_full_archive_project_lifecycles.csv",
                root
                / "data"
                / "processed"
                / "quebec_pqi_full_archive_transitions.csv",
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": report["model_id"],
                        "snapshot_date_count": report["snapshot_date_count"],
                        "snapshot_observation_count": report[
                            "snapshot_observation_count"
                        ],
                        "unique_project_count": report["unique_project_count"],
                        "additional_unique_projects_observed": report[
                            "milestone_comparison"
                        ]["additional_unique_projects_observed"],
                        "project_exit_outcome_authorized": report[
                            "publication_boundary"
                        ]["project_exit_outcome_authorized"],
                    }
                )
            )
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
        elif args.command == "run-historical-cost-envelope":
            output = run_historical_reference_envelope(
                args.bcpi_path.resolve(),
                args.output_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "model_id": output["model_id"],
                        "reference_class_count": len(
                            output["reference_class_results"]
                        ),
                        "historical_summary_authorized": output[
                            "publication_authorization"
                        ]["historical_summary_authorized"],
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
        elif args.command == "build-reference-cost-review":
            output = build_reference_cost_review_package(
                root,
                args.output_json_path.resolve(),
                args.output_prompt_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "package_id": output["package_id"],
                        "review_status": output["review_status"],
                        "criterion_count": len(output["required_criteria"]),
                    }
                )
            )
        elif args.command == "validate-reference-cost-verdict":
            output = validate_reference_cost_review_verdict(
                args.package_path.resolve(),
                args.verdict_path.resolve(),
            )
            print(json.dumps(output))
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
        elif args.command == "audit-program-readiness":
            output_path = (
                args.output if args.output.is_absolute() else root / args.output
            ).resolve()
            result = audit_program_readiness(
                root,
                as_of_date=date.fromisoformat(args.as_of),
                output_path=output_path,
            )
            if result["status_counts"]["fail"]:
                raise ValidationError(
                    "program readiness audit found structural failures; see "
                    + str(output_path)
                )
            if args.require_release_ready:
                require_release_ready(result)
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "output": str(output_path),
                        "structural_integrity": result["structural_integrity"],
                        "decision_grade_ready": result["decision_grade_ready"],
                        "release_ready": result["release_ready"],
                        "status_counts": result["status_counts"],
                    }
                )
            )
        elif args.command == "run-attribution-readiness":
            output = build_attribution_readiness(
                args.contract_path.resolve(),
                registry_path,
                args.output_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "run_id": output["run_id"],
                        "analysis_status": output["analysis_status"],
                        "ai_attributable_increment_authorized": output[
                            "publication_authorization"
                        ]["ai_attributable_increment_authorized"],
                    }
                )
            )
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
        elif args.command == "run-scenario-suite":
            output = run_scenario_suite(
                root,
                args.contract_path.resolve(),
                args.output_path.resolve(),
            )
            print(
                json.dumps(
                    {
                        "status": "passed",
                        "suite_id": output["suite_id"],
                        "variant_count": output["variant_count"],
                        "comparison_node_count": len(output["comparison_matrix"]),
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
