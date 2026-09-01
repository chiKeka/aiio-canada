# AIIO Canada product framing

## Product promise

AIIO Canada helps a public-sector decision maker answer:

> For this infrastructure project, what cost and schedule pressures should I
> prepare for as AI infrastructure builds out, what is driving them, and what
> decisions can I take now?

Decision Mode and Research Mode are two interfaces over the same evidence,
graph and release artifacts. Changing modes changes language and depth, never
the underlying numbers or evidence status.

## Primary user

The primary user is an Assistant Deputy Minister, Treasury Board analyst,
capital-planning executive or infrastructure investor reviewing a proposed or
active public project. They need a decision brief in minutes and an auditable
explanation when challenged.

## Decision Mode journey

1. Define the project: asset class, geography, current estimate, start year and
   delivery duration.
2. Read the decision headline: what can be stated now, what cannot yet be
   quantified, and which project years intersect the scenario pressure window.
3. Inspect drivers without mixing units:
   - observed construction-cost movement;
   - observed labour-market availability and wages;
   - scenario trade and material pressure;
   - grid and utility enabling constraints;
   - dated regional macroeconomic context, kept separate from any future
     AI-attributable spillover estimate.
4. Open the dependency graph to see the exact paths, lags, evidence grades and
   sticky points behind the brief.
5. Review practical decision triggers: procurement timing, market sounding,
   utility coordination, packaging strategy and contingency review dates.
6. Switch to Research Mode for sources, assumptions, methods, limitations,
   version history and downloadable artifacts.

## Output contract

Every executive result must include:

- the project definition and analysis date;
- a baseline cost signal clearly separated from any AI increment;
- an AI scenario pressure diagnostic clearly separated from observed evidence;
- the leading labour, material, utility and schedule paths;
- confidence and data-coverage statements;
- sources and release version;
- decision triggers and mitigations;
- explicit unknowns.

## Calibration guardrail

The current graph ranks structural pressure pathways but is not calibrated to
dollars, escalation percentages, worker shortages or delay days. Until the
cost-translation layer passes a reviewed calibration gate, Decision Mode must
show “calibration pending” for AI-attributable project cost escalation. It may
show observed BCPI change and scenario pressure scores side by side, but it may
not add, multiply or otherwise fuse them into a forecast.

## Project reference-cost contract

When a reference-class baseline is independently authorized, Decision Mode may
translate it to a schedule-weighted current-price equivalent only when the user
supplies:

- an estimate value and exact price-basis quarter;
- a supported asset class and CMA reference geography; and
- positive annual expenditure shares that sum to one.

Each expenditure year is escalated separately and then recombined. The tool
must not apply the end-year index to the full project estimate. If any required
horizon failed validation, the price basis cannot be reconciled, the reference
class is unsupported, or independent review is incomplete, the entire project
baseline remains null. This market reference calculation never contains the AI
increment and never uses a graph pressure score.

The independent-review packet is visible as governance evidence, not as a
projection. It must lock the exact model artifact, implementation, tests and
claim-boundary documents. A separate verdict must disposition all ten required
criteria and may recommend only `authorize_baseline_only`; verdict validation
does not edit the model artifact, governance state or public release. A
prepared packet, an authenticated reviewer tool or a prose approval cannot
unlock Decision Mode.

## Analysis channels

The product distinguishes five channels:

1. Direct construction competition: trades, equipment and materials shared by
   data centres and public projects.
2. Grid enabling work: power-line trades, grid equipment, interconnection and
   transmission or distribution dependencies.
3. Delivery capacity: procurement packaging, contractor capacity, sequencing
   and schedule spillovers.
4. Regional macro demand: the product now displays separate dated controls for
   wages, housing activity, population, consumer prices and non-residential
   investment. These are descriptive context only; the AI-attributable
   spillover channel remains uncalibrated and is not quantified in the graph.
5. Public fiscal response: capital-plan reprioritization and budget pressure.
   This is a later policy layer, not a current model output.

## Product success criteria

- An executive can configure a project and understand the decision boundary in
  under three minutes.
- Every number is traceable to a source or a sealed scenario assumption.
- The interface never presents a scenario score as a percent, probability,
  forecast or measured effect.
- A researcher can reproduce the same result from the release artifacts.
- The graph reveals why a driver matters and which evidence or calibration gap
  would most improve the decision.
