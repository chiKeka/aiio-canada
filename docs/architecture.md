# System architecture

AIIO Canada is a research system with several publication surfaces. The website and workbook consume versioned outputs; neither contains the authoritative logic.

## Pipeline

```text
Public sources
    ↓
Source register + immutable retrieval records
    ↓
Normalized observations + claim/evidence coding
    ↓
Provincial baseline and project inventory
    ├── guarded labour recruitment screen
    ├── material-cost component screen
    ├── public-delivery asset overlap screen
    └── observed power request/contract boundary
    ↓
Held-out reference-class baseline
    ↘ AI-attributable increment (withheld pending identification)
    ↓
Typed CAD-pressure graph + scenario shocks
    ↓
Propagation, sensitivity and validation runs
    ↘ independent MW-based power overlay
    ↓
Versioned releases
    ├── public website
    ├── weekly digest
    ├── CSV/JSON downloads
    └── Excel workbook
```

## Components

### 1. Evidence registry

Stores source identity, publisher, URL, access method, publication and retrieval dates, geography, licence/access notes, content hash and status. A source may support many observations or claims. Revisions are additive and remain auditable.

### 2. Ingestion and normalization

Source-specific adapters retrieve machine-readable files where available. Raw responses are retained by content hash. Transformation code emits normalized records and validation results. Manual extraction is permitted only with a reviewer and page/table locator.

### 3. Baseline

The baseline describes the observed system before a scenario shock: public projects, employment and vacancies by occupation, wages, construction price indices, material supply proxies, generation and transmission outlooks, and known AI/data-centre projects. Detailed current vacancies and the 2021 Census workforce stock remain separately dated. Their guarded cross-vintage ratio is an inferred recruitment screen, not a vacancy rate or graph calibration input.

### 4. Cost baseline and attribution

The cost-translation pipeline is modular. A reference-class baseline forecasts
an observed BCPI model-building index through locked rolling-origin calibration
and validation partitions. Failed asset/geography/horizon combinations remain
null. The AI-attributable increment is a separate causal estimand and remains
null until a historical treatment, counterfactual and project-outcome panel
passes the protocol in
[`docs/methodology/calibration-protocol.md`](methodology/calibration-protocol.md).
The graph never supplies a multiplier for the reference baseline.

The E2 readiness pipeline validates a locked regional panel contract against the
source registry and writes an explicit missing-data/gate artifact. It separates
authorizing realized treatment measures from permit, announcement and grid
proxies, and it separates tender timing from physical schedule outcomes. The
protocol is documented in
[`docs/methodology/ai-attribution-identification.md`](methodology/ai-attribution-identification.md).

### 5. Graph model

Nodes represent shocks, resources, materials, cost signals and public-delivery delay pressure. Directed typed edges encode mechanisms. Each edge records sign, magnitude range, lag, absorption, supporting evidence, confidence, author, version and assumption ID. Resource, material, signal and outcome nodes may retain part of a pressure state into later years using an explicit low/central/high retention factor. The engine reports signed totals and the paths that produced them.

### 6. Scenario layer

A scenario is an explicit set of non-observed inputs: investment quantum, timing, construction share, local capture and normalization denominators. It produces a versioned structural diagnostic against a named graph. The first Alberta run also tests denominators, absorption, local capture and retention one at a time and in joint lower-/higher-pressure cases. These cases are not probability intervals.

Power-system quantities are deliberately separate. An observed evidence screen records AESO request, allocation and contract quantities without turning them into a forecast. An independent scenario overlay starts with IT load in MW, uses energy PUE only for annual energy, applies a distinct peak-to-IT factor to peak demand, and stages load using an annual commissioning profile. It cannot be inferred from the CAD scenario and is not an AESO needs assessment.

### 7. Publication layer

All outputs read an immutable release manifest containing input hashes, code version, model configuration and run time. The public interface must expose evidence status and uncertainty. Excel reproduces key tables through exported data, not duplicated hidden logic.

## Technology plan

- Public application: React/TypeScript with server rendering and accessible interactive controls.
- Application persistence: Cloudflare D1/SQLite for source metadata, digest items and release manifests.
- Analytical pipeline: Python packages with typed schemas, tests and deterministic command-line entry points.
- Raw and derived research files: versioned local directories with manifests and hashes; object storage can be added at publication scale.
- Workbook: generated `.xlsx` with formulas, named assumptions, data dictionary, provenance and reconciliation checks.

## Release gates

1. Schema and source validation.
2. Baseline series integrity, rolling-origin partition and fail-closed output checks.
3. Labour geography/NOC coverage, missingness, zero-filler and cross-vintage formula checks.
4. Material-series coverage and aligned-period checks.
5. Public-project classification, schedule-missingness and cost-allocation checks.
6. Power source-hash, requested-load ordering and Phase 1 reconciliation checks.
7. Graph DAG, self-loop, validity, retention and edge-metadata checks.
8. Scenario identity, sign, lag, mass-bound, additivity, sensitivity, deterministic and golden-run tests.
9. Workbook-to-release reconciliation.
10. Accessibility and public-language review.
11. Independent methodological review and documented disposition.
12. AI-attributable cost and schedule fields remain null unless the separate identification gate passes.
