from __future__ import annotations

import json
import tempfile
import unittest
from datetime import date
from pathlib import Path

from aiio.quebec_longitudinal import run_quebec_milestone_longitudinal
from aiio.quebec_vintages import (
    inventory_csv_resources,
    parse_snapshot_date,
    select_milestone_resources,
    sha256_file,
)
from aiio.schemas import ValidationError


ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = (
    ROOT
    / "data"
    / "raw"
    / "quebec_pqi_archive_catalog"
    / "2026-09-01_c3a16c24dbe0.json"
)
CONTRACT_PATH = (
    ROOT / "data" / "model" / "quebec_pqi_milestone_vintage_contract_v0.1.json"
)
REPORT_PATH = (
    ROOT / "data" / "model-runs" / "quebec_pqi_milestone_longitudinal_v0.1.json"
)
RAW_ROOT = ROOT / "data" / "raw" / "quebec_pqi_project_dashboard_vintages"


class QuebecVintageTests(unittest.TestCase):
    def test_parses_french_snapshot_dates_and_url_year_fallback(self) -> None:
        self.assertEqual(
            parse_snapshot_date(
                {
                    "name": "Tableau de bord en date du 1er novembre 2024",
                    "url": "https://www.donneesquebec.ca/file.csv",
                }
            ),
            date(2024, 11, 1),
        )
        self.assertEqual(
            parse_snapshot_date(
                {
                    "name": "Tableau de bord en date du 16 novembre",
                    "url": "https://www.donneesquebec.ca/file_2020-11-16.csv",
                }
            ),
            date(2020, 11, 16),
        )

    def test_catalog_inventory_and_milestone_selection_are_deterministic(self) -> None:
        payload = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        inventory = inventory_csv_resources(payload)
        selected = select_milestone_resources(inventory)
        self.assertEqual(len(inventory), 69)
        self.assertEqual(inventory[0]["snapshot_date"], "2020-05-19")
        self.assertEqual(inventory[-1]["snapshot_date"], "2026-08-20")
        self.assertEqual(len(selected), 10)
        self.assertEqual(selected[1]["snapshot_date"], "2020-10-26")
        self.assertEqual(selected[2]["snapshot_date"], "2020-11-16")

    def test_rejects_unparseable_or_untrusted_catalog_resource(self) -> None:
        payload = {
            "result": {
                "resources": [
                    {
                        "id": "bad",
                        "name": "Dashboard today",
                        "format": "CSV",
                        "url": "https://example.com/file.csv",
                    }
                ]
            }
        }
        with self.assertRaises(ValidationError):
            inventory_csv_resources(payload)

    def test_committed_longitudinal_panel_reproduces_and_fails_closed(self) -> None:
        expected = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
        with tempfile.TemporaryDirectory() as directory:
            output_root = Path(directory)
            actual = run_quebec_milestone_longitudinal(
                CONTRACT_PATH,
                RAW_ROOT,
                output_root / "report.json",
                output_root / "snapshots.csv",
                output_root / "lifecycles.csv",
            )
            for key in (
                "vintage_count",
                "snapshot_observation_count",
                "unique_project_count",
                "present_in_latest_project_count",
                "absent_from_latest_project_count",
                "project_with_interval_disappearance_count",
                "project_with_milestone_reentry_count",
                "threshold_transition",
                "linked_change_diagnostics",
                "vintages",
            ):
                self.assertEqual(actual[key], expected[key])
            self.assertEqual(
                actual["outputs"]["snapshot_csv_sha256"],
                sha256_file(output_root / "snapshots.csv"),
            )
            self.assertEqual(
                actual["outputs"]["lifecycle_csv_sha256"],
                sha256_file(output_root / "lifecycles.csv"),
            )
            self.assertFalse(
                actual["publication_boundary"]["complete_longitudinal_panel_authorized"]
            )
            self.assertFalse(
                actual["publication_boundary"]["ai_attributable_effect_authorized"]
            )


if __name__ == "__main__":
    unittest.main()
