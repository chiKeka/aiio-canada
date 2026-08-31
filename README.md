# AI Infrastructure Impact Observatory Canada

AIIO Canada is a public research program for tracing how AI infrastructure capital expenditure changes the cost, capacity, and delivery of Canadian public infrastructure. Alberta is the first implementation; the data model is designed to expand province by province.

The product has four linked components:

1. a reproducible public-data evidence pipeline;
2. a typed graph propagation model adapted from the PSPE/S3 dissertation method;
3. an explicit scenario layer for counterfactual investment diagnostics plus a separate MW-based power overlay; and
4. public outputs: an interactive website, weekly digest, downloadable datasets and an auditable Excel workbook.

## Research question

> How, when, and where does AI infrastructure capital expenditure reshape cost, capacity, and delivery across Canada?

The Alberta pilot asks what happens if $50 billion of AI infrastructure investment lands in the province over 2027–2036: which trades tighten first, how much additional electricity and transmission capacity may be implicated, and which public projects are most exposed to competing demand.

## Non-negotiable publication rule

Every published value must be marked as **observed**, **corroborated**, **inferred**, **assumed**, or **scenario-only**. Scenario outputs are not forecasts. The v0.2 pressure scores are uncalibrated structural diagnostics—not empirical findings, probabilities, percentages or project-level delay estimates.

## Local development

```bash
npm install
npm run dev
```

The reproducible analytical gates are:

```bash
npm run research:validate
npm run model:run
npm run power:run
npm run research:test
npm run release:build
npm run release:verify
```

Research architecture and protocols live in `docs/`. The public application lives in `app/` and `components/`. Data, model, workbook and digest packages are added as the build advances.

Academic-use controls are documented in `docs/governance/dissertation-alignment.md` and `docs/governance/ai-assistance-log.md`. The Observatory supports the research; it does not replace the researcher's submitted argument, source verification or required AI disclosure.
