# Practical evidence route

This pipeline operationalizes the shortest public-data route toward an
AI-infrastructure attribution study without relabelling proxies as realized
construction or authorized revisions as final outcomes.

It runs three parallel evidence tracks:

1. A quarterly Calgary–Edmonton construction-activity proxy reconstructed from
   costed under-construction projects and explicit data-centre permits. Values
   are sensitivity cases, not observed spending.
2. A prospective snapshot of hospital, education and civic projects from the
   BC, Ontario and Quebec inventories. Stable source identifiers allow later
   snapshots to be reconciled into stage, estimate and schedule changes.
3. A preregistered narrow outcome: quarterly publisher-authorized cost and
   completion-plan revisions. This is analytically distinct from final cost
   outturn and actual delay.

The current snapshot covers 3,661 target projects in three provinces. The
reconstructed treatment track has positive activity in two Alberta CMAs. The
revision outcome remains Quebec-only, so neither the narrow estimand nor the
original realized-treatment estimand is authorized.

Each weekly evidence run rebuilds the snapshot, quarterly revision cells,
coverage checks, input hashes and research-surface receipt. The next official
snapshot becomes evidence only after stable-ID reconciliation; a page update by
itself is not interpreted as a project change.

Causal attribution authorization requires a second revision region, at least two asset classes,
eight pre-event and four post-event quarters, treated/control common support,
price-basis reconciliation for CAD outcomes, placebo and negative-control
tests, leave-one-out sensitivity, and independent parser and modelling review.

## Separate public-proxy planning validation

Public-only is a source constraint, not a claim of predictive or causal validity.
The weekly practical-route report now contains `proxy_planning_validation` with
three distinct claim levels: observed evidence, proxy planning, and causal
attribution. Assumption-driven scenarios remain available during validation.
The causal identification requirements above do **not** gate noncausal planning.
Private realized expenditure or labour hours are **not** prerequisites for the
proxy route; public milestones, permits and appropriately scoped price indices
can support its validation.

The current proxy passes lineage reconciliation and ordered sensitivity-case
checks (2 of 7 checks). This is a checklist, not a confidence score. It does not
pass predictive validation: coverage, timing, held-out performance, overlap and
independent review remain unassessed. In-sample association coefficients are
not substituted for a validated executive estimate. Low/high assumptions are
not probabilistic prediction intervals.

### Practical work queue

1. Freeze a scope-specific validation contract before fitting: geography, asset,
   price basis, outcome, prediction horizon, minimum independent events and
   tolerances for predictive error, interval coverage and subgroup performance.
   Start with quarterly market-price planning in the observed Alberta markets;
   do not silently transfer it to monthly project costs or schedule delay.
2. Benchmark proxy-enhanced predictions against a baseline-only model using
   rolling origins and held-out contiguous quarters. Fit preprocessing only on
   training data. Shared market-quarter observations stay in the same fold;
   report effective independent events, not just asset-row counts.
3. Test alternative timing/realization profiles, record linkage or explicit
   overlap bounds, and leave-one-project/source-out sensitivity. Reconcile any
   baseline/increment decomposition to avoid counting the same pressure twice.
4. Publish validation metrics and limitations. Accept a separate independent
   planning-review receipt bound to the frozen model, inputs, domain and horizon.
   Passing may authorize **noncausal proxy-based planning estimates** only.

No automatic promotion is implemented from checklist scores. Future promotion
requires machine-verified validation receipts and a scope-specific review, not
flipping a flag or relaxing the existing causal gate. The current assessment is
an operational gap inventory, not evidence that these remaining experiments
have been performed.
