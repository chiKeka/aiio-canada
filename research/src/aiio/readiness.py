from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import Counter
from datetime import date
from pathlib import Path
from typing import Any

from .adapters.statcan import PROVINCE_DGUID_TO_GEOGRAPHY_ID
from .digest import validate_digest_cadence
from .model_review import PACKAGE_ID as REFERENCE_COST_REVIEW_PACKAGE_ID
from .model_review import REVIEW_CRITERIA as REFERENCE_COST_REVIEW_CRITERIA
from .registry import load_registry
from .schemas import ValidationError


PASS = "pass"
PENDING = "pending"
BLOCKED = "blocked"
FAIL = "fail"
ALLOWED_STATUSES = {PASS, PENDING, BLOCKED, FAIL}
WORKBOOK_VERSION_PATTERN = re.compile(
    r"^AIIO_Canada_Research_(\d+)\.(\d+)\.(\d+)(?:-([A-Za-z0-9.-]+))?\.xlsx$"
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return f"sha256:{digest.hexdigest()}"


def select_latest_workbook(paths: list[Path]) -> Path | None:
    """Select the newest workbook using semantic version order, not filename order."""

    def version_key(path: Path) -> tuple[int, int, int, int, str, str]:
        match = WORKBOOK_VERSION_PATTERN.match(path.name)
        if match is None:
            return (-1, -1, -1, -1, "", path.name)
        major, minor, patch = (int(match.group(index)) for index in range(1, 4))
        prerelease = match.group(4)
        return (
            major,
            minor,
            patch,
            1 if prerelease is None else 0,
            prerelease or "",
            path.name,
        )

    return max(paths, key=version_key) if paths else None


def audit_program_readiness(
    root: Path,
    *,
    as_of_date: date,
    output_path: Path | None = None,
) -> dict[str, Any]:
    root = root.resolve()
    checks: list[dict[str, Any]] = []

    def record(
        check_id: str,
        category: str,
        status: str,
        summary: str,
        evidence: list[str],
        *,
        release_gate: bool,
    ) -> None:
        if status not in ALLOWED_STATUSES:
            raise ValidationError(f"invalid readiness status: {status}")
        checks.append(
            {
                "check_id": check_id,
                "category": category,
                "status": status,
                "release_gate": release_gate,
                "summary": summary,
                "evidence": evidence,
            }
        )

    charter_paths = [
        "docs/research-charter.md",
        "docs/architecture.md",
        "docs/governance/publication-policy.md",
        "docs/governance/dissertation-alignment.md",
        "docs/methodology/pspe-integration-audit.md",
    ]
    charter_missing = missing_paths(root, charter_paths)
    charter_text = read_text(root / "docs/research-charter.md")
    framing_present = (
        "AI Infrastructure Impact Observatory Canada" in charter_text
        and "How, when, and where does AI infrastructure capital expenditure" in charter_text
    )
    record(
        "formal_research_program",
        "research_design",
        PASS if not charter_missing and framing_present else FAIL,
        "The named research program, framing question, governance boundary and PSPE integration are documented."
        if not charter_missing and framing_present
        else "The formal research program documentation is incomplete.",
        charter_paths if not charter_missing else charter_missing,
        release_gate=True,
    )

    registry_path = root / "data/registry/sources.json"
    try:
        sources = load_registry(registry_path)
        registry_status = PASS
        registry_summary = f"The public-source registry validates with {len(sources)} unique sources."
    except (OSError, json.JSONDecodeError, ValidationError) as exc:
        sources = []
        registry_status = FAIL
        registry_summary = f"The public-source registry failed validation: {exc}"
    raw_manifests = sorted((root / "data/raw").glob("**/*.manifest.json"))
    if registry_status == PASS and not raw_manifests:
        registry_status = FAIL
        registry_summary = "The registry validates, but no content-hashed raw retrieval manifests exist."
    record(
        "public_evidence_registry",
        "evidence_pipeline",
        registry_status,
        registry_summary,
        ["data/registry/sources.json", f"raw_manifest_count={len(raw_manifests)}"],
        release_gate=True,
    )

    albertan_engine_paths = [
        "data/model/alberta_graph_v0.2.json",
        "data/scenarios/alberta_50b_counterfactual_v0.2.json",
        "data/model-runs/alberta_50b_counterfactual_v0.2.json",
        "data/scenarios/alberta_power_overlay_v0.1.json",
        "data/model-runs/alberta_power_overlay_v0.1.json",
        "docs/scenarios/alberta-50b-protocol.md",
    ]
    engine_missing = missing_paths(root, albertan_engine_paths)
    record(
        "alberta_graph_scenario_engine",
        "analysis_engine",
        PASS if not engine_missing else FAIL,
        "The graph engine, sealed $50B Alberta scenario, independent power overlay and protocol are present."
        if not engine_missing
        else "The Alberta analysis engine is missing required artifacts.",
        albertan_engine_paths if not engine_missing else engine_missing,
        release_gate=True,
    )

    scenario_suite_paths = [
        "data/model/alberta_50b_scenario_suite_contract_v0.1.json",
        "data/scenarios/alberta_50b_front_loaded_v0.1.json",
        "data/scenarios/alberta_50b_constrained_delivery_v0.1.json",
        "data/scenarios/alberta_50b_high_local_capture_v0.1.json",
        "data/model-runs/alberta_50b_front_loaded_v0.1.json",
        "data/model-runs/alberta_50b_constrained_delivery_v0.1.json",
        "data/model-runs/alberta_50b_high_local_capture_v0.1.json",
        "data/model-runs/alberta_50b_scenario_suite_v0.1.json",
        "docs/scenarios/alberta-50b-variant-suite.md",
    ]
    scenario_suite_missing = missing_paths(root, scenario_suite_paths)
    suite_report_path = root / "data/model-runs/alberta_50b_scenario_suite_v0.1.json"
    suite_report = load_json_or_empty(suite_report_path)
    suite_boundary = suite_report.get("publication_boundary", {})
    suite_receipts = suite_report.get("variant_run_receipts", [])
    receipt_hashes_valid = bool(suite_receipts) and all(
        isinstance(receipt, dict)
        and (root / str(receipt.get("scenario_path", ""))).is_file()
        and receipt.get("scenario_sha256")
        == sha256_file(root / str(receipt.get("scenario_path", "")))
        and (root / str(receipt.get("model_run_path", ""))).is_file()
        and receipt.get("model_run_sha256")
        == sha256_file(root / str(receipt.get("model_run_path", "")))
        for receipt in suite_receipts
    )
    scenario_suite_ready = (
        not scenario_suite_missing
        and suite_report.get("variant_count") == 4
        and len(suite_report.get("variant_summaries", [])) == 4
        and len(suite_report.get("comparison_matrix", [])) == 10
        and suite_report.get("contract_sha256")
        == sha256_file(root / scenario_suite_paths[0])
        and receipt_hashes_valid
        and suite_boundary.get("forecast_authorized") is False
        and suite_boundary.get("ai_attributable_effect_authorized") is False
        and suite_boundary.get("project_cost_or_delay_translation_authorized") is False
        and suite_boundary.get("power_requirement_inference_authorized") is False
    )
    record(
        "alberta_scenario_variant_suite",
        "analysis_engine",
        PASS if scenario_suite_ready else FAIL,
        "Four invariant-controlled Alberta scenario runs are hash-locked in a fail-closed comparison suite."
        if scenario_suite_ready
        else "The Alberta scenario comparison suite is incomplete, unreconciled or has an unsafe publication boundary.",
        scenario_suite_paths if scenario_suite_ready else scenario_suite_missing or scenario_suite_paths,
        release_gate=True,
    )

    alberta_evidence_paths = [
        "data/processed/alberta_ai_projects.csv",
        "data/processed/bcpi_alberta.csv",
        "data/processed/labour_availability_alberta.csv",
        "data/model-runs/labour_recruitment_pressure_canada_v0.1.json",
        "data/model-runs/bcpi_material_cost_screen_alberta_v0.1.json",
        "data/model-runs/public_project_exposure_alberta_v0.1.json",
        "data/model-runs/power_evidence_alberta_v0.1.json",
    ]
    alberta_missing = missing_paths(root, alberta_evidence_paths)
    record(
        "alberta_evidence_spine",
        "evidence_pipeline",
        PASS if not alberta_missing else FAIL,
        "Alberta project, price, labour, material, public-project and power evidence artifacts are present."
        if not alberta_missing
        else "The Alberta evidence spine is incomplete.",
        alberta_evidence_paths if not alberta_missing else alberta_missing,
        release_gate=True,
    )

    labour_paths = [
        root / "data/processed/labour_availability_canada.csv",
        root / "data/processed/labour_workforce_stock_canada.csv",
    ]
    expected_geographies = set(PROVINCE_DGUID_TO_GEOGRAPHY_ID.values())
    labour_geographies = csv_values(labour_paths[0], "geography_id")
    workforce_geographies = csv_values(labour_paths[1], "geography_id")
    labour_complete = (
        labour_geographies == expected_geographies
        and workforce_geographies == expected_geographies
    )
    record(
        "canada_labour_spine",
        "canada_expansion",
        PASS if labour_complete else FAIL,
        "The common vacancy/wage and workforce-stock spine covers all 13 provinces and territories."
        if labour_complete
        else "The common Canada labour spine has a geography coverage gap.",
        [
            "data/processed/labour_availability_canada.csv",
            "data/processed/labour_workforce_stock_canada.csv",
            f"vacancy_geographies={len(labour_geographies)}",
            f"workforce_geographies={len(workforce_geographies)}",
        ],
        release_gate=True,
    )

    investment_output_path = (
        root / "data/processed/building_investment_controls_canada.csv"
    )
    investment_report_path = (
        root / "data/model-runs/building_investment_controls_canada_v0.1.json"
    )
    investment_report = load_json_or_empty(investment_report_path)
    investment_control_ready = (
        investment_output_path.exists()
        and investment_report.get("output_sha256")
        == sha256_file(investment_output_path)
        and investment_report.get("province_and_territory_count") == 13
        and investment_report.get("cma_or_cma_part_count", 0) >= 30
        and investment_report.get("publication_boundary", {}).get(
            "ai_treatment_authorized"
        )
        is False
        and investment_report.get("publication_boundary", {}).get(
            "ai_attributable_effect_authorized"
        )
        is False
    )
    record(
        "regional_building_investment_controls",
        "evidence_pipeline",
        PASS if investment_control_ready else FAIL,
        "The quarterly regional building-investment control is hash-locked across 13 provinces/territories and 36 CMAs or CMA parts."
        if investment_control_ready
        else "The regional building-investment control is missing, unreconciled or has an unsafe publication boundary.",
        [
            "data/processed/building_investment_controls_canada.csv",
            "data/model-runs/building_investment_controls_canada_v0.1.json",
            "docs/methodology/regional-building-investment-controls.md",
        ],
        release_gate=True,
    )

    procurement_output_path = (
        root / "data/processed/canadabuys_construction_outcome_feasibility.csv"
    )
    procurement_report_path = (
        root
        / "data/model-runs/canadabuys_construction_outcome_feasibility_v0.1.json"
    )
    procurement_report = load_json_or_empty(procurement_report_path)
    procurement_rows = csv_row_count(procurement_output_path)
    procurement_boundary = procurement_report.get("publication_boundary", {})
    procurement_feasibility_ready = (
        procurement_output_path.exists()
        and procurement_report.get("output_sha256")
        == sha256_file(procurement_output_path)
        and procurement_report.get("construction_linkage_count") == procurement_rows
        and procurement_rows > 0
        and procurement_report.get("cma_geography_count") == 0
        and procurement_report.get("field_availability", {}).get(
            "compliant_bidder_count"
        )
        == 0
        and procurement_boundary.get("public_project_cost_outcome_authorized")
        is False
        and procurement_boundary.get("public_project_schedule_outcome_authorized")
        is False
        and procurement_boundary.get("procurement_competition_outcome_authorized")
        is False
        and procurement_boundary.get("ai_attributable_effect_authorized") is False
    )
    record(
        "federal_procurement_outcome_feasibility",
        "evidence_pipeline",
        PASS if procurement_feasibility_ready else FAIL,
        "The CanadaBuys construction intake is hash-locked and proves useful procurement fields without authorizing project outcomes."
        if procurement_feasibility_ready
        else "The CanadaBuys feasibility artifact is missing, unreconciled or has an unsafe publication boundary.",
        [
            "data/processed/canadabuys_construction_outcome_feasibility.csv",
            "data/model-runs/canadabuys_construction_outcome_feasibility_v0.1.json",
            "docs/methodology/canadabuys-procurement-outcome-intake.md",
        ],
        release_gate=True,
    )

    provincial_paths = [
        "data/model-runs/public_projects_bc_on_qc_intake_v0.1.json",
        "data/model-runs/bcpi_material_cost_screen_provinces_v0.1.json",
        "data/model-runs/bc_on_qc_bcpi_reference_baseline_v0.1.json",
        "data/model-runs/provincial_power_planning_contract_v0.1.json",
    ]
    provincial_missing = missing_paths(root, provincial_paths)
    provincial_safe = False
    provincial_summary = "The BC, Ontario and Quebec evidence intake is incomplete."
    if not provincial_missing:
        projects = load_json(root / provincial_paths[0])
        baseline = load_json(root / provincial_paths[2])
        power = load_json(root / provincial_paths[3])
        provincial_project_rows = csv_row_count(
            root / "data/processed/public_projects_bc_on_qc.csv"
        )
        provincial_power_rows = csv_row_count(
            root / "data/processed/provincial_power_planning_metrics.csv"
        )
        provincial_safe = (
            projects.get("record_count") == provincial_project_rows
            and provincial_project_rows > 0
            and projects.get("publication_boundary", {}).get(
                "public_project_exposure_authorized"
            )
            is False
            and baseline.get("publication_authorization", {}).get(
                "public_projection_authorized"
            )
            is False
            and power.get("metric_count") == provincial_power_rows
            and provincial_power_rows > 0
            and power.get("publication_boundary", {}).get(
                "provincial_power_profile_authorized"
            )
            is False
            and power.get("publication_boundary", {}).get(
                "transmission_requirement_authorized"
            )
            is False
        )
        provincial_summary = (
            "The BC, Ontario and Quebec project, cost and power intakes are reproducible and remain research-only."
            if provincial_safe
            else "A provincial intake count or fail-closed publication boundary changed unexpectedly."
        )
    record(
        "provincial_pilot_intake",
        "canada_expansion",
        PASS if not provincial_missing and provincial_safe else FAIL,
        provincial_summary,
        provincial_paths if not provincial_missing else provincial_missing,
        release_gate=True,
    )

    quebec_summary_path = (
        root / "data/processed/quebec_pqi_authorized_project_revisions.csv"
    )
    quebec_event_path = root / "data/processed/quebec_pqi_authorized_revision_events.csv"
    quebec_report_path = (
        root / "data/model-runs/quebec_pqi_authorized_project_revisions_v0.1.json"
    )
    quebec_report = load_json_or_empty(quebec_report_path)
    quebec_coverage = quebec_report.get("coverage_summary", {})
    quebec_boundary = quebec_report.get("publication_boundary", {})
    quebec_summary_rows = csv_row_count(quebec_summary_path)
    quebec_event_rows = csv_row_count(quebec_event_path)
    quebec_revision_panel_ready = (
        quebec_summary_path.exists()
        and quebec_event_path.exists()
        and quebec_report.get("outputs", {}).get("summary_csv_sha256")
        == sha256_file(quebec_summary_path)
        and quebec_report.get("outputs", {}).get("event_csv_sha256")
        == sha256_file(quebec_event_path)
        and quebec_coverage.get("source_project_count") == quebec_summary_rows
        and quebec_coverage.get("stable_lifecycle_project_id_count")
        == quebec_summary_rows
        and quebec_coverage.get("authorized_cost_revision_event_count", 0)
        + quebec_coverage.get("authorized_schedule_revision_event_count", 0)
        == quebec_event_rows
        and quebec_coverage.get("cost_revision_chain_reconciled_project_count", 0)
        > 0
        and quebec_coverage.get(
            "schedule_revision_chain_reconciled_project_count", 0
        )
        > 0
        and quebec_boundary.get("authorized_revision_reference_panel_authorized")
        is False
        and quebec_boundary.get("public_project_cost_outcome_authorized") is False
        and quebec_boundary.get("public_project_schedule_outcome_authorized")
        is False
        and quebec_boundary.get("ai_attributable_effect_authorized") is False
    )
    record(
        "quebec_authorized_revision_panel",
        "evidence_pipeline",
        PASS if quebec_revision_panel_ready else FAIL,
        (
            "The Quebec lifecycle panel is hash-reconciled, preserves stable project IDs and authorized revision chains, and remains research-only."
            if quebec_revision_panel_ready
            else "The Quebec authorized-revision panel is missing, unreconciled or has an unsafe publication boundary."
        ),
        [
            "data/processed/quebec_pqi_authorized_project_revisions.csv",
            "data/processed/quebec_pqi_authorized_revision_events.csv",
            "data/model-runs/quebec_pqi_authorized_project_revisions_v0.1.json",
            "docs/methodology/quebec-authorized-project-revisions.md",
        ],
        release_gate=True,
    )

    quebec_vintage_contract_path = (
        root / "data/model/quebec_pqi_milestone_vintage_contract_v0.1.json"
    )
    quebec_longitudinal_report_path = (
        root / "data/model-runs/quebec_pqi_milestone_longitudinal_v0.1.json"
    )
    quebec_snapshot_path = (
        root / "data/processed/quebec_pqi_milestone_project_vintages.csv"
    )
    quebec_lifecycle_path = (
        root / "data/processed/quebec_pqi_milestone_project_lifecycles.csv"
    )
    quebec_review_package_path = (
        root / "data/model-runs/quebec_pqi_parser_review_package_v0.1.json"
    )
    quebec_review_path = (
        root / "data/reviews/quebec_pqi_parser_review_sample_v0.1.csv"
    )
    quebec_vintage_contract = load_json_or_empty(quebec_vintage_contract_path)
    quebec_longitudinal = load_json_or_empty(quebec_longitudinal_report_path)
    quebec_review = load_json_or_empty(quebec_review_package_path)
    quebec_snapshot_rows = csv_row_count(quebec_snapshot_path)
    quebec_lifecycle_rows = csv_row_count(quebec_lifecycle_path)
    quebec_review_rows = csv_row_count(quebec_review_path)
    quebec_longitudinal_ready = (
        quebec_vintage_contract_path.exists()
        and quebec_longitudinal_report_path.exists()
        and quebec_snapshot_path.exists()
        and quebec_lifecycle_path.exists()
        and quebec_review_package_path.exists()
        and quebec_review_path.exists()
        and quebec_vintage_contract.get("selected_vintage_count") == 10
        and quebec_vintage_contract.get("catalog_csv_resource_count") == 69
        and quebec_vintage_contract.get("selection_rule", {}).get(
            "complete_monthly_panel"
        )
        is False
        and quebec_longitudinal.get("snapshot_observation_count")
        == quebec_snapshot_rows
        and quebec_longitudinal.get("unique_project_count")
        == quebec_lifecycle_rows
        and quebec_longitudinal.get("outputs", {}).get("snapshot_csv_sha256")
        == sha256_file(quebec_snapshot_path)
        and quebec_longitudinal.get("outputs", {}).get("lifecycle_csv_sha256")
        == sha256_file(quebec_lifecycle_path)
        and quebec_longitudinal.get("publication_boundary", {}).get(
            "complete_longitudinal_panel_authorized"
        )
        is False
        and quebec_longitudinal.get("publication_boundary", {}).get(
            "project_exit_outcome_authorized"
        )
        is False
        and quebec_review.get("sample_project_count") == quebec_review_rows
        and quebec_review.get("review_output", {}).get("content_hash")
        == sha256_file(quebec_review_path)
        and quebec_review.get("publication_boundary", {}).get(
            "independent_parser_review_complete"
        )
        is False
        and quebec_review.get("publication_boundary", {}).get(
            "parser_authorized_for_decision_use"
        )
        is False
    )
    record(
        "quebec_milestone_longitudinal_panel",
        "evidence_pipeline",
        PASS if quebec_longitudinal_ready else FAIL,
        (
            "The Quebec archive selection, milestone lifecycle diagnostics and stratified parser-review package reproduce and remain explicitly non-authorizing."
            if quebec_longitudinal_ready
            else "The Quebec longitudinal or parser-review artifact is missing, unreconciled or has an unsafe publication boundary."
        ),
        [
            "data/model/quebec_pqi_milestone_vintage_contract_v0.1.json",
            "data/model-runs/quebec_pqi_milestone_longitudinal_v0.1.json",
            "data/processed/quebec_pqi_milestone_project_vintages.csv",
            "data/processed/quebec_pqi_milestone_project_lifecycles.csv",
            "data/model-runs/quebec_pqi_parser_review_package_v0.1.json",
            "data/reviews/quebec_pqi_parser_review_sample_v0.1.csv",
            "docs/methodology/quebec-milestone-longitudinal-panel.md",
        ],
        release_gate=True,
    )

    quebec_full_contract_path = (
        root / "data/model/quebec_pqi_full_archive_contract_v0.1.json"
    )
    quebec_full_report_path = (
        root / "data/model-runs/quebec_pqi_full_archive_longitudinal_v0.1.json"
    )
    quebec_full_snapshot_path = (
        root / "data/processed/quebec_pqi_full_archive_project_vintages.csv"
    )
    quebec_full_lifecycle_path = (
        root / "data/processed/quebec_pqi_full_archive_project_lifecycles.csv"
    )
    quebec_full_transition_path = (
        root / "data/processed/quebec_pqi_full_archive_transitions.csv"
    )
    quebec_full_contract = load_json_or_empty(quebec_full_contract_path)
    quebec_full_report = load_json_or_empty(quebec_full_report_path)
    quebec_full_boundary = quebec_full_report.get("publication_boundary", {})
    quebec_full_snapshot_rows = csv_row_count(quebec_full_snapshot_path)
    quebec_full_lifecycle_rows = csv_row_count(quebec_full_lifecycle_path)
    quebec_full_transition_rows = csv_row_count(quebec_full_transition_path)
    quebec_full_archive_ready = (
        quebec_full_contract_path.exists()
        and quebec_full_report_path.exists()
        and quebec_full_snapshot_path.exists()
        and quebec_full_lifecycle_path.exists()
        and quebec_full_transition_path.exists()
        and quebec_full_contract.get("snapshot_date_count") == 69
        and quebec_full_contract.get("direct_csv_snapshot_count") == 68
        and quebec_full_contract.get("paired_xlsx_fallback_count") == 1
        and quebec_full_report.get("snapshot_date_count") == 69
        and quebec_full_report.get("snapshot_observation_count")
        == quebec_full_snapshot_rows
        and quebec_full_report.get("unique_project_count")
        == quebec_full_lifecycle_rows
        and quebec_full_transition_rows == 68
        and quebec_full_report.get("outputs", {}).get("snapshot_csv_sha256")
        == sha256_file(quebec_full_snapshot_path)
        and quebec_full_report.get("outputs", {}).get("lifecycle_csv_sha256")
        == sha256_file(quebec_full_lifecycle_path)
        and quebec_full_report.get("outputs", {}).get("transition_csv_sha256")
        == sha256_file(quebec_full_transition_path)
        and quebec_full_boundary.get("catalog_snapshot_coverage_complete") is True
        and quebec_full_boundary.get("all_snapshots_parsed_directly_from_csv")
        is False
        and quebec_full_boundary.get("publisher_declared_retirement_is_final_outcome")
        is False
        and quebec_full_boundary.get("project_exit_outcome_authorized") is False
        and quebec_full_boundary.get("public_project_cost_outcome_authorized")
        is False
        and quebec_full_boundary.get("public_project_schedule_outcome_authorized")
        is False
        and quebec_full_boundary.get("ai_attributable_effect_authorized") is False
    )
    record(
        "quebec_complete_catalog_longitudinal_panel",
        "evidence_pipeline",
        PASS if quebec_full_archive_ready else FAIL,
        (
            "All 69 Quebec catalog dates, stable-ID transitions and the official paired-XLSX fallback reproduce while outcome and AI-effect claims remain closed."
            if quebec_full_archive_ready
            else "The Quebec complete-catalog panel is missing, unreconciled or has an unsafe publication boundary."
        ),
        [
            "data/model/quebec_pqi_full_archive_contract_v0.1.json",
            "data/model-runs/quebec_pqi_full_archive_longitudinal_v0.1.json",
            "data/processed/quebec_pqi_full_archive_project_vintages.csv",
            "data/processed/quebec_pqi_full_archive_project_lifecycles.csv",
            "data/processed/quebec_pqi_full_archive_transitions.csv",
            "docs/methodology/quebec-full-archive-longitudinal-panel.md",
        ],
        release_gate=True,
    )

    digest_status, digest_summary, digest_evidence = audit_digest_artifacts(
        root, as_of_date=as_of_date
    )
    record(
        "weekly_evidence_operation",
        "living_program",
        digest_status,
        digest_summary,
        digest_evidence,
        release_gate=True,
    )

    product_paths = [
        "app/page.tsx",
        "app/scenario/page.tsx",
        "app/pressure/page.tsx",
        "app/evidence/page.tsx",
        "app/digest/page.tsx",
        "app/methods/page.tsx",
        "app/research/page.tsx",
        "app/downloads/page.tsx",
        "components/mode-toggle.tsx",
        "components/decision-workbench.tsx",
        "components/impact-path-graph.tsx",
        "scripts/a11y-audit.mjs",
        ".github/workflows/quality.yml",
    ]
    product_missing = missing_paths(root, product_paths)
    record(
        "dual_mode_public_product",
        "product",
        PASS if not product_missing else FAIL,
        "The executive/research dual-mode website, dependency graph, evidence routes and automated quality gates are implemented."
        if not product_missing
        else "The public product surface or its quality tooling is incomplete.",
        product_paths if not product_missing else product_missing,
        release_gate=True,
    )

    workbook_candidates = list(
        (root / "outputs/01a0579f-936b-77b3-93e5-be6035628b16").glob(
            "AIIO_Canada_Research_*.xlsx"
        )
    )
    workbook_ok = False
    workbook_evidence: list[str] = []
    if workbook_candidates:
        workbook_path = select_latest_workbook(workbook_candidates)
        if workbook_path is None:
            raise AssertionError("workbook candidate selection unexpectedly returned none")
        inspect_path = workbook_path.with_suffix(workbook_path.suffix + ".inspect.ndjson")
        workbook_ok = inspect_path.exists()
        workbook_evidence = [
            str(workbook_path.relative_to(root)),
            f"workbook_sha256={sha256_file(workbook_path)}",
            str(inspect_path.relative_to(root)) if inspect_path.exists() else "inspection_sidecar_missing",
        ]
    record(
        "auditable_workbook_component",
        "product",
        PASS if workbook_ok else FAIL,
        "The Canada development workbook and its formula/structure inspection receipt are present."
        if workbook_ok
        else "The Canada development workbook or inspection receipt is missing.",
        workbook_evidence or ["outputs/.../AIIO_Canada_Research_*.xlsx"],
        release_gate=True,
    )

    release_status, release_summary, release_evidence = audit_frozen_release(root)
    record(
        "frozen_public_release_integrity",
        "release",
        release_status,
        release_summary,
        release_evidence,
        release_gate=True,
    )

    alberta_baseline = load_json_or_empty(
        root / "data/model-runs/alberta_bcpi_reference_baseline_v0.1.json"
    )
    reference_review_path = (
        root / "data/model-runs/alberta_reference_cost_review_package_v0.1.json"
    )
    reference_review = load_json_or_empty(reference_review_path)
    review_manifest = reference_review.get("input_manifest", [])
    review_manifest_ok = isinstance(review_manifest, list) and len(review_manifest) == 10
    if review_manifest_ok:
        for item in review_manifest:
            try:
                relative_path = Path(item["path"])
                resolved_path = (root / relative_path).resolve()
                resolved_path.relative_to(root)
                entry_ok = (
                    not relative_path.is_absolute()
                    and resolved_path.is_file()
                    and item.get("sha256") == sha256_file(resolved_path)
                )
            except (KeyError, TypeError, ValueError, OSError):
                entry_ok = False
            if not entry_ok:
                review_manifest_ok = False
                break
    review_boundary = reference_review.get("publication_boundary", {})
    reference_review_ready = (
        reference_review_path.exists()
        and reference_review.get("package_id") == REFERENCE_COST_REVIEW_PACKAGE_ID
        and reference_review.get("review_status") == "pending_independent_review"
        and review_manifest_ok
        and len(reference_review.get("required_criteria", []))
        == len(REFERENCE_COST_REVIEW_CRITERIA)
        and reference_review.get("model_artifact_sha256")
        == sha256_file(
            root / "data/model-runs/alberta_bcpi_reference_baseline_v0.1.json"
        )
        and review_boundary.get("independent_review_complete") is False
        and review_boundary.get("public_projection_authorized") is False
        and review_boundary.get("ai_attributable_effect_authorized") is False
        and review_boundary.get("project_cost_translation_authorized") is False
    )
    record(
        "reference_cost_review_instrument",
        "governance",
        PASS if reference_review_ready else FAIL,
        "The Alberta E1 review packet hash-locks the model, method, tests and ten-criterion verdict contract while remaining non-authorizing."
        if reference_review_ready
        else "The Alberta E1 review packet is missing, stale or has an unsafe authorization boundary.",
        [
            "data/model-runs/alberta_reference_cost_review_package_v0.1.json",
            "docs/reviews/2026-09-01-reference-cost-review-prompt.md",
            "research/src/aiio/model_review.py",
        ],
        release_gate=True,
    )
    historical_envelope_path = (
        root / "data/model-runs/alberta_bcpi_historical_envelope_v0.1.json"
    )
    historical_envelope = load_json_or_empty(historical_envelope_path)
    historical_boundary = historical_envelope.get("publication_authorization", {})
    historical_results = historical_envelope.get("reference_class_results", [])
    historical_envelope_ready = (
        historical_envelope_path.exists()
        and historical_envelope.get("input_sha256")
        == sha256_file(root / "data/processed/bcpi_alberta.csv").removeprefix("sha256:")
        and historical_envelope.get("code_sha256")
        == sha256_file(root / "research/src/aiio/historical_envelope.py").removeprefix(
            "sha256:"
        )
        and historical_boundary.get("historical_summary_authorized") is True
        and historical_boundary.get("future_projection_authorized") is False
        and historical_boundary.get("ai_attributable_effect_authorized") is False
        and historical_boundary.get("project_cost_translation_authorized") is False
        and len(historical_results) == 8
        and all(len(item.get("horizons", [])) == 5 for item in historical_results)
    )
    record(
        "alberta_historical_cost_envelope",
        "decision_support",
        PASS if historical_envelope_ready else FAIL,
        "The Alberta product exposes hash-locked descriptive 1-5 year BCPI history while future, AI-effect and project-cost translations remain closed."
        if historical_envelope_ready
        else "The Alberta historical cost envelope is missing, unreconciled or has an unsafe publication boundary.",
        [
            "data/processed/bcpi_alberta.csv",
            "data/model-runs/alberta_bcpi_historical_envelope_v0.1.json",
            "research/src/aiio/historical_envelope.py",
            "docs/methodology/historical-cost-envelope.md",
        ],
        release_gate=True,
    )
    projection_authorized = alberta_baseline.get("publication_authorization", {}).get(
        "public_projection_authorized"
    ) is True
    record(
        "alberta_reference_cost_projection",
        "decision_grade_outputs",
        PASS if projection_authorized else PENDING,
        "The Alberta reference-cost projection is independently authorized."
        if projection_authorized
        else "The reproducible Alberta reference-cost run is built, but publication remains withheld pending independent modelling review.",
        ["data/model-runs/alberta_bcpi_reference_baseline_v0.1.json"],
        release_gate=True,
    )

    attribution_contract_path = root / "data/model/ai_attribution_panel_contract_v0.1.json"
    attribution_run_path = (
        root / "data/model-runs/ai_attribution_identification_readiness_v0.1.json"
    )
    attribution_run = load_json_or_empty(attribution_run_path)
    attribution_contract_ready = (
        attribution_contract_path.exists()
        and attribution_run.get("analysis_status") == "not_assessed"
        and attribution_run.get("publication_authorization", {}).get(
            "ai_attributable_increment_authorized"
        )
        is False
        and attribution_run.get("publication_authorization", {}).get(
            "cost_escalation_percent"
        )
        is None
        and attribution_run.get("publication_authorization", {}).get(
            "schedule_delay_days"
        )
        is None
    )
    record(
        "causal_attribution_workstream",
        "research_design",
        PASS if attribution_contract_ready else FAIL,
        "The E2 treatment/outcome panel contract and fail-closed identification-readiness pipeline are implemented."
        if attribution_contract_ready
        else "The E2 attribution contract or its fail-closed readiness artifact is missing or unsafe.",
        [
            "data/model/ai_attribution_panel_contract_v0.1.json",
            "data/model-runs/ai_attribution_identification_readiness_v0.1.json",
            "docs/methodology/ai-attribution-identification.md",
        ],
        release_gate=True,
    )

    ai_increment = alberta_baseline.get("ai_attributable_increment", {})
    ai_calibrated = ai_increment.get("status") == "calibrated"
    record(
        "ai_attributable_cost_schedule_effect",
        "decision_grade_outputs",
        PASS if ai_calibrated else PENDING,
        "A reviewed AI-attributable cost and schedule effect is calibrated."
        if ai_calibrated
        else "No historical treatment/counterfactual panel yet identifies an AI-attributable cost or schedule effect; the product correctly returns null.",
        ["data/model-runs/alberta_bcpi_reference_baseline_v0.1.json"],
        release_gate=True,
    )

    provincial_baseline = load_json_or_empty(
        root / "data/model-runs/bc_on_qc_bcpi_reference_baseline_v0.1.json"
    )
    province_projection_authorized = provincial_baseline.get(
        "publication_authorization", {}
    ).get("public_projection_authorized") is True
    record(
        "provincial_decision_models",
        "decision_grade_outputs",
        PASS if province_projection_authorized else PENDING,
        "Comparable provincial decision models are independently authorized."
        if province_projection_authorized
        else "BC, Ontario and Quebec evidence exists, but the locked history gate leaves all provincial projections unassessed and null.",
        ["data/model-runs/bc_on_qc_bcpi_reference_baseline_v0.1.json"],
        release_gate=True,
    )

    external_gates_path = root / "data/governance/program-gates.json"
    external_gates = load_json_or_empty(external_gates_path)
    review_states = [
        external_gates.get("independent_review", {}).get("grok", {}).get("status"),
        external_gates.get("independent_review", {}).get("claude", {}).get("status"),
    ]
    reviews_passed = bool(review_states) and all(state == "passed" for state in review_states)
    reviews_blocked = any(state in {"blocked", "held"} for state in review_states)
    record(
        "independent_review",
        "governance",
        PASS if reviews_passed else (BLOCKED if reviews_blocked else PENDING),
        "Both independent review tracks have recorded passing verdicts."
        if reviews_passed
        else "Independent review is not complete; no passing verdict is inferred from a prepared review package.",
        ["data/governance/program-gates.json", "docs/reviews/2026-09-01-grok-digest-workbook-gate.md"],
        release_gate=True,
    )

    deployment_state = external_gates.get("deployment", {}).get("status")
    deployment_passed = deployment_state == "published"
    deployment_blocked = deployment_state == "held"
    record(
        "current_publication",
        "release",
        PASS if deployment_passed else (BLOCKED if deployment_blocked else PENDING),
        "The current reviewed candidate is published and reconciled."
        if deployment_passed
        else "Publication is held; the live/public bundle remains on the frozen 0.6.0-dev basis.",
        ["data/governance/program-gates.json", "public/data/manifest.json"],
        release_gate=True,
    )

    result = summarize_readiness(checks, as_of_date=as_of_date)
    if output_path is not None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
    return result


def audit_digest_artifacts(
    root: Path, *, as_of_date: date
) -> tuple[str, str, list[str]]:
    items_dir = root / "data/digests/items"
    try:
        cadence = validate_digest_cadence(items_dir, as_of_date=as_of_date)
        edition = cadence["latest_edition"]
        items_path = items_dir / f"{edition}.json"
        markdown_path = root / "data/digests" / f"{edition}.md"
        manifest_path = root / "data/digests" / f"{edition}.manifest.json"
        manifest = load_json(manifest_path)
        registry_path = root / "data/registry/sources.json"
        hashes_match = (
            manifest.get("items_sha256") == sha256_file(items_path)
            and manifest.get("markdown_sha256") == sha256_file(markdown_path)
            and manifest.get("source_registry_sha256") == sha256_file(registry_path)
            and manifest.get("automatic_model_change") is False
            and manifest.get("publication_boundary", {}).get("model_parameters_changed")
            is False
            and manifest.get("publication_boundary", {}).get("baseline_changed") is False
        )
        if not hashes_match:
            return (
                FAIL,
                "The current digest cadence passes, but an artifact hash or publication boundary does not reconcile.",
                [str(manifest_path.relative_to(root))],
            )
        return (
            PASS,
            f"The weekly digest is current at {edition}, hash-reconciled and cannot change the model automatically.",
            [
                str(items_path.relative_to(root)),
                str(markdown_path.relative_to(root)),
                str(manifest_path.relative_to(root)),
                f"age_days={cadence['age_days']}",
            ],
        )
    except (OSError, KeyError, json.JSONDecodeError, ValidationError) as exc:
        return FAIL, f"The weekly evidence operation failed audit: {exc}", ["data/digests"]


def audit_frozen_release(root: Path) -> tuple[str, str, list[str]]:
    public_manifest_path = root / "public/data/manifest.json"
    public_latest_path = root / "public/data/latest.json"
    try:
        manifest = load_json(public_manifest_path)
        latest = load_json(public_latest_path)
        version = manifest["version"]
        release_dir = root / "data/releases" / version
        release_manifest_path = release_dir / "manifest.json"
        release_manifest = load_json(release_manifest_path)
        if latest.get("manifest") != manifest or release_manifest != manifest:
            raise ValidationError("public and immutable release manifests disagree")
        for filename, expected_hash in manifest.get("outputs", {}).items():
            path = release_dir / filename
            if not path.exists() or sha256_file(path) != expected_hash:
                raise ValidationError(f"release output hash mismatch: {filename}")
        return (
            PASS,
            f"The frozen public release {version} reconciles to its immutable manifest and output hashes.",
            [
                "public/data/manifest.json",
                "public/data/latest.json",
                str(release_manifest_path.relative_to(root)),
            ],
        )
    except (OSError, KeyError, json.JSONDecodeError, ValidationError) as exc:
        return FAIL, f"The frozen public release failed integrity audit: {exc}", ["public/data"]


def summarize_readiness(
    checks: list[dict[str, Any]], *, as_of_date: date
) -> dict[str, Any]:
    if not checks:
        raise ValidationError("program readiness requires at least one check")
    counts = Counter(check["status"] for check in checks)
    invalid = set(counts) - ALLOWED_STATUSES
    if invalid:
        raise ValidationError(f"invalid readiness statuses: {sorted(invalid)}")
    release_checks = [check for check in checks if check.get("release_gate")]
    structural_integrity = counts[FAIL] == 0
    release_ready = structural_integrity and all(
        check["status"] == PASS for check in release_checks
    )
    decision_grade_ready = structural_integrity and all(
        check["status"] == PASS
        for check in checks
        if check["category"] in {"decision_grade_outputs", "governance"}
    )
    return {
        "schema_version": "1.0.0",
        "audit_id": f"AIIO_PROGRAM_READINESS_{as_of_date.isoformat().replace('-', '_')}",
        "as_of_date": as_of_date.isoformat(),
        "program_name": "AI Infrastructure Impact Observatory Canada",
        "structural_integrity": structural_integrity,
        "decision_grade_ready": decision_grade_ready,
        "release_ready": release_ready,
        "publication_ready": release_ready,
        "status_counts": {
            status: counts.get(status, 0) for status in (PASS, PENDING, BLOCKED, FAIL)
        },
        "checks": checks,
    }


def require_release_ready(report: dict[str, Any]) -> None:
    if not report.get("release_ready"):
        unresolved = [
            check["check_id"]
            for check in report.get("checks", [])
            if check.get("release_gate") and check.get("status") != PASS
        ]
        raise ValidationError(
            "program is not release-ready; unresolved gates: " + ", ".join(unresolved)
        )


def missing_paths(root: Path, paths: list[str]) -> list[str]:
    return [path for path in paths if not (root / path).exists()]


def csv_values(path: Path, field: str) -> set[str]:
    try:
        with path.open(encoding="utf-8") as handle:
            return {row[field] for row in csv.DictReader(handle) if row.get(field)}
    except (OSError, KeyError):
        return set()


def csv_row_count(path: Path) -> int:
    try:
        with path.open(encoding="utf-8") as handle:
            return sum(1 for _ in csv.DictReader(handle))
    except OSError:
        return 0


def load_json(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValidationError(f"expected a JSON object: {path}")
    return payload


def load_json_or_empty(path: Path) -> dict[str, Any]:
    try:
        return load_json(path)
    except (OSError, json.JSONDecodeError, ValidationError):
        return {}


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return ""
