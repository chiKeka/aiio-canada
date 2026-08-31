# Generative-AI assistance log

This log records material generative-AI involvement in AIIO Canada so the researcher can verify, disclose and cite it as required. It is not a substitute for the University's prescribed citation format in the submitted dissertation.

| Date | System | Role | Material effect | Verification/disposition |
|---|---|---|---|---|
| 2026-08-31 | OpenAI Codex (GPT-5 family) | Research-program architecture, source-pipeline code, graph/scenario prototype, website and workbook implementation | Generated and edited code, documentation, interface text and release artifacts under researcher direction | Public facts were checked against identified primary sources; automated tests and release checks are retained; all scenario inputs remain labelled assumed or scenario |
| 2026-08-31 | xAI Grok CLI | Independent design-gate critique | Recommended a frozen graph schema, mandatory fact provenance, deterministic propagation, sealed scenarios and a single immutable cross-product release | Controls were adopted and documented in the design-gate review; Grok did not supply public evidence or model parameters |
| 2026-08-31 | xAI Grok CLI | Independent release red-team and implementation re-review | Identified persistence, sensitivity, reproducibility, unit separation, double-counting, interpretation and validation gaps; later rated the corrected build suitable only as a limited pilot while three residual risks remained | Blockers and high-severity findings were translated into tests and release controls; raw model outputs remain available while public pressure values use a disclosed bounded display transform; Grok did not supply evidence or calibrated parameters |
| 2026-08-31 | Anthropic Claude CLI | Intended independent review | No review completed because the local CLI was not authenticated | No Claude output was used; a later authenticated review remains a release gate |

## Maintenance rule

Add an entry whenever a generative-AI system materially changes the research question, source selection, method, model, interpretation, prose, visualization, code or publication. Record prompts/outputs needed for the University's exact citation requirement without storing credentials, personal data or sensitive research material in this repository.
