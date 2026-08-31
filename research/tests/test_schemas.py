from __future__ import annotations

import tempfile
import unittest
import zipfile
from datetime import date
from pathlib import Path

from aiio.adapters.statcan import (
    normalize_jvws_alberta,
    normalize_jvws_canada,
    quarter_bounds,
    slug,
)
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

    def test_missing_observation_requires_quality_flag(self) -> None:
        observation = ObservationRecord(
            observation_id="OBS_MISSING",
            indicator_id="TEST",
            value=None,
            unit="Number",
            geography_id="PR_48",
            period_start="2026-01-01",
            period_end="2026-03-31",
            source_id="SOURCE_1",
            evidence_status=EvidenceStatus.OBSERVED,
            as_of_date="2026-03-31",
        )
        with self.assertRaisesRegex(ValidationError, "quality flag"):
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

    def test_jvws_normalizer_preserves_suppression_and_trade_mapping(self) -> None:
        header = (
            '"REF_DATE","GEO","DGUID","National Occupational Classification",'
            '"Statistics","UOM","VALUE","STATUS","SYMBOL","TERMINATED"\n'
        )
        rows = [
            '"2026-01","Alberta","2021A000248","Electricians (except industrial and power system) [72200]","Job vacancies","Number","460","E","",""',
            '"2026-01","Alberta","2021A000248","Electrical power line and cable workers [72203]","Job vacancies","Number","","F","",""',
            '"2026-01","Ontario","2021A000235","Electricians (except industrial and power system) [72200]","Job vacancies","Number","1000","A","",""',
            '"2026-01","Alberta","2021A000248","Carpenters [72310]","Job vacancies","Number","900","A","",""',
        ]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive_path = root / "jvws.zip"
            output_path = root / "labour.csv"
            with zipfile.ZipFile(archive_path, "w") as archive:
                archive.writestr("14100444.csv", header + "\n".join(rows) + "\n")
            observations = normalize_jvws_alberta(archive_path, output_path)
            self.assertEqual(len(observations), 2)
            self.assertEqual(observations[0].value, 460.0)
            self.assertEqual(observations[1].value, None)
            self.assertIn("status:F", observations[1].quality_flags)
            self.assertIn("value_missing_or_suppressed", observations[1].quality_flags)
            output = output_path.read_text(encoding="utf-8")
            self.assertIn("trade_electricians", output)
            self.assertIn("trade_power_line", output)
            self.assertNotIn("Ontario", output)

    def test_jvws_canada_normalizer_keeps_provinces_separate(self) -> None:
        header = (
            '"REF_DATE","GEO","DGUID","National Occupational Classification",'
            '"Statistics","UOM","VALUE","STATUS","SYMBOL","TERMINATED"\n'
        )
        rows = [
            '"2026-01","Alberta","2021A000248","Electricians (except industrial and power system) [72200]","Job vacancies","Number","460","E","",""',
            '"2026-01","Ontario","2021A000235","Electricians (except industrial and power system) [72200]","Job vacancies","Number","1000","A","",""',
            '"2026-01","Canada","2021A000011124","Electricians (except industrial and power system) [72200]","Job vacancies","Number","3000","A","",""',
            '"2026-01","Calgary, Alberta","2021S05004830","Electricians (except industrial and power system) [72200]","Job vacancies","Number","200","A","",""',
            '"2026-01","Edmonton economic region, Alberta","2021A00034820","Electricians (except industrial and power system) [72200]","Job vacancies","Number","250","A","",""',
        ]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive_path = root / "jvws.zip"
            output_path = root / "labour_canada.csv"
            with zipfile.ZipFile(archive_path, "w") as archive:
                archive.writestr("14100444.csv", header + "\n".join(rows) + "\n")
            observations = normalize_jvws_canada(archive_path, output_path)
            self.assertEqual(len(observations), 2)
            self.assertEqual({item.geography_id for item in observations}, {"PR_35", "PR_48"})
            output = output_path.read_text(encoding="utf-8")
            self.assertIn("Alberta,2021A000248", output)
            self.assertIn("Ontario,2021A000235", output)
            self.assertNotIn("Canada,2021A000011124", output)
            self.assertNotIn("Calgary, Alberta", output)
            self.assertNotIn("Edmonton economic region", output)
            self.assertIn("TR_STATCAN_JVWS_CA_PROVINCES_NOC_1_0_0", output)

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
