# AI-attributable cost and schedule identification protocol

## Purpose

This protocol governs estimand E2: the incremental public-project cost or
schedule effect attributable to observed regional AI-infrastructure construction
activity. E2 is separate from the market reference-index baseline and from the
dimensionless graph diagnostic. No graph score, announced capital value,
connection request or demand forecast can be converted into E2.

The current result is `not_assessed`. This is a designed null, not a zero effect.
The machine contract is
`data/model/ai_attribution_panel_contract_v0.1.json`; the current readiness run
is `data/model-runs/ai_attribution_identification_readiness_v0.1.json`.

## Relationship to S3/PSPE

The supplied S3 paper treats a major program as a temporary ecosystem and uses
an iterative cycle: map the program; identify priorities and thresholds;
coordinate proximate organizations; stress-test missing nodes and ties; deploy
an action; and review/update. AIIO uses that logic to define mechanisms,
candidate exposure channels, bottlenecks, negative controls and omitted-node
tests.

That source presents a systems-mapping and early-warning framework, not a causal
estimator. S3 therefore informs what to test and where effects could propagate;
the panel design separately determines whether an effect can be attributed to
observed AI construction.

## Locked estimand and unit

The target estimand is the group-time average effect on public-project outcomes
for regions exposed to realized AI-infrastructure construction, relative to
otherwise comparable not-yet-treated or never-treated regions with common
support. The planned unit is region-quarter-asset class. A CMA is preferred;
an electricity planning region is permitted only when it can be reconciled to
the same labour, price and public-project geography without silent allocation.

