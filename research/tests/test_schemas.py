from __future__ import annotations

import tempfile
import unittest
from datetime import date
from pathlib import Path

from aiio.adapters.statcan import quarter_bounds, slug
from aiio.adapters.alberta_projects import (
    classify_ai_relevance,
    extract_coordinates,
    extract_verification_token,
    schedule_years,
)
from aiio.constants import EvidenceStatus
from aiio.digest import build_digest
from aiio.schemas import ObservationRecord, ScenarioRecord, ValidationError


class SchemaTests(unittest.TestCase):
    def test_observation_rejects_scenario_contamination(self) -> None:
        observation = ObservationRecord(
            observation_id="OBS_1",
            indicator_id="TEST",
            value=1,
            unit="index",
            geography_id="PR_48",
            period_start="2026-01-01",
            period_end="2026-03-31",
            source_id="SOURCE_1",
            evidence_status=EvidenceStatus.SCENARIO,
            as_of_date="2026-03-31",
        )
        with self.assertRaisesRegex(ValidationError, "scenario values"):
            observation.validate()

    def test_scenario_requires_scenario_status(self) -> None:
        scenario = ScenarioRecord(
            scenario_id="AB_50B",
            geography_id="PR_48",
            investment_total_cad=50_000_000_000,
            currency_year=2026,
            start_year=2027,
            end_year=2036,
            construction_share=0.38,
            local_capture_share=0.72,
            evidence_status=EvidenceStatus.ASSUMED,
        )
        with self.assertRaisesRegex(ValidationError, "scenario overlays"):
            scenario.validate()

    def test_scenario_share_boundaries(self) -> None:
        scenario = ScenarioRecord(
            scenario_id="AB_50B",
            geography_id="PR_48",
            investment_total_cad=50_000_000_000,
            currency_year=2026,
            start_year=2027,
            end_year=2036,
            construction_share=1.2,
            local_capture_share=0.72,
        )
        with self.assertRaisesRegex(ValidationError, "construction_share"):
            scenario.validate()

    def test_statcan_quarter_conversion(self) -> None:
        self.assertEqual(quarter_bounds("2026-Q2"), ("2026-04-01", "2026-06-30"))
        self.assertEqual(quarter_bounds("2026-04"), ("2026-04-01", "2026-06-30"))
        self.assertEqual(slug("Non-residential building"), "NON_RESIDENTIAL_BUILDING")

    def test_major_projects_token_extraction(self) -> None:
        html = '<form><input name="__RequestVerificationToken" type="hidden" value="public-session-token" /></form>'
        self.assertEqual(extract_verification_token(html), "public-session-token")

    def test_ai_classifier_avoids_alberta_infrastructure_abbreviation(self) -> None:
        self.assertEqual(
            classify_ai_relevance(
                "Hospital power upgrade",
                "Institutional",
                "Alberta Infrastructure (AI) will expand the facility.",
            )[0],
            "none",
        )
        self.assertEqual(
            classify_ai_relevance("Wonder Valley AI Data Centre Park", "Industrial", "")[0],
            "core_data_centre",
        )
        self.assertEqual(
            classify_ai_relevance(
                "Greenlight Electricity Centre",
                "Power",
                "Generation intended to supply data center demand.",
            )[0],
            "enabling_power",
        )

    def test_project_schedule_and_coordinates(self) -> None:
        self.assertEqual(schedule_years("2027 - 2030"), (2027, 2030))
        self.assertEqual(schedule_years("Completion by 2030"), (None, 2030))
        point = '{"geometry":{"type":"Point","coordinates":[-113.5,53.5]}}'
        self.assertEqual(extract_coordinates(point), (-113.5, 53.5, 1))

    def test_digest_rejects_scenario_as_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            items = root / "items.json"
            items.write_text(
                '{"items":[{"headline":"Test","source_id":"X","source_url":"https://example.com",'
                '"observed_change":"Change","model_implication":"Implication","evidence_status":"scenario"}]}',
                encoding="utf-8",
            )
            with self.assertRaisesRegex(ValidationError, "cannot present"):
                build_digest(items, root / "digest.md", date(2026, 8, 31))


if __name__ == "__main__":
    unittest.main()
