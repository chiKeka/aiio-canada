# PSPE method-source lineage

## Finding

The available local source material supports a conceptual-method inheritance
claim but not a code-reproduction claim. A clean Git-backed `math_lab`
repository is present at commit
`3e63c7aaca03ec96d148f77e55aea40f2b64e40d`; its curriculum, foundations
notebook and concept notes are hash-receipted. The repository identifies a
separate private PSPE engine repository, but the implementation files named by
the curriculum were not located locally.

## Reproducible mapping

`npm run pspe:lineage` validates the source receipt and produces
`data/model-runs/pspe_method_lineage_v0.1.json`. The report maps five bounded
concepts to current AIIO contracts, implementations and tests:

1. typed weighted directed graphs;
2. damped or absorbed propagation;
3. discrete temporal paths;
4. S3-informed scenario stress testing; and
5. fail-closed reference-class calibration.

Each AIIO mapping is an independent implementation. Hashes prove which local
method artifacts informed the mapping and which AIIO files support it; they do
not prove equivalence to unavailable engine source code.

## Non-inheritance boundary

AIIO does not claim that PSPE Bayesian networks, continuous-time ODEs,
probability layers, graph curvature or other later curriculum layers are
implemented. It does not use graph scores as treatment, probability, cost,
delay or observed effect. Centrality and conserved-mass ranking are not causal
estimators.

## Change control

If the separate engine repository is later supplied, record its immutable
commit and file hashes, compare algorithms and defaults, rerun invariant and
golden tests, and issue a new lineage version. Do not overwrite this receipt or
retroactively describe the current engine as a fork.