The primary design is a staggered-adoption group-time difference-in-differences
estimator. A conventional two-way fixed-effects event study is prohibited as the
primary estimator because heterogeneous effects and treatment timing can
contaminate lead/lag coefficients. The locked design follows the group-time
estimand in [Callaway and Sant'Anna (2021)](https://doi.org/10.1016/j.jeconom.2020.12.001)
and uses [Sun and Abraham (2021)](https://doi.org/10.1016/j.jeconom.2020.09.006)
as a sensitivity specification. A pre-trend rejection/non-rejection is not used
as a binary proof of validity; the protocol requires an equivalence assessment
and records the risk of low-power pretests identified by
[Roth (2022)](https://doi.org/10.1257/aeri.20210236).

## Treatment contract

Only realized construction activity may authorize the treatment:

- realized data-centre construction spend in CAD with a price basis; or
- data-centre construction labour hours in an identified region and quarter.

Municipal permitted construction value and energized data-centre MW may support
proxy/descriptive specifications. They cannot authorize the primary causal
claim. Announced capex, requested connection MW, forecast demand, scenario capex
and graph pressure scores are prohibited treatment measures.

Treatment onset is the first quarter with a positive authorizing measure after
source, project, geography and revision reconciliation. Two anticipation
quarters are declared. Treatment dose retains its source unit; no capex-to-MW or
MW-to-labour conversion is introduced.

## Outcome contract

Three outcome families are locked before data assembly:

1. Cost change requires an independent estimate and price-basis date, tender or
   award value, approved changes and a consistent asset reference class.
2. Schedule change requires versioned baseline start/completion dates and actual
   start/completion dates. Tender duration is not physical schedule delay.
3. Procurement competition requires tender open/close/award dates and compliant
   bidder count. A published award alone does not establish competition.

Project identifiers must survive revisions. Missing estimate vintages, change
orders or actual completion dates remain missing; they are not inferred from the
latest published project status.

## Public-data feasibility result

| Domain | Verified public source | What it can supply | Current boundary |
| --- | --- | --- | --- |
| Regional building activity | [Statistics Canada table 34-10-0293-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3410029301) | Monthly residential/non-residential building investment for provinces and selected CMAs | Implemented quarterly control; excludes engineering construction and is not AI-specific |
| Federal procurement | [CanadaBuys procurement and contracting data](https://canadabuys.canada.ca/en/procurement-and-contracting-data) | Tender, award and PSPC contract-history files | Implemented 2026-2027 feasibility intake: 358 construction linkages, but no stable physical-project ID, CMA geography, independent estimate, complete approved changes, physical completion or bidder count |
| Federal contracts/amendments | [Open Government proactive contract publications](https://open.canada.ca/data/en/dataset/d8f85d91-7dec-4fd1-8055-483b77225d8b) | Award and amendment records for federal reporting entities | Unaudited disclosure; does not consistently supply independent estimate or completion |
| Audited Ontario outcomes | [Ontario Auditor General: Procurement and Delivery of Selected Infrastructure Projects](https://www.auditor.on.ca/en/content/annualreports/audits/en2024/AR-PA_infrastructureON_en24.html) | Two completed named-project cost and substantial-completion histories plus source cost-component breakdowns | Implemented hash-locked reference intake: one completed total-cost comparison, one estimated cost under dispute, and one exact-day completion pair; no price-basis dates, complete change histories, reusable panel or publisher-stable project IDs |
| Quebec authorized revisions | [Quebec infrastructure project dashboard](https://www.tresor.gouv.qc.ca/infrastructures-publiques/tableau-de-bord) and official field dictionary | Stable lifecycle project IDs, total authorized cost and lifecycle-authorized cost/schedule changes | Implemented parser-reconciled candidate panel: 141 cost chains, 168 completion-month chains and 111 joint chains; single-province survivor snapshot, authorized parameters rather than outturns, no price-basis dates and independent parser review pending |
| Municipal permits | [Edmonton General Building Permits](https://data.edmonton.ca/Urban-Planning-Economy/General-Building-Permits/24uj-dj8v) | Implemented field-minimized screen: issue date, building/work type, reported construction-value estimate and occupancy trend field | 85 broad records produce 17 explicit data-centre candidates, 0 explicit AI references and 0 candidate occupancy dates; still not realized spend or hours |
| Alberta large loads | [AESO connection project reporting](https://www.aeso.ca/grid/transmission-projects/) and the registered large-load sources | Requested/contracted load, project stage and selected energization information | MW states are distinct and do not measure construction resource use |
| Labour and prices | Existing Statistics Canada JVWS, Census and BCPI adapters | Vacancy, offered-wage, workforce-stock and price controls | Different vintages/designs remain explicit; none identify E2 by themselves |

The current public sources are valuable for exposure screening, controls and
named outcome references, but do not yet produce a common realized
AI-construction treatment plus a reusable set of comparable estimate-to-outturn
and baseline-to-actual outcomes. That is why E2 remains `not_assessed` rather
than being estimated from announcements or isolated project histories.

The detailed CanadaBuys transformation, field-coverage counts and publication
boundary are documented in
`docs/methodology/canadabuys-procurement-outcome-intake.md`.
The municipal permit retrieval, classifier and non-authorizing boundary are
documented in
`docs/methodology/edmonton-data-centre-permit-proxy.md`.
The Ontario audit extraction, scope reconciliation, component bridge and
non-authorizing boundary are documented in
`docs/methodology/audited-project-outcome-references.md`.
The Quebec lifecycle-history parser, chain rules, coverage and survivor-snapshot
boundary are documented in
`docs/methodology/quebec-authorized-project-revisions.md`.

## Minimum identification gates

Before estimation, the panel must contain at least eight pre-treatment quarters,
four post-treatment quarters, two treated regions, three eligible comparison
regions per treatment cohort and two public asset classes. These are minimum
diagnostic conditions, not proof of identification.

The full gate additionally requires:

- treatment timing and dose provenance for every treated region-quarter;
- common-support diagnostics and transparent exclusions;
- locked covariates before outcome inspection;
- cohort/event-time estimates with simultaneous uncertainty reporting;
- pre-trend plots plus an equivalence assessment;
- placebo event dates and a negative-control outcome;
- leave-one-region-out and leave-one-event-out sensitivity;
- checks for treatment spillovers into comparison regions;
- source-revision and alternative-geography sensitivity; and
- independent modelling review with dispositions.

If overlap, trends, treatment measurement, outcome lineage or spillover controls
are inadequate, the analysis remains descriptive. A failed specification is not
replaced after inspecting the desired outcome.

## Publication contract

The readiness pipeline may report source coverage and missing requirements but
cannot publish an effect. Promotion requires a separate estimator artifact with
the panel hash, cohort definitions, code revision, all diagnostics, an effect in
a declared unit, sensitivity outputs and independent review. Until then:

```text
AI-attributable cost escalation: null / calibration pending
AI-attributable schedule delay: null / calibration pending
S3/PSPE graph: mechanism and exposure diagnostic only
```
