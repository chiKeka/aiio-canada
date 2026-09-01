from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from aiio.calibration import run_reference_class_baseline
from aiio.project_cost import build_project_reference_cost


ROOT = Path(__file__).resolve().parents[2]


class CalibrationArtifactTests(unittest.TestCase):
    def test_committed_v01_artifact_is_locked_and_reproducible(self) -> None:
        source = ROOT / "data/processed/bcpi_alberta.csv"
        committed = (
            ROOT
            / "data/model-runs/alberta_bcpi_reference_baseline_v0.1.json"
        )
        self.assertEqual(
            hashlib.sha256(committed.read_bytes()).hexdigest(),
            "bab3878917d7ea643de095af846213c2a2079fc07c8334e87272de49508225e5",
        )
        with tempfile.TemporaryDirectory() as directory:
            regenerated_path = Path(directory) / "baseline.json"
            run_reference_class_baseline(source, regenerated_path)
            regenerated = json.loads(regenerated_path.read_text(encoding="utf-8"))
        expected = json.loads(committed.read_text(encoding="utf-8"))
        self.assertEqual(regenerated, expected)

    def test_v01_withholds_long_horizon_health_and_school_results(self) -> None:
        artifact = json.loads(
            (
                ROOT
                / "data/model-runs/alberta_bcpi_reference_baseline_v0.1.json"
            ).read_text(encoding="utf-8")
        )
        relevant = [
            result
            for result in artifact["reference_class_results"]
            if result["asset_class"]
            in {"health_facilities", "schools_and_postsecondary"}
        ]
        self.assertEqual(len(relevant), 4)
        for result in relevant:
            for horizon in result["horizons"]:
                if horizon["horizon_years"] in {4, 5}:
                    self.assertEqual(horizon["status"], "gate_failed")
                    self.assertIsNone(
                        horizon["projected_cumulative_change_percent"]
                    )
        self.assertEqual(
            artifact["ai_attributable_increment"]["status"], "not_calibrated"
        )
        self.assertIsNone(
            artifact["ai_attributable_increment"]["cost_escalation_percent"]
        )
        self.assertFalse(
            artifact["publication_authorization"][
                "public_projection_authorized"
            ]
        )

    def test_real_five_year_health_project_fails_closed(self) -> None:
        artifact = json.loads(
            (
                ROOT
                / "data/model-runs/alberta_bcpi_reference_baseline_v0.1.json"
            ).read_text(encoding="utf-8")
        )
        result = build_project_reference_cost(
            {
                "project_id": "INTEGRATION_TEST",
                "project_name": "Five-year health integration test",
                "asset_class": "health_facilities",
                "geography_id": "CMA_825",
                "current_estimate_cad": 1.0,
                "estimate_price_basis_period_end": "2026-06-30",
                "expenditure_profile": [
                    {"horizon_years": year, "share": 0.2}
                    for year in range(1, 6)
                ],
            },
            artifact,
        )
        self.assertEqual(result["status"], "not_assessed")
        self.assertEqual(
            [item["horizon_years"] for item in result["failed_horizons"]],
            [1, 2, 3, 4, 5],
        )
        self.assertIsNone(
            result["market_reference_baseline"][
                "schedule_weighted_estimate_cad"
            ]
        )


if __name__ == "__main__":
    unittest.main()
