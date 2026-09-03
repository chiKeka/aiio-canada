import json
import tempfile
import unittest
from pathlib import Path

from aiio.schemas import ValidationError
from aiio.source_freshness import build_source_freshness_report


ROOT = Path(__file__).resolve().parents[2]


class SourceFreshnessTests(unittest.TestCase):
    def test_committed_report_is_reproducible_and_current(self):
        committed = json.loads((ROOT / "public/data/source-freshness.json").read_text())
        rebuilt = build_source_freshness_report(
            ROOT / "data/registry/sources.json", committed["as_of_date"]
        )
        self.assertEqual(rebuilt, committed)
        self.assertEqual(rebuilt["status"], "operational")
        self.assertEqual(rebuilt["stale_count"], 0)

    def test_stale_daily_source_degrades_report(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sources.json"
            registry = json.loads((ROOT / "data/registry/sources.json").read_text())
            registry["sources"] = [registry["sources"][1]]
            registry["sources"][0]["last_verified"] = "2026-01-01"
            path.write_text(json.dumps(registry))
            report = build_source_freshness_report(path, "2026-09-03")
            self.assertEqual(report["status"], "degraded")
            self.assertEqual(report["stale_source_ids"], ["TORONTO_CLEARED_BUILDING_PERMITS"])

    def test_unknown_frequency_fails_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sources.json"
            registry = json.loads((ROOT / "data/registry/sources.json").read_text())
            registry["sources"] = [registry["sources"][1]]
            registry["sources"][0]["update_frequency"] = "whenever convenient"
            path.write_text(json.dumps(registry))
            with self.assertRaises(ValidationError):
                build_source_freshness_report(path, "2026-09-03")


if __name__ == "__main__":
    unittest.main()
