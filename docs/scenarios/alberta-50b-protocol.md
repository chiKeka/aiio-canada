# Alberta $50 billion scenario protocol

## Purpose

This scenario is a structured counterfactual for testing the Observatory. It is not a claim that $50 billion will be invested and not a forecast of project outcomes.

## Headline definition

Assume $50 billion (2026 CAD) of AI infrastructure investment reaches Alberta over 2027–2036. Model how the portion translated into selected local construction demand interacts with labour, materials, a construction-cost signal and public-delivery delay pressure. Treat power-system quantities in a separate MW-based scenario overlay.

## Required decomposition

The headline value cannot enter the graph as a single undifferentiated shock. It must be decomposed into:

- site acquisition and development;
- building and civil construction;
- electrical and mechanical systems;
- grid connection and dedicated generation;
- computing and networking equipment;
- professional services and other costs;
- imported versus locally captured content;
- construction versus operating expenditure;
- committed, probable and speculative project stages.

## Implemented diagnostic and future variants

The implemented v0.2 diagnostic uses a staggered ten-year profile, 72% uniform local capture and a graph that receives 46% of total capex. Computing/networking plus professional/other costs—54% of capex—are excluded from propagation. Normalization denominators, capture, absorption and retention are explicit assumptions with one-at-a-time and joint sensitivity tests.

- **Staggered:** $50B distributed over ten years with gradual ramp-up.
- **Front-loaded:** the same total with peak construction concentrated in the first five years.
- **Constrained:** project realization is capped by connection, labour and delivery limits.
- **High-local-capture:** a larger share reaches Alberta construction and service industries.

Future variants will have low, central and high parameter sets. Scenario comparisons hold the baseline constant. In v0.2, low/central/high are co-moving structural cases, not uncertainty intervals.

## Required outputs

- Annual construction demand by project archetype.
- Occupational demand pressure and first-pinch ordering.
- Material demand pressure for selected high-exposure inputs.
- An independent load overlay reporting IT MW, annual energy, facility peak, grid-coincident demand and a transmission planning proxy as separate measures.
- Public-project exposure by asset class, location and planned delivery window.
- Schedule-delay and cost pressure indices with structural cases and sensitivity results; credible intervals require later empirical calibration.
- Dominant graph paths and sensitivity contributors.

## Guardrails

- Announcements are probability-weighted only in observed pipeline views; the $50B counterfactual remains explicit.
- Server/equipment purchases do not create the same local trade demand as construction.
- Power capacity cannot be inferred from capex alone. Load assumptions require project archetypes and corroborating evidence.
- A regional labour constraint must account for mobility, training lag, interprovincial recruitment and simultaneous non-AI demand.
- Transmission need is an engineering/planning implication, not a direct scalar multiple of peak load.

## Acceptance tests

1. Zero local construction share produces no construction-labour shock.
2. A longer delivery window reduces annual flow before feedback effects.
3. Increasing investment cannot reduce direct demand nodes absent an explicitly modelled substitution or capacity response.
4. Equipment-only investment does not inflate construction trade demand.
5. Reported power results reconcile across MW and annual energy using the declared load factor.
6. Every chart exposes the baseline, variant and price/unit conventions.
7. CAD shocks cannot drive an MW queue or other physical power quantity.
8. Energy PUE and peak-to-IT factors are separate, and commissioning is reported by calendar year.
9. A pressure score of 0.24 is never described as a 24% delay.
