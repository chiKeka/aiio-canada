from __future__ import annotations

import csv
import tempfile
import unittest
from pathlib import Path

from aiio.materials import ARCHETYPES, COMPONENT_SUFFIXES, run_material_cost_screen


class MaterialCostScreenTests(unittest.TestCase):
    def test_screen_preserves_cmas_and_computes_changes(self) -> None:
        fields = [
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
        ]
        periods = [
            ("2025-04-01", "2025-06-30", 100.0),
            ("2025-07-01", "2025-09-30", 101.0),
            ("2025-10-01", "2025-12-31", 102.0),
            ("2026-01-01", "2026-03-31", 103.0),
            ("2026-04-01", "2026-06-30", 110.0),
        ]
        rows = []
        for geography in ("CMA_825", "CMA_835"):
            for prefix in ARCHETYPES.values():
                for suffix in COMPONENT_SUFFIXES.values():
                    indicator = f"{prefix}{suffix}"
                    for index, (period_start, period_end, value) in enumerate(periods):
                        rows.append(
                            {
                                "observation_id": f"OBS_{geography}_{indicator}_{index}",
                                "indicator_id": indicator,
                                "value": value,
                                "unit": "Index, 2023=100",
                                "geography_id": geography,
                                "period_start": period_start,
                                "period_end": period_end,
                                "source_id": "STATCAN_BCPI_18100289",
                                "evidence_status": "observed",
                                "as_of_date": period_end,
                                "transformation_id": "",
                                "quality_flags": "",
                            }
                        )
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "bcpi.csv"
            with source.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=fields)
                writer.writeheader()
                writer.writerows(rows)
            result = run_material_cost_screen(
                source, root / "materials.json", root / "materials.csv"
            )
        self.assertEqual(result["observation_count"], 32)
        self.assertEqual(result["period_end"], "2026-06-30")
        sample = result["observations"][0]
        self.assertEqual(sample["index_points_since_2023_base"], 10)
        self.assertAlmostEqual(sample["quarter_over_quarter_percent_change"], 6.796)
        self.assertEqual(sample["year_over_year_percent_change"], 10)
        self.assertEqual(
            {item["geography_id"] for item in result["observations"]},
            {"CMA_825", "CMA_835"},
        )


if __name__ == "__main__":
    unittest.main()
