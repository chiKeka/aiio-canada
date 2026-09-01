from __future__ import annotations

import json
import tempfile
import unittest
from datetime import date
from pathlib import Path

from aiio.digest import build_digest, sha256_file, validate_digest_cadence
from aiio.schemas import ValidationError


class DigestTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.root = Path(self.temporary_directory.name)
        self.items_dir = self.root / "items"
        self.items_dir.mkdir()
        self.items_path = self.items_dir / "2026-09-01.json"
        self.output_path = self.root / "2026-09-01.md"
        self.registry_path = self.root / "sources.json"
        self.registry_path.write_text(
            json.dumps(
                {
                    "sources": [
                        {
                            "source_id": "SOURCE_A",
                            "canonical_url": "https://example.test/a",
                        },
                        {
                            "source_id": "SOURCE_B",
                            "canonical_url": "https://example.test/b",
                        },
                    ]
                }
            )
            + "\n",
            encoding="utf-8",
        )
        self.payload = {
            "schema_version": "1.1.0",
            "digest_id": "AIIO_DIGEST_2026_09_01",
            "edition_date": "2026-09-01",
            "status": "review",
            "items": [
                {
                    "item_id": "ITEM_01",
                    "headline": "Two public sources were reconciled",
                    "sources": [
                        {
                            "source_id": "SOURCE_A",
                            "source_url": "https://example.test/a",
                        },
                        {
                            "source_id": "SOURCE_B",
                            "source_url": "https://example.test/b",
                        },
                    ],
                    "observed_change": "The public sources report distinct quantities.",
                    "model_implication": "Keep their units separate.",
                    "evidence_status": "inferred",
                    "geography_ids": ["PR_35", "PR_59"],
                    "model_action": "no_change",
                    "automatic_model_change": False,
                }
            ],
        }
        self.write_payload()

    def write_payload(self) -> None:
        self.items_path.write_text(
            json.dumps(self.payload, indent=2) + "\n", encoding="utf-8"
        )

    def build(self) -> dict:
        return build_digest(
            self.items_path,
            self.output_path,
            date(2026, 9, 1),
            source_registry_path=self.registry_path,
        )

    def test_builds_registry_bound_digest_and_manifest(self) -> None:
        manifest = self.build()
        self.assertEqual(manifest["item_count"], 1)
        self.assertEqual(manifest["source_ids"], ["SOURCE_A", "SOURCE_B"])
        self.assertFalse(manifest["automatic_model_change"])
        self.assertEqual(manifest["items_sha256"], sha256_file(self.items_path))
        self.assertEqual(manifest["markdown_sha256"], sha256_file(self.output_path))
        self.assertTrue(self.output_path.with_suffix(".manifest.json").exists())
        markdown = self.output_path.read_text(encoding="utf-8")
        self.assertIn("no automatic parameter or baseline change", markdown)
        self.assertIn("[SOURCE_B](https://example.test/b)", markdown)

    def test_legacy_single_source_shape_remains_valid(self) -> None:
        item = self.payload["items"][0]
        item.pop("sources")
        item["source_id"] = "SOURCE_A"
        item["source_url"] = "https://example.test/a"
        self.write_payload()
        manifest = self.build()
        self.assertEqual(manifest["source_ids"], ["SOURCE_A"])

    def test_rejects_edition_date_mismatch(self) -> None:
        self.payload["edition_date"] = "2026-08-31"
        self.write_payload()
        with self.assertRaisesRegex(ValidationError, "must match"):
            self.build()

    def test_rejects_unregistered_or_mismatched_source_url(self) -> None:
        self.payload["items"][0]["sources"][0]["source_url"] = (
            "https://example.test/not-canonical"
        )
        self.write_payload()
        with self.assertRaisesRegex(ValidationError, "does not match registry"):
            self.build()

    def test_rejects_automatic_model_change(self) -> None:
        self.payload["items"][0]["automatic_model_change"] = True
        self.write_payload()
        with self.assertRaisesRegex(ValidationError, "cannot authorize"):
            self.build()

    def test_rejects_scenario_as_new_evidence(self) -> None:
        self.payload["items"][0]["evidence_status"] = "scenario"
        self.write_payload()
        with self.assertRaisesRegex(ValidationError, "assumptions or scenarios"):
            self.build()

    def test_cadence_accepts_current_edition_and_rejects_stale_one(self) -> None:
        current = validate_digest_cadence(
            self.items_dir, as_of_date=date(2026, 9, 8), max_age_days=8
        )
        self.assertEqual(current["age_days"], 7)
        with self.assertRaisesRegex(ValidationError, "stale"):
            validate_digest_cadence(
                self.items_dir, as_of_date=date(2026, 9, 10), max_age_days=8
            )

    def test_cadence_rejects_filename_payload_date_mismatch(self) -> None:
        self.payload["edition_date"] = "2026-08-31"
        self.write_payload()
        with self.assertRaisesRegex(ValidationError, "disagree"):
            validate_digest_cadence(
                self.items_dir, as_of_date=date(2026, 9, 1), max_age_days=8
            )


if __name__ == "__main__":
    unittest.main()
