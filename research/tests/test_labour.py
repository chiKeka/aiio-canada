from __future__ import annotations

import csv
import tempfile
import unittest
from pathlib import Path

from aiio.adapters.statcan import PROVINCE_DGUID_TO_GEOGRAPHY_ID, TRADE_NOC_TO_NODE
from aiio.labour import run_labour_recruitment_pressure


class LabourPressureTests(unittest.TestCase):
    def test_cross_vintage_metric_preserves_missingness_and_zero_denominators(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            vacancy_path = root / "vacancies.csv"
            workforce_path = root / "workforce.csv"
            output_path = root / "output.json"
            self._write_vacancies(vacancy_path)
            self._write_workforce(workforce_path)
            output = run_labour_recruitment_pressure(
                vacancy_path, workforce_path, output_path
            )

            self.assertEqual(len(output["occupation_diagnostics"]), 78)
            self.assertEqual(len(output["trade_diagnostics"]), 52)
            alberta_electrician = next(
                item
                for item in output["occupation_diagnostics"]
                if item["geography_id"] == "PR_48" and item["noc_code"] == "72200"
            )
            self.assertEqual(
                alberta_electrician["vacancies_per_1_000_2021_employed"], 50.0
            )
            alberta_power = next(
                item
                for item in output["occupation_diagnostics"]
                if item["geography_id"] == "PR_48" and item["noc_code"] == "72203"
            )
            self.assertEqual(alberta_power["availability"], "vacancy_not_published")
            self.assertIsNone(alberta_power["vacancies_per_1_000_2021_employed"])
            pei_zero = next(
                item
                for item in output["occupation_diagnostics"]
                if item["geography_id"] == "PR_11" and item["noc_code"] == "72202"
            )
            self.assertEqual(pei_zero["availability"], "workforce_denominator_zero")
            self.assertIsNone(pei_zero["vacancies_per_1_000_2021_employed"])

    def _write_vacancies(self, path: Path) -> None:
        fieldnames = (
            "geography_id",
            "geography_label",
            "noc_code",
            "occupation_label",
            "trade_node_id",
            "statistic",
            "value",
            "unit",
            "period_end",
            "quality_flags",
        )
        rows = []
        for geography_id in PROVINCE_DGUID_TO_GEOGRAPHY_ID.values():
            for noc_code, trade_node_id in TRADE_NOC_TO_NODE.items():
                value = ""
                flags = "status:F|value_missing_or_suppressed"
                if not (geography_id == "PR_48" and noc_code == "72203"):
                    value = "50"
                    flags = "status:A"
                rows.append(
                    {
                        "geography_id": geography_id,
                        "geography_label": geography_id,
                        "noc_code": noc_code,
                        "occupation_label": f"Occupation {noc_code}",
                        "trade_node_id": trade_node_id,
                        "statistic": "Job vacancies",
                        "value": value,
                        "unit": "Number",
                        "period_end": "2026-03-31",
                        "quality_flags": flags,
                    }
                )
                rows.append(
                    {
                        "geography_id": geography_id,
                        "geography_label": geography_id,
                        "noc_code": noc_code,
                        "occupation_label": f"Occupation {noc_code}",
                        "trade_node_id": trade_node_id,
                        "statistic": "Average offered hourly wage",
                        "value": "40",
                        "unit": "Dollars",
                        "period_end": "2026-03-31",
                        "quality_flags": "status:A",
                    }
                )
        with path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    def _write_workforce(self, path: Path) -> None:
        fieldnames = (
            "geography_id",
            "noc_code",
            "value",
            "unit",
            "period_start",
            "period_end",
            "quality_flags",
        )
        rows = []
        for geography_id in PROVINCE_DGUID_TO_GEOGRAPHY_ID.values():
            for noc_code in TRADE_NOC_TO_NODE:
                is_zero = geography_id == "PR_11" and noc_code == "72202"
                rows.append(
                    {
                        "geography_id": geography_id,
                        "noc_code": noc_code,
                        "value": "0" if is_zero else "1000",
                        "unit": "Persons",
                        "period_start": "2021-05-02",
                        "period_end": "2021-05-08",
                        "quality_flags": "census_zero_filler" if is_zero else "random_rounding",
                    }
                )
        with path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)


if __name__ == "__main__":
    unittest.main()
