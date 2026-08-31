from __future__ import annotations

import argparse
import json
from dataclasses import asdict
from datetime import date
from pathlib import Path

from .adapters.statcan import (
    normalize_bcpi_alberta,
    normalize_jvws_alberta,
    normalize_jvws_canada,
)
from .adapters.alberta_projects import fetch_major_projects, normalize_major_projects
from .digest import build_digest
from .registry import load_registry
from .retrieval import retrieve
from .schemas import ValidationError
from .scenario import run_scenario
from .power import run_power_overlay
from .release import build_publication_artifacts, build_release, verify_manifest


def main() -> None:
    parser = argparse.ArgumentParser(prog="aiio", description="AIIO Canada research pipeline")
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="repository root")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("validate-registry", help="validate the machine-readable source registry")

    fetch_parser = subparsers.add_parser("fetch", help="retrieve one registered public source")
    fetch_parser.add_argument("source_id")

    bcpi_parser = subparsers.add_parser("normalize-bcpi", help="normalize Alberta rows from a BCPI zip")
    bcpi_parser.add_argument("zip_path", type=Path)

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
        "fetch-major-projects",
        help="retrieve the Alberta Major Projects public full-dataset CSV export",
    )

    projects_parser = subparsers.add_parser(
        "normalize-major-projects",
        help="normalize Alberta Major Projects and classify AI-relevant records",
    )
    projects_parser.add_argument("csv_path", type=Path)
    projects_parser.add_argument("--as-of", required=True)

    digest_parser = subparsers.add_parser("build-digest", help="render a reviewed weekly evidence digest")
    digest_parser.add_argument("items_path", type=Path)
    digest_parser.add_argument("--date", default=date.today().isoformat())

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
        elif args.command == "build-digest":
            edition_date = date.fromisoformat(args.date)
            output = root / "data" / "digests" / f"{edition_date.isoformat()}.md"
            build_digest(args.items_path.resolve(), output, edition_date)
            print(json.dumps({"status": "passed", "output": str(output)}))
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
