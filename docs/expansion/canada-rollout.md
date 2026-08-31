# Canada rollout plan

AIIO Canada is designed as a national research program with an Alberta pilot, not as an Alberta-specific dashboard. Expansion must preserve the same epistemic labels, geography identifiers, source lineage, unit separation and immutable release process.

## Expansion sequence

### Phase 0 — Alberta proof

- Complete the reproducible Alberta evidence, graph, scenario, power-overlay, workbook and web release.
- Validate the source adapter pattern against Statistics Canada and Alberta open data.
- Keep every pressure result explicitly uncalibrated until occupational and material-capacity denominators are defensibly estimated.

### Phase 1 — comparable provincial pilots

Add British Columbia, Ontario and Quebec because they provide contrasting power systems, construction markets and announced data-centre activity. Each province receives:

- a `PR_<code>` geography profile;
- an official-project adapter or documented manual-publication workflow;
- provincial construction-price and labour baselines;
- a power-planning source profile that remains separate from the CAD graph;
- a sealed province-specific scenario, graph-parameter set and release manifest.

Cross-province comparisons are prohibited until definitions, periods, units and project-stage classifications reconcile.

### Phase 2 — national coverage

Extend the same schema to the remaining provinces and territories. Statistics Canada series provide the common national spine; provincial and municipal sources add project, procurement, utility and workforce detail. Missingness is published rather than silently imputed.

## Provincial adapter contract

Every adapter must produce stable normalized observations with:

- `source_id`, publisher, source URL, retrieved timestamp and content hash;
- `geography_id`, period start/end, value and unit;
- observed, inferred, assumed or scenario status;
- transformation version and quality flags;
- source vintage and revision relationship;
- public licence or reuse note.

## Infrastructure scope

The common public-delivery taxonomy covers hospitals, schools, government facilities, roads, rail, regulated utilities and municipal infrastructure. Provincial releases may add subtypes, but must map them back to the common taxonomy.

## National release gates

1. Source definitions and geography codes validate.
2. Raw retrievals and normalized outputs are content-hashed.
3. Graph units, signs, lags, absorption, retention and evidence grades validate.
4. Scenario decomposition reconciles and excludes non-modelled capex explicitly.
5. Power quantities remain in a separate MW/GWh overlay.
6. Golden runs and publication manifests reproduce from a clean commit.
7. Website, workbook and downloads consume the same release manifest.
8. An independent reviewer confirms that the public surface cannot reasonably be read as an empirical finding or forecast.

## Calibration roadmap

Calibration is a separate research stream. Candidate inputs include provincial construction employment and vacancy measures, apprenticeship completions, wage and hours data, building-construction price components, project schedules, utility queue information and procurement outcomes. Calibration may change parameter sets only through a reviewed versioned release; the weekly digest never changes model parameters automatically.
