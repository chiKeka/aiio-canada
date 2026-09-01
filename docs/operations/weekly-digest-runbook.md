# Weekly evidence digest operating runbook

## Operating objective

Maintain a dated, source-registered intake journal of newly published or newly
transformed public evidence relevant to AI infrastructure, public-project cost
and delivery, labour, materials, power and regional macro conditions. The
weekly operation feeds research review; it does not silently update a model or
public release.

## Weekly sequence

1. Read the latest dated intake and manifest to establish the evidence cutoff.
2. Check the official public sources already registered for the monitored
   channels and identify material releases or revisions since that cutoff.
3. Reconcile every candidate source ID and canonical URL against
   `data/registry/sources.json`. A newly discovered source requires a separate,
   reviewable registry change before it can enter an edition.
4. Draft only evidence-backed items. Each item must distinguish the observed or
   inferred change from its possible model implication and must set
   `automatic_model_change` to `false`.
5. Do not create an empty edition merely to satisfy cadence. If no qualifying
   public evidence was found, report the sources checked and leave the latest
   immutable edition unchanged.
6. Build the newest dated intake with `npm run digest:build`, then run
   `npm run digest:audit`, the digest tests, the full research tests and the
   program-readiness audit.
7. Review the generated Markdown and hash manifest. Commit a new edition only
   when the intake is substantive and every gate passes.

## Promotion boundary

- `no_change` records evidence without proposing model work.
- `review_candidate` opens a research question; it does not change a parameter.
- `promote_after_release` still requires the relevant schema, modelling,
  independent-review and versioned-release gates.
- The weekly operation never deploys, publishes, authorizes a withheld output,
  edits a frozen release, or turns a scenario into evidence.

## Failure handling

Stop the edition when a source is unregistered, a URL differs from its registry
record, a date disagrees with its filename, a source is inaccessible, evidence
status is ambiguous, or a deterministic rebuild changes an older edition.
Record the gap rather than filling it with an assumption.
