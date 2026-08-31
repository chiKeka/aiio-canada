# Core data dictionary

This document defines the stable concepts shared by the database, analytical files, API, website and workbook. Machine-readable schemas will implement these concepts.

## Evidence status

| Status | Meaning |
|---|---|
| `observed` | Directly reported by an identified public source. |
| `corroborated` | Consistent observations from at least two independent sources. |
| `inferred` | Derived from observations using a disclosed transformation. |
| `assumed` | Chosen parameter with rationale and sensitivity range. |
| `scenario` | Counterfactual input or output; not a forecast or observation. |

## Source

Required fields: `source_id`, `title`, `publisher`, `canonical_url`, `source_type`, `geography`, `publication_date`, `retrieved_at`, `licence_note`, `access_method`, `content_hash`, `archive_path`, `status`.

## Observation

Required fields: `observation_id`, `indicator_id`, `value`, `unit`, `geography_id`, `period_start`, `period_end`, `source_id`, `evidence_status`, `transformation_id`, `quality_flags`, `release_id`.

## Claim

Required fields: `claim_id`, `claim_text`, `claim_type`, `geography_id`, `valid_from`, `valid_to`, `evidence_status`, `confidence`, `review_status`, `reviewer`, `release_id`.

## Project

Required fields: `project_id`, `name`, `project_class`, `sector`, `sponsor`, `geography_id`, `latitude`, `longitude`, `announced_capex`, `currency_year`, `stage`, `stage_probability`, `construction_start`, `construction_end`, `operating_start`, `power_mw`, `source_id`, `evidence_status`.

## Graph node

Required fields: `node_id`, `node_type`, `label`, `geography_id`, `unit`, `retention_low`, `retention_central`, `retention_high`, `valid_from`, `valid_to`, `evidence_status`, `source_id`, `author`, `version`, `release_id`.

## Graph edge

Required fields: `edge_id`, `source_node_id`, `target_node_id`, `mechanism`, `sign`, `weight_low`, `weight_central`, `weight_high`, `lag_periods`, `absorption`, `geography_id`, `source_id`, `assumption_id`, `evidence_status`, `confidence`, `author`, `version`, `release_id`.

## Scenario

Required fields: `scenario_id`, `parameter_set_id`, `name`, `description`, `geography_id`, `baseline_release_id`, `investment_total`, `currency_year`, `start_year`, `end_year`, `component_shares`, `local_capture_share`, `normalization_denominators`, `author`, `created_at`, `status`.

## Power overlay

Required fields: `overlay_id`, `parameter_set_id`, `geography_id`, `start_year`, `end_year`, `annual_commissioning_profile`, `it_load_mw_at_full_buildout`, `energy_pue`, `peak_to_it_factor`, `load_factor`, `grid_supply_share`, `peak_coincidence`, `planning_margin`, `evidence_status`.

Power overlays are independent scenario artifacts. `energy_pue` applies to annual energy; `peak_to_it_factor` applies to facility peak. Neither is derived from CAD capex.

## Release

Required fields: `release_id`, `version`, `published_at`, `code_commit`, `dirty_worktree`, `input_manifest_hash`, `configuration_hash`, `model_version`, `engine_version`, `parameter_set_id`, `status`, `notes`.

## Conventions

- Currency is CAD and carries a price year.
- Electrical power is MW; electrical energy is MWh or GWh. They are never interchangeable.
- Geography uses stable Statistics Canada identifiers where possible.
- Dates use ISO 8601. Retrieval timestamps use UTC.
- Missing, zero and not-applicable are distinct.
- Low, central and high values preserve declared structural cases; they are not called confidence or credible intervals without a fitted probability model.
