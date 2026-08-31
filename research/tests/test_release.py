from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from aiio.release import latest_labour_availability, sha256_file, verify_manifest, write_json
from aiio.schemas import ValidationError


class ReleaseVerificationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.root = Path(self.temporary_directory.name)
        self.version = "test"
        self.release_dir = self.root / "data" / "releases" / self.version
        self.public_dir = self.root / "public" / "data"
        self.release_dir.mkdir(parents=True)
        self.public_dir.mkdir(parents=True)
        self.input_path = self.root / "input.json"
        self.output_path = self.release_dir / "output.json"
        self.input_path.write_text('{"value": 1}\n', encoding="utf-8")
        self.output_path.write_text('{"result": 2}\n', encoding="utf-8")
        self.manifest = {
            "code_commit": "abc123",
            "inputs": {"input": sha256_file(self.input_path)},
            "outputs": {"output.json": sha256_file(self.output_path)},
        }
        write_json(self.release_dir / "manifest.json", self.manifest)
        write_json(self.public_dir / "latest.json", {"manifest": self.manifest})

    def verify(self) -> None:
        with (
            patch("aiio.release.release_input_paths", return_value={"input": self.input_path}),
            patch("aiio.release.git_state", return_value=("abc123", False)),
        ):
            verify_manifest(self.root, self.version)

    def test_verifier_accepts_matching_inputs_outputs_and_commit(self) -> None:
        self.verify()

    def test_verifier_rejects_tampered_input(self) -> None:
        self.input_path.write_text('{"value": 9}\n', encoding="utf-8")
        with self.assertRaisesRegex(ValidationError, "input hash mismatch"):
            self.verify()

    def test_verifier_rejects_extra_manifest_input(self) -> None:
        self.manifest["inputs"]["undeclared"] = "sha256:not-used"
        write_json(self.release_dir / "manifest.json", self.manifest)
        write_json(self.public_dir / "latest.json", {"manifest": self.manifest})
        with self.assertRaisesRegex(ValidationError, "key set"):
            self.verify()

    def test_verifier_rejects_wrong_checked_out_commit(self) -> None:
        with (
            patch("aiio.release.release_input_paths", return_value={"input": self.input_path}),
            patch("aiio.release.git_state", return_value=("different", False)),
        ):
            with self.assertRaisesRegex(ValidationError, "HEAD"):
                verify_manifest(self.root, self.version)

    def test_latest_labour_baseline_keeps_suppressed_value_missing(self) -> None:
        labour_path = self.root / "labour.csv"
        labour_path.write_text(
            "observation_id,indicator_id,noc_code,occupation_label,trade_node_id,statistic,value,unit,geography_id,period_start,period_end,source_id,evidence_status,as_of_date,transformation_id,quality_flags\n"
            "OBS_OLD,JVWS_JOB_VACANCIES_NOC_72203,72203,Power line workers,trade_power_line,Job vacancies,50,Number,PR_48,2025-10-01,2025-12-31,STATCAN_JVWS_14100444,observed,2025-12-31,TR_TEST,status:E\n"
            "OBS_NEW,JVWS_JOB_VACANCIES_NOC_72203,72203,Power line workers,trade_power_line,Job vacancies,,Number,PR_48,2026-01-01,2026-03-31,STATCAN_JVWS_14100444,observed,2026-03-31,TR_TEST,status:F|value_missing_or_suppressed\n",
            encoding="utf-8",
        )
        baseline = latest_labour_availability(labour_path)
        self.assertEqual(baseline["period_end"], "2026-03-31")
        self.assertIsNone(baseline["observations"][0]["value"])
        self.assertIn(
            "value_missing_or_suppressed",
            baseline["observations"][0]["quality_flags"],
        )


if __name__ == "__main__":
    unittest.main()
