import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(
  process.env.AIIO_PROJECT_ROOT ?? path.join(scriptDir, '..'),
);
const threadId = '01a0579f-936b-77b3-93e5-be6035628b16';
const outputDir = path.join(projectRoot, 'outputs', threadId);
const previewDir = path.join(projectRoot, 'workbook-work', 'previews');
const workbookBuildVersion = '0.14.0-dev';

const release = JSON.parse(
  await fs.readFile(
    path.join(projectRoot, 'public', 'data', 'latest.json'),
    'utf8',
  ),
);
const outputPath = path.join(
  outputDir,
  `AIIO_Canada_Research_${workbookBuildVersion}.xlsx`,
);
const costBaseline = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model-runs',
      'alberta_bcpi_reference_baseline_v0.1.json',
    ),
    'utf8',
  ),
);
const bcpiRows = parseCsv(
  await fs.readFile(
    path.join(projectRoot, 'data', 'processed', 'bcpi_alberta.csv'),
    'utf8',
  ),
);
const labourRows = parseCsv(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'processed',
      'labour_availability_alberta.csv',
    ),
    'utf8',
  ),
);
const labourCanadaRows = parseCsv(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'processed',
      'labour_availability_canada.csv',
    ),
    'utf8',
  ),
);
const workforceCanadaRows = parseCsv(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'processed',
      'labour_workforce_stock_canada.csv',
    ),
    'utf8',
  ),
);
const materialRows = parseCsv(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'processed',
      'bcpi_material_cost_screen_alberta.csv',
    ),
    'utf8',
  ),
);
const projectExposureRows = parseCsv(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'processed',
      'public_project_exposure_alberta.csv',
    ),
    'utf8',
  ),
);
const powerEvidenceRows = parseCsv(
  await fs.readFile(
    path.join(projectRoot, 'data', 'processed', 'power_evidence_alberta.csv'),
    'utf8',
  ),
);
const scenarioDefinition = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'scenarios',
      'alberta_50b_counterfactual_v0.2.json',
    ),
    'utf8',
  ),
);
const powerDefinition = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'scenarios',
      'alberta_power_overlay_v0.1.json',
    ),
    'utf8',
  ),
);
const provincialProjects = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model-runs',
      'public_projects_bc_on_qc_intake_v0.1.json',
    ),
    'utf8',
  ),
);
const provincialCostBaseline = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model-runs',
      'bc_on_qc_bcpi_reference_baseline_v0.1.json',
    ),
    'utf8',
  ),
);
const provincialPowerPlanning = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model-runs',
      'provincial_power_planning_contract_v0.1.json',
    ),
    'utf8',
  ),
);
const digestManifest = JSON.parse(
  await fs.readFile(
    path.join(projectRoot, 'data', 'digests', '2026-09-01.manifest.json'),
    'utf8',
  ),
);
const currentSourceRegistry = JSON.parse(
  await fs.readFile(
    path.join(projectRoot, 'data', 'registry', 'sources.json'),
    'utf8',
  ),
);
const attributionReadiness = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model-runs',
      'ai_attribution_identification_readiness_v0.1.json',
    ),
    'utf8',
  ),
);
const attributionContract = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model',
      'ai_attribution_panel_contract_v0.1.json',
    ),
    'utf8',
  ),
);
const investmentControlReport = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model-runs',
      'building_investment_controls_canada_v0.1.json',
    ),
    'utf8',
  ),
);
const investmentControlRows = parseCsv(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'processed',
      'building_investment_controls_canada.csv',
    ),
    'utf8',
  ),
);
const procurementOutcomeReport = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model-runs',
      'canadabuys_construction_outcome_feasibility_v0.1.json',
    ),
    'utf8',
  ),
);
const procurementOutcomeRows = parseCsv(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'processed',
      'canadabuys_construction_outcome_feasibility.csv',
    ),
    'utf8',
  ),
);
const permitProxyReport = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model-runs',
      'edmonton_data_centre_permit_proxy_v0.1.json',
    ),
    'utf8',
  ),
);
const permitProxyRows = parseCsv(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'processed',
      'edmonton_data_centre_permit_proxy.csv',
    ),
    'utf8',
  ),
);
const auditedOutcomes = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model-runs',
      'oago_audited_project_outcomes_v0.1.json',
    ),
    'utf8',
  ),
);
const quebecRevisions = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model-runs',
      'quebec_pqi_authorized_project_revisions_v0.1.json',
    ),
    'utf8',
  ),
);
const quebecRevisionRows = parseCsv(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'processed',
      'quebec_pqi_authorized_project_revisions.csv',
    ),
    'utf8',
  ),
);
const quebecVintageContract = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model',
      'quebec_pqi_milestone_vintage_contract_v0.1.json',
    ),
    'utf8',
  ),
);
const quebecLongitudinal = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model-runs',
      'quebec_pqi_milestone_longitudinal_v0.1.json',
    ),
    'utf8',
  ),
);
const quebecLifecycleRows = parseCsv(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'processed',
      'quebec_pqi_milestone_project_lifecycles.csv',
    ),
    'utf8',
  ),
);
const quebecParserReview = JSON.parse(
  await fs.readFile(
    path.join(
      projectRoot,
      'data',
      'model-runs',
      'quebec_pqi_parser_review_package_v0.1.json',
    ),
    'utf8',
  ),
);
const labourPressure = release.labour_pressure;

const workbook = Workbook.create();
const readme = workbook.worksheets.add('Read Me');
const dashboard = workbook.worksheets.add('Dashboard');
const assumptions = workbook.worksheets.add('Assumptions');
const timeline = workbook.worksheets.add('Scenario Timeline');
const pressure = workbook.worksheets.add('Pressure Results');
const sensitivity = workbook.worksheets.add('Sensitivity');
const powerOverlay = workbook.worksheets.add('Power Overlay');
const projects = workbook.worksheets.add('AI Projects');
const bcpi = workbook.worksheets.add('BCPI Data');
const labour = workbook.worksheets.add('Labour Availability');
const labourCanada = workbook.worksheets.add('Labour Canada');
const workforceCanada = workbook.worksheets.add('Workforce Stock');
const labourDiagnostic = workbook.worksheets.add('Labour Diagnostic');
const materialScreen = workbook.worksheets.add('Material Screen');
const projectExposure = workbook.worksheets.add('Project Exposure');
const powerEvidence = workbook.worksheets.add('Power Evidence');
const costBaselineSheet = workbook.worksheets.add('Cost Baseline');
const projectCost = workbook.worksheets.add('Project Cost Check');
const canadaExpansion = workbook.worksheets.add('Canada Expansion');
const attributionGate = workbook.worksheets.add('Attribution Gate');
const investmentControls = workbook.worksheets.add('Investment Controls');
const procurementIntake = workbook.worksheets.add('Procurement Intake');
const permitProxy = workbook.worksheets.add('Permit Proxy');
const auditedOutcomeSheet = workbook.worksheets.add('Audited Outcomes');
const quebecRevisionSheet = workbook.worksheets.add('Quebec Revisions');
const quebecVintageSheet = workbook.worksheets.add('Quebec Vintages');
const sources = workbook.worksheets.add('Sources');
const checks = workbook.worksheets.add('Release Checks');

const C = {
  navy: '#0B2A36',
  navy2: '#123746',
  teal: '#2F8F83',
  tealDark: '#155D58',
  tealLight: '#DDEDE8',
  paper: '#F5F3EC',
  white: '#FFFFFF',
  ink: '#17343D',
  muted: '#667873',
  line: '#D3DCD6',
  amber: '#D66B35',
  amberLight: '#FFF0E4',
  blueInput: '#0070C0',
  soft: '#EBEEE8',
};

for (const sheet of [
  readme,
  dashboard,
  assumptions,
  timeline,
  pressure,
  sensitivity,
  powerOverlay,
  projects,
  bcpi,
  labour,
  labourCanada,
  workforceCanada,
  labourDiagnostic,
  materialScreen,
  projectExposure,
  powerEvidence,
  costBaselineSheet,
  projectCost,
  canadaExpansion,
  attributionGate,
  investmentControls,
  procurementIntake,
  permitProxy,
  auditedOutcomeSheet,
  quebecRevisionSheet,
  quebecVintageSheet,
  sources,
  checks,
]) {
  sheet.showGridLines = false;
}

await workbook.comments.setSelf({ displayName: 'User' });

buildReadMe();
buildAssumptions();
buildScenarioTimeline();
buildPressureResults();
buildSensitivity();
buildPowerOverlay();
buildProjects();
buildBcpi();
buildLabour();
buildLabourCanada();
buildWorkforceCanada();
buildLabourDiagnostic();
buildMaterialScreen();
buildProjectExposure();
buildPowerEvidence();
buildCostBaseline();
buildProjectCostCheck();
buildCanadaExpansion();
buildAttributionGate();
buildInvestmentControls();
buildProcurementIntake();
buildPermitProxy();
buildAuditedOutcomes();
buildQuebecRevisions();
buildQuebecVintages();
buildSources();
buildReleaseChecks();
buildDashboard();

await workbook.comments.addThread(
  { cell: assumptions.getRange('B5') },
  'Scenario-only input. This is not a forecast or a total of committed projects.',
);
await workbook.comments.addThread(
  { cell: assumptions.getRange('B10') },
  'Assumed share of locally captured construction and service demand. Test through sensitivity analysis before interpretation.',
);
await workbook.comments.addThread(
  { cell: assumptions.getRange('C24') },
  'IT load is an independent power-case assumption. It is not derived from capital expenditure.',
);
await workbook.comments.addThread(
  { cell: projectCost.getRange('B8') },
  'Demonstration input only. Replace it with a project estimate stated in the exact price-basis quarter shown below.',
);
await workbook.comments.addThread(
  { cell: projectCost.getRange('B9') },
  'Version 0.1 requires the estimate price basis to match the latest observed baseline quarter. Rebasing is not yet implemented.',
);

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const inspectDashboard = await workbook.inspect({
  kind: 'table',
  range: 'Dashboard!A1:L48',
  include: 'values,formulas',
  tableMaxRows: 48,
  tableMaxCols: 12,
});
console.log(inspectDashboard.ndjson);

const inspectReadMe = await workbook.inspect({
  kind: 'table',
  range: 'Read Me!A1:H50',
  include: 'values,formulas',
  tableMaxRows: 50,
  tableMaxCols: 8,
});
console.log(inspectReadMe.ndjson);

const inspectProjectCost = await workbook.inspect({
  kind: 'table',
  range: 'Project Cost Check!A1:L38',
  include: 'values,formulas',
  tableMaxRows: 38,
  tableMaxCols: 12,
});
console.log(inspectProjectCost.ndjson);

const inspectChecks = await workbook.inspect({
  kind: 'table',
  range: 'Release Checks!A1:D48',
  include: 'values,formulas',
  tableMaxRows: 48,
  tableMaxCols: 4,
});
console.log(inspectChecks.ndjson);

const inspectCanadaExpansion = await workbook.inspect({
  kind: 'table',
  range: 'Canada Expansion!A1:J48',
  include: 'values,formulas',
  tableMaxRows: 48,
  tableMaxCols: 10,
});
console.log(inspectCanadaExpansion.ndjson);

const inspectAttributionGate = await workbook.inspect({
  kind: 'table',
  range: 'Attribution Gate!A1:J48',
  include: 'values,formulas',
  tableMaxRows: 48,
  tableMaxCols: 10,
});
console.log(inspectAttributionGate.ndjson);

const inspectInvestmentControls = await workbook.inspect({
  kind: 'table',
  range: 'Investment Controls!A1:R18',
  include: 'values,formulas',
  tableMaxRows: 18,
  tableMaxCols: 18,
});
console.log(inspectInvestmentControls.ndjson);

const inspectProcurementIntake = await workbook.inspect({
  kind: 'table',
  range: 'Procurement Intake!A1:X18',
  include: 'values,formulas',
  tableMaxRows: 18,
  tableMaxCols: 24,
});
console.log(inspectProcurementIntake.ndjson);

const inspectPermitProxy = await workbook.inspect({
  kind: 'table',
  range: 'Permit Proxy!A1:M42',
  include: 'values,formulas',
  tableMaxRows: 42,
  tableMaxCols: 13,
});
console.log(inspectPermitProxy.ndjson);

const inspectAuditedOutcomes = await workbook.inspect({
  kind: 'table',
  range: 'Audited Outcomes!A1:O46',
  include: 'values,formulas',
  tableMaxRows: 46,
  tableMaxCols: 15,
});
console.log(inspectAuditedOutcomes.ndjson);

const inspectQuebecRevisions = await workbook.inspect({
  kind: 'table',
  range: 'Quebec Revisions!A1:R38',
  include: 'values,formulas',
  tableMaxRows: 38,
  tableMaxCols: 18,
});
console.log(inspectQuebecRevisions.ndjson);

const inspectQuebecVintages = await workbook.inspect({
  kind: 'table',
  range: 'Quebec Vintages!A1:O42',
  include: 'values,formulas',
  tableMaxRows: 42,
  tableMaxCols: 15,
});
console.log(inspectQuebecVintages.ndjson);

const errors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 300 },
  summary: 'final formula error scan',
});
console.log(errors.ndjson);

const previewRanges = {
  'Read Me': 'A1:H50',
  Dashboard: 'A1:L48',
  Assumptions: 'A1:K38',
  'Scenario Timeline': 'A1:H17',
  'Pressure Results': 'A1:L20',
  Sensitivity: 'A1:M18',
  'Power Overlay': 'A1:J36',
  'AI Projects': 'A1:Q18',
  'BCPI Data': 'A1:I24',
  'Labour Availability': 'A1:O32',
  'Labour Canada': 'A1:Q28',
  'Workforce Stock': 'A1:S28',
  'Labour Diagnostic': 'A1:N28',
  'Material Screen': 'A1:R38',
  'Project Exposure': 'A1:Y24',
  'Power Evidence': 'A1:H28',
  'Cost Baseline': 'A1:P54',
  'Project Cost Check': 'A1:L38',
  'Canada Expansion': 'A1:J48',
  'Attribution Gate': 'A1:J48',
  'Investment Controls': 'A1:R28',
  'Procurement Intake': 'A1:X28',
  'Permit Proxy': 'A1:M42',
  'Audited Outcomes': 'A1:O46',
  'Quebec Revisions': 'A1:R38',
  'Quebec Vintages': 'A1:O42',
  Sources: 'A1:J34',
  'Release Checks': 'A1:D50',
};
for (const [sheetName, range] of Object.entries(previewRanges)) {
  const preview = await workbook.render({
    sheetName,
    range,
    scale: 1,
    format: 'png',
  });
  await fs.writeFile(
    path.join(
      previewDir,
      `${sheetName.replaceAll(' ', '_').toLowerCase()}.png`,
    ),
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(JSON.stringify({ outputPath, previewDir }));

function buildReadMe() {
  titleBand(
    readme,
    'AI Infrastructure Impact Observatory Canada',
    `Canada development workbook ${workbookBuildVersion} · public release basis ${release.manifest.version}`,
    'H',
  );
  readme.getRange('A5:H5').merge();
  readme.getRange('A5').values = [['Purpose']];
  sectionHeader(readme.getRange('A5:H5'));
  readme.getRange('A6:H8').merge();
  readme.getRange('A6').values = [
    [
      'This workbook is an auditable analysis component of AIIO Canada. It reproduces selected public-release outputs, exposes scenario assumptions and carries internal validation plus clearly gated Canada-expansion evidence. The evidence registry, analytical code and immutable artifacts remain the system of record. Research-intake sheets do not change the public release basis, and cost outputs remain withheld until every required model and review gate passes.',
    ],
  ];
  noteBlock(readme.getRange('A6:H8'));

  readme.getRange('A10:B10').values = [['Evidence status', 'Meaning']];
  header(readme.getRange('A10:B10'));
  readme.getRange('A11:B15').values = [
    ['Observed', 'Directly reported by an identified public source.'],
    [
      'Inferred',
      'Derived through a disclosed transformation or classification.',
    ],
    ['Assumed', 'Selected parameter with rationale and sensitivity range.'],
    ['Scenario', 'Counterfactual input or output; not a forecast.'],
    [
      'Withheld',
      'Calculated output is intentionally blank because a required gate did not pass.',
    ],
  ];
  readme.getRange('A11:A15').format.font = { bold: true };
  readme.getRange('A11:B15').format.borders = {
    preset: 'inside',
    style: 'thin',
    color: C.line,
  };

  readme.getRange('A17:H17').merge();
  readme.getRange('A17').values = [['How to use this workbook']];
  sectionHeader(readme.getRange('A17:H17'));
  readme.getRange('A18:H44').values = [
    [
      '1',
      'Dashboard',
      'Read key observed and scenario outputs with their status labels.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '2',
      'Assumptions',
      'Edit blue-font scenario inputs only; formula cells remain black.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '3',
      'Scenario Timeline',
      'Inspect the annual capex decomposition and formula lineage.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '4',
      'Pressure Results',
      'Review the graph engine low/central/high pressure outputs.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '5',
      'Sensitivity',
      'Inspect denominator, absorption, capture, retention and joint stress tests.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '6',
      'Power Overlay',
      'Review the independent MW-based commissioning and transfer proxy.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '7',
      'AI Projects',
      'Inspect public project fields and the inferred AI classification.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '8',
      'BCPI Data',
      'Review the recent Calgary and Edmonton price-index observations.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '9',
      'Labour Availability',
      'Inspect Alberta vacancies, offered wages, quality flags and suppressed cells.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '10',
      'Labour Canada',
      'Compare latest-quarter publication coverage across all provinces and territories.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '11',
      'Workforce Stock',
      'Inspect 2021 Census employed-person counts, reference-week lineage and zero fillers.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '12',
      'Labour Diagnostic',
      'Review the guarded cross-vintage recruitment screen and formula reconciliation.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '13',
      'Material Screen',
      'Inspect selected BCPI component proxies and disclosed change calculations.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '14',
      'Project Exposure',
      'Inspect inferred asset classes, schedule overlap and cost-data coverage.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '15',
      'Power Evidence',
      'Separate AESO requests, limits and contracts from the independent power scenario.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '16',
      'Cost Baseline',
      'Inspect every asset, geography and horizon validation gate; failed projections stay blank.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '17',
      'Project Cost Check',
      'Enter a project and expenditure profile; outputs remain blank unless all gates pass.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '18',
      'Canada Expansion',
      'Inspect current provincial intake summaries and the gates that keep them outside Decision Mode.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '19',
      'Attribution Gate',
      'Inspect the preregistered treatment, outcome, control and diagnostic gates for an AI-attributable effect.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '20',
      'Investment Controls',
      'Inspect the Canada-wide quarterly building-investment control panel and its source lineage.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '21',
      'Procurement Intake',
      'Inspect the CanadaBuys construction linkage and the authorizing outcome fields that remain absent.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '22',
      'Permit Proxy',
      'Inspect Edmonton permit activity, conservative keyword classifications and the non-authorizing treatment boundary.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '23',
      'Audited Outcomes',
      'Inspect hash-locked named project outcomes, component bridges and the fields still missing for attribution.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '24',
      'Quebec Revisions',
      'Inspect stable lifecycle IDs and chain-reconciled authorized cost and completion-month changes; this is not final outturn evidence.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '25',
      'Quebec Vintages',
      'Inspect threshold-aware archive milestones, survivor-selection diagnostics and pending parser-review status.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '26',
      'Sources',
      'Open the current research source register, distinguish release sources and check source vintages.',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      '27',
      'Release Checks',
      'Confirm formula reconciliations and manifest identity.',
      '',
      '',
      '',
      '',
      '',
    ],
  ];
  readme.getRange('A18:A44').format.font = { bold: true, color: C.tealDark };
  readme.getRange('B18:B44').format.font = { bold: true };
  readme.getRange('C18:H44').merge(true);
  readme.getRange('A46:H46').merge();
  readme.getRange('A46').values = [['Interpretation boundary']];
  sectionHeader(readme.getRange('A46:H46'), C.amber);
  readme.getRange('A47:H47').merge();
  readme.getRange('A47').values = [
    [
      `WITHHELD COST OUTPUTS + UNCALIBRATED STRUCTURAL DIAGNOSTIC. Only 1 of 40 asset/geography/horizon cost-baseline checks passes; every four- and five-year Alberta health and school reference projection is unavailable. No public project-cost result is authorized. The Edmonton screen finds ${permitProxyReport.data_centre_candidate_count} explicit data-centre permit candidates with ${permitProxyReport.explicit_ai_reference_count} explicit AI references and ${permitProxyReport.data_centre_candidate_occupancy_date_available_count} candidate occupancy dates; publisher-estimated permit values remain activity proxies, not AI capex or realized spend. Quebec supplies ${quebecRevisions.coverage_summary.cost_revision_chain_reconciled_project_count} reconciled authorized-cost chains and ${quebecRevisions.coverage_summary.schedule_revision_chain_reconciled_project_count} completion-month chains. Its ${quebecLongitudinal.vintage_count} selected milestones contain ${quebecLongitudinal.unique_project_count} unique IDs, of which ${quebecLongitudinal.absent_from_latest_project_count} are absent from the latest snapshot; absence is not an exit outcome. The archive sample is incomplete and the ${quebecParserReview.sample_project_count}-project parser review is pending. All AI-attributable cost and delay fields remain null. Pressure scores are not findings, forecasts, probabilities or percentages. The graph is a mechanism layer and is not monetized. Additional transmission for the $50B case remains unknown.`,
    ],
  ];
  readme.getRange('A47:H47').format = {
    fill: C.amberLight,
    font: { color: '#7B4529' },
    wrapText: true,
    verticalAlignment: 'center',
  };
  readme.getRange('A47').format.rowHeight = 156;
  setWidths(
    readme,
    { A: 12, B: 30, C: 26, D: 16, E: 16, F: 16, G: 16, H: 16 },
    51,
  );
}

function buildAssumptions() {
  titleBand(
    assumptions,
    'Scenario assumptions',
    'Editable inputs are blue. CAD pressure and MW power remain separate.',
    'K',
  );
  assumptions.getRange('A5:B10').values = [
    [
      'Total AI infrastructure capex (CAD)',
      scenarioDefinition.investment_total_cad,
    ],
    ['Start year', scenarioDefinition.start_year],
    ['End year', scenarioDefinition.end_year],
    ['Delivery years', null],
    ['Currency year', scenarioDefinition.currency_year],
    ['Local capture share', scenarioDefinition.local_capture_share],
  ];
  assumptions.getRange('B8').formulas = [['=B7-B6+1']];
  inputStyle(assumptions.getRange('B5:B7'));
  inputStyle(assumptions.getRange('B9:B10'));
  assumptions.getRange('B5').format.numberFormat = '$#,##0';
  assumptions.getRange('B10').format.numberFormat = '0.0%';
  assumptions.getRange('A5:A10').format.font = { bold: true, color: C.ink };
  assumptions.dataValidations.add({
    range: 'B5',
    rule: { type: 'decimal', operator: 'greaterThanOrEqual', formula1: 0 },
  });
  assumptions.dataValidations.add({
    range: 'B6:B7',
    rule: {
      type: 'whole',
      operator: 'between',
      formula1: 2026,
      formula2: 2050,
    },
  });

  assumptions.getRange('A12:C12').values = [
    ['Capex component', 'Share', 'Evidence status'],
  ];
  header(assumptions.getRange('A12:C12'));
  const components = Object.entries(scenarioDefinition.components);
  assumptions.getRange(`A13:C${12 + components.length}`).values =
    components.map(([name, value]) => [labelize(name), value, 'scenario']);
  inputStyle(assumptions.getRange('B13:B18'));
  assumptions.getRange('B13:B18').format.numberFormat = '0.0%';
  assumptions.getRange('A19:C19').values = [
    ['Component share check', null, 'must equal 100%'],
  ];
  assumptions.getRange('B19').formulas = [['=SUM(B13:B18)']];
  assumptions.getRange('B19').format.numberFormat = '0.0%';
  assumptions.getRange('A19:C19').format = {
    fill: C.soft,
    font: { bold: true, color: C.ink },
    borders: { preset: 'doubleBottom', style: 'thin', color: C.teal },
  };

  assumptions.getRange('A22:K22').values = [
    [
      'Power case',
      'Case status',
      'IT load at full build (MW)',
      'Energy PUE',
      'Peak-to-IT factor',
      'Load factor',
      'Grid share',
      'Peak coincidence',
      'Planning margin',
      'Facility peak (MW)',
      'Transfer proxy (MW)',
    ],
  ];
  header(assumptions.getRange('A22:K22'));
  const powerCases = ['low', 'central', 'high'];
  assumptions.getRange('A23:I25').values = powerCases.map((caseName) => {
    const p = powerDefinition.cases[caseName];
    return [
      caseName,
      'scenario',
      p.it_load_mw_at_full_buildout,
      p.energy_pue,
      p.peak_to_it_factor,
      p.load_factor,
      p.grid_supply_share,
      p.peak_coincidence,
      p.planning_margin,
    ];
  });
  inputStyle(assumptions.getRange('C23:I25'));
  assumptions.getRange('J23').formulas = [['=C23*E23']];
  assumptions.getRange('J23:J25').fillDown();
  assumptions.getRange('K23').formulas = [['=J23*G23*H23*(1+I23)']];
  assumptions.getRange('K23:K25').fillDown();
  assumptions.getRange('C23:C25').format.numberFormat = '#,##0';
  assumptions.getRange('F23:I25').format.numberFormat = '0.0%';
  assumptions.getRange('D23:E25').format.numberFormat = '0.00';
  assumptions.getRange('J23:K25').format.numberFormat = '#,##0.0';

  assumptions.getRange('A28:D28').values = [
    ['Pressure shock denominator', 'CAD', 'Evidence status', 'Purpose'],
  ];
  header(assumptions.getRange('A28:D28'));
  const denominators = Object.entries(
    scenarioDefinition.normalization_denominators_cad,
  );
  assumptions.getRange('A29:D31').values = denominators.map(([name, value]) => [
    labelize(name),
    value,
    'assumed',
    'Converts annual local capex to a dimensionless shock',
  ]);
  inputStyle(assumptions.getRange('B29:B31'));
  assumptions.getRange('B29:B31').format.numberFormat = '$#,##0';

  assumptions.getRange('A34:K37').merge();
  assumptions.getRange('A34').values = [
    [
      `${scenarioDefinition.normalization_note} ${scenarioDefinition.capture_note} ${scenarioDefinition.exclusion_note} ${powerDefinition.assumption_note}`,
    ],
  ];
  noteBlock(assumptions.getRange('A34:K37'));
  assumptions.freezePanes.freezeRows(4);
  setWidths(
    assumptions,
    {
      A: 31,
      B: 16,
      C: 20,
      D: 13,
      E: 15,
      F: 13,
      G: 13,
      H: 15,
      I: 14,
      J: 18,
      K: 19,
    },
    38,
  );
}

function buildScenarioTimeline() {
  titleBand(
    timeline,
    'Alberta $50B scenario timeline',
    'Formula-driven annual decomposition · 2027–2036 counterfactual diagnostic',
    'H',
  );
  timeline.getRange('A4:H4').values = [
    [
      'Year',
      'Annual profile',
      'Total capex (CAD)',
      'Local civil (CAD)',
      'Local electrical & mechanical (CAD)',
      'Local grid construction (CAD)',
      'Excluded from graph (CAD)',
      'Evidence status',
    ],
  ];
  header(timeline.getRange('A4:H4'));
  const years = scenarioDefinition.annual_profile.length;
  timeline.getRange(`B5:B${4 + years}`).values =
    scenarioDefinition.annual_profile.map((value) => [value]);
  inputStyle(timeline.getRange(`B5:B${4 + years}`));
  for (let index = 0; index < years; index += 1) {
    const row = 5 + index;
    timeline.getRange(`A${row}`).formulas = [
      [index === 0 ? "='Assumptions'!B6" : `=A${row - 1}+1`],
    ];
    timeline.getRange(`C${row}`).formulas = [[`='Assumptions'!$B$5*B${row}`]];
    timeline.getRange(`D${row}`).formulas = [
      [
        `=C${row}*('Assumptions'!$B$13+'Assumptions'!$B$14)*'Assumptions'!$B$10`,
      ],
    ];
    timeline.getRange(`E${row}`).formulas = [
      [`=C${row}*'Assumptions'!$B$15*'Assumptions'!$B$10`],
    ];
    timeline.getRange(`F${row}`).formulas = [
      [`=C${row}*'Assumptions'!$B$16*'Assumptions'!$B$10`],
    ];
    timeline.getRange(`G${row}`).formulas = [
      [`=C${row}*('Assumptions'!$B$17+'Assumptions'!$B$18)`],
    ];
    timeline.getRange(`H${row}`).values = [['scenario']];
  }
  const totalRow = 5 + years;
  timeline.getRange(`A${totalRow}:H${totalRow}`).values = [
    ['Total / check', null, null, null, null, null, null, 'scenario'],
  ];
  for (const col of ['B', 'C', 'D', 'E', 'F', 'G'])
    timeline.getRange(`${col}${totalRow}`).formulas = [
      [`=SUM(${col}5:${col}${totalRow - 1})`],
    ];
  timeline.getRange(`A${totalRow}:H${totalRow}`).format = {
    fill: C.soft,
    font: { bold: true, color: C.ink },
    borders: { preset: 'doubleBottom', style: 'thin', color: C.teal },
  };
  timeline.getRange(`B5:B${totalRow}`).format.numberFormat = '0.0%';
  timeline.getRange(`C5:G${totalRow}`).format.numberFormat = '$#,##0';
  timeline.freezePanes.freezeRows(4);
  setWidths(
    timeline,
    { A: 12, B: 15, C: 22, D: 22, E: 30, F: 25, G: 23, H: 18 },
    17,
  );
}

function buildPressureResults() {
  titleBand(
    pressure,
    'Graph pressure results',
    'Uncalibrated structural cases from the immutable scenario release',
    'L',
  );
  pressure.getRange('A4:L4').values = [
    [
      'Node ID',
      'Label',
      'Node type',
      'Low',
      'Low peak year',
      'Central',
      'Central peak year',
      'High',
      'High peak year',
      'Evidence status',
      'Model ID',
      'Interpretation',
    ],
  ];
  header(pressure.getRange('A4:L4'));
  const rows = [
    ...release.scenario.trade_pressure_order,
    ...release.scenario.public_delivery_pressure_order,
  ];
  pressure.getRange(`A5:L${4 + rows.length}`).values = rows.map((item) => [
    item.node_id,
    item.label,
    item.node_type,
    item.low,
    item.low_peak_year,
    item.central,
    item.central_peak_year,
    item.high,
    item.high_peak_year,
    'scenario',
    release.manifest.model_version,
    'Dimensionless pressure score; not a percentage, finding, worker count, cost or delay',
  ]);
  pressure.getRange(`D5:D${4 + rows.length}`).format.numberFormat = '0.00';
  pressure.getRange(`F5:F${4 + rows.length}`).format.numberFormat = '0.00';
  pressure.getRange(`H5:H${4 + rows.length}`).format.numberFormat = '0.00';
  pressure
    .getRange(`F5:F${4 + rows.length}`)
    .conditionalFormats.add('dataBar', { color: C.teal, gradient: true });
  pressure.getRange(`J5:J${4 + rows.length}`).format = {
    fill: C.amberLight,
    font: { color: '#8A4826' },
  };
  pressure.freezePanes.freezeRows(4);
  setWidths(
    pressure,
    {
      A: 37,
      B: 35,
      C: 15,
      D: 10,
      E: 13,
      F: 10,
      G: 15,
      H: 10,
      I: 13,
      J: 18,
      K: 23,
      L: 48,
    },
    20,
  );
}

function buildSensitivity() {
  titleBand(
    sensitivity,
    'Scenario sensitivity',
    'One-at-a-time and joint structural diagnostics · not probability bounds',
    'M',
  );
  sensitivity.getRange('A4:M4').values = [
    [
      'Sensitivity ID',
      'Label',
      'Weight case',
      'Retention case',
      'Denominator multiplier',
      'Absorption adjustment',
      'Local capture',
      'Top resource',
      'Resource score',
      'Peak year',
      'Top public outcome',
      'Outcome score',
      'Peak year',
    ],
  ];
  header(sensitivity.getRange('A4:M4'));
  const rows = release.scenario.sensitivity;
  sensitivity.getRange(`A5:M${4 + rows.length}`).values = rows.map((item) => [
    item.sensitivity_id,
    item.label,
    item.weight_case,
    item.retention_case,
    item.denominator_multiplier,
    item.absorption_adjustment,
    item.local_capture_share,
    item.top_resource.label,
    item.top_resource.pressure_score,
    item.top_resource.calendar_year,
    item.top_public_delivery_outcome.label,
    item.top_public_delivery_outcome.pressure_score,
    item.top_public_delivery_outcome.calendar_year,
  ]);
  sensitivity.getRange(`E5:F${4 + rows.length}`).format.numberFormat = '0.00';
  sensitivity.getRange(`G5:G${4 + rows.length}`).format.numberFormat = '0%';
  sensitivity.getRange(`I5:I${4 + rows.length}`).format.numberFormat = '0.00';
  sensitivity.getRange(`L5:L${4 + rows.length}`).format.numberFormat = '0.00';
  sensitivity
    .getRange(`I5:I${4 + rows.length}`)
    .conditionalFormats.add('dataBar', { color: C.teal, gradient: true });
  sensitivity.freezePanes.freezeRows(4);
  setWidths(
    sensitivity,
    {
      A: 27,
      B: 32,
      C: 14,
      D: 16,
      E: 20,
      F: 20,
      G: 15,
      H: 28,
      I: 15,
      J: 12,
      K: 36,
      L: 15,
      M: 12,
    },
    18,
  );
}

function buildPowerOverlay() {
  titleBand(
    powerOverlay,
    'Independent Alberta power overlay',
    'MW-based commissioning scenario · separate from the CAD pressure graph',
    'J',
  );
  powerOverlay.getRange('A4:J4').values = [
    [
      'Case',
      'Calendar year',
      'Commissioned share',
      'Cumulative share',
      'IT load (MW)',
      'Grid-coincident demand (MW)',
      'Planning transfer proxy (MW)',
      'Full-build facility peak (MW)',
      'Full-build annual energy (GWh)',
      'Evidence status',
    ],
  ];
  header(powerOverlay.getRange('A4:J4'));
  const rows = [];
  for (const caseName of ['low', 'central', 'high']) {
    const caseRun = release.power_overlay.cases[caseName];
    for (const annual of caseRun.annual) {
      rows.push([
        caseName,
        annual.calendar_year,
        annual.commissioned_share,
        annual.cumulative_commissioned_share,
        annual.it_load_mw,
        annual.grid_coincident_mw,
        annual.planning_transfer_proxy_mw,
        caseRun.full_buildout.facility_peak_mw,
        caseRun.full_buildout.annual_energy_gwh,
        'scenario',
      ]);
    }
  }
  powerOverlay.getRange(`A5:J${4 + rows.length}`).values = rows;
  powerOverlay.getRange(`C5:D${4 + rows.length}`).format.numberFormat = '0.0%';
  powerOverlay.getRange(`E5:I${4 + rows.length}`).format.numberFormat =
    '#,##0.0';
  powerOverlay.getRange(`J5:J${4 + rows.length}`).format = {
    fill: C.amberLight,
    font: { color: '#8A4826' },
  };
  const table = powerOverlay.tables.add(
    `A4:J${4 + rows.length}`,
    true,
    'PowerOverlayTable',
  );
  table.style = 'TableStyleMedium2';
  powerOverlay.freezePanes.freezeRows(4);
  setWidths(
    powerOverlay,
    { A: 12, B: 14, C: 18, D: 18, E: 18, F: 28, G: 29, H: 28, I: 30, J: 18 },
    34,
  );
}

function buildProjects() {
  titleBand(
    projects,
    'Alberta AI-relevant project register',
    'Observed project fields with inferred relevance classification',
    'Q',
  );
  const headers = [
    'Project ID',
    'Name',
    'Reported cost (CAD)',
    'Municipality',
    'Start year',
    'End year',
    'Stage',
    'Developer',
    'Project URL',
    'Longitude',
    'Latitude',
    'Location precision',
    'AI relevance',
    'Source status',
    'Classification status',
    'As-of date',
    'Register source URL',
  ];
  projects.getRange('A4:Q4').values = [headers];
  header(projects.getRange('A4:Q4'));
  const rows = release.baseline.projects;
  projects.getRange(`A5:Q${4 + rows.length}`).values = rows.map((item) => [
    item.project_id,
    item.name,
    item.estimated_cost_cad,
    item.municipality,
    item.start_year,
    item.end_year,
    item.stage,
    item.developer,
    item.project_website,
    item.longitude,
    item.latitude,
    item.location_precision,
    item.ai_relevance,
    item.source_evidence_status,
    item.classification_evidence_status,
    new Date(`${item.as_of_date}T00:00:00Z`),
    'https://www.majorprojects.alberta.ca/',
  ]);
  projects.getRange(`C5:C${4 + rows.length}`).format.numberFormat = '$#,##0';
  projects.getRange(`J5:K${4 + rows.length}`).format.numberFormat = '0.0000';
  projects.getRange(`P5:P${4 + rows.length}`).format.numberFormat =
    'yyyy-mm-dd';
  const table = projects.tables.add(
    `A4:Q${4 + rows.length}`,
    true,
    'AIProjectsTable',
  );
  table.style = 'TableStyleMedium2';
  projects.freezePanes.freezeRows(4);
  projects.freezePanes.freezeColumns(2);
  setWidths(
    projects,
    {
      A: 15,
      B: 39,
      C: 20,
      D: 22,
      E: 12,
      F: 12,
      G: 19,
      H: 31,
      I: 36,
      J: 13,
      K: 13,
      L: 17,
      M: 21,
      N: 15,
      O: 20,
      P: 14,
      Q: 36,
    },
    30,
  );
}

function buildBcpi() {
  titleBand(
    bcpi,
    'Alberta construction-price evidence',
    'Recent Calgary and Edmonton observations from Statistics Canada table 18-10-0289-01',
    'I',
  );
  const selected = bcpiRows
    .filter((row) =>
      [
        'BCPI_NON_RESIDENTIAL_BUILDINGS_622_DIVISION_COMPOSITE',
        'BCPI_SCHOOL_DIVISION_COMPOSITE',
      ].includes(row.indicator_id),
    )
    .sort((a, b) =>
      `${a.indicator_id}|${a.geography_id}|${a.period_end}`.localeCompare(
        `${b.indicator_id}|${b.geography_id}|${b.period_end}`,
      ),
    );
  const recent = [];
  for (const key of new Set(
    selected.map((row) => `${row.indicator_id}|${row.geography_id}`),
  )) {
    recent.push(
      ...selected
        .filter((row) => `${row.indicator_id}|${row.geography_id}` === key)
        .slice(-12),
    );
  }
  bcpi.getRange('A4:I4').values = [
    [
      'Observation ID',
      'Indicator ID',
      'Geography ID',
      'Period end',
      'Value',
      'Unit',
      'Evidence status',
      'Source ID',
      'Source URL',
    ],
  ];
  header(bcpi.getRange('A4:I4'));
  bcpi.getRange(`A5:I${4 + recent.length}`).values = recent.map((row) => [
    row.observation_id,
    row.indicator_id,
    row.geography_id,
    new Date(`${row.period_end}T00:00:00Z`),
    Number(row.value),
    row.unit,
    row.evidence_status,
    row.source_id,
    'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810028901',
  ]);
  bcpi.getRange(`D5:D${4 + recent.length}`).format.numberFormat = 'yyyy-mm-dd';
  bcpi.getRange(`E5:E${4 + recent.length}`).format.numberFormat = '0.0';
  const table = bcpi.tables.add(
    `A4:I${4 + recent.length}`,
    true,
    'BCPIEvidenceTable',
  );
  table.style = 'TableStyleMedium2';
  bcpi.freezePanes.freezeRows(4);
  bcpi.freezePanes.freezeColumns(2);
  setWidths(
    bcpi,
    { A: 29, B: 48, C: 16, D: 14, E: 12, F: 22, G: 17, H: 28, I: 45 },
    24,
  );
}

function buildLabour() {
  titleBand(
    labour,
    'Alberta trade labour evidence',
    'Statistics Canada table 14-10-0444-01 · missing and suppressed values remain blank',
    'O',
  );
  const headers = [
    'Observation ID',
    'NOC',
    'Occupation',
    'Model trade node',
    'Statistic',
    'Value',
    'Unit',
    'Period start',
    'Period end',
    'Evidence status',
    'Source ID',
    'Transformation ID',
    'Quality flags',
    'Source URL',
    'Missingness check',
  ];
  labour.getRange('A4:O4').values = [headers];
  header(labour.getRange('A4:O4'));
  const ordered = [...labourRows].sort((a, b) => {
    const periodOrder = b.period_end.localeCompare(a.period_end);
    return (
      periodOrder ||
      `${a.trade_node_id}|${a.noc_code}|${a.statistic}`.localeCompare(
        `${b.trade_node_id}|${b.noc_code}|${b.statistic}`,
      )
    );
  });
  labour.getRange(`A5:O${4 + ordered.length}`).values = ordered.map((row) => [
    row.observation_id,
    row.noc_code,
    row.occupation_label,
    row.trade_node_id,
    row.statistic,
    row.value === '' ? null : Number(row.value),
    row.unit,
    new Date(`${row.period_start}T00:00:00Z`),
    new Date(`${row.period_end}T00:00:00Z`),
    row.evidence_status,
    row.source_id,
    row.transformation_id,
    row.quality_flags,
    'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410044401',
    row.value !== '' ||
    row.quality_flags.includes('value_missing_or_suppressed')
      ? 'PASS'
      : 'FAIL',
  ]);
  labour.getRange(`F5:F${4 + ordered.length}`).format.numberFormat = '0.00';
  labour.getRange(`H5:I${4 + ordered.length}`).format.numberFormat =
    'yyyy-mm-dd';
  labour
    .getRange(`O5:O${4 + ordered.length}`)
    .conditionalFormats.add('containsText', {
      text: 'PASS',
      format: { fill: C.tealLight, font: { color: C.tealDark, bold: true } },
    });
  labour
    .getRange(`O5:O${4 + ordered.length}`)
    .conditionalFormats.add('containsText', {
      text: 'FAIL',
      format: { fill: '#FDE8E5', font: { color: '#A33D32', bold: true } },
    });
  const table = labour.tables.add(
    `A4:O${4 + ordered.length}`,
    true,
    'LabourAvailabilityTable',
  );
  table.style = 'TableStyleMedium2';
  labour.freezePanes.freezeRows(4);
  labour.freezePanes.freezeColumns(3);
  setWidths(
    labour,
    {
      A: 29,
      B: 10,
      C: 46,
      D: 24,
      E: 31,
      F: 13,
      G: 13,
      H: 14,
      I: 14,
      J: 17,
      K: 28,
      L: 31,
      M: 38,
      N: 45,
      O: 18,
    },
    26,
  );
}

function buildLabourCanada() {
  const national = release.baseline.labour_availability_canada;
  titleBand(
    labourCanada,
    'Canada provincial trade labour evidence',
    `Statistics Canada table 14-10-0444-01 · latest quarter ${national.period_end} · national totals excluded`,
    'Q',
  );

  const coverage = [...national.coverage].sort((a, b) =>
    a.geography_label.localeCompare(b.geography_label),
  );
  labourCanada.getRange('A4:I4').values = [
    [
      'Geography ID',
      'Province / territory',
      'Reported cells',
      'Not published',
      'Total cells',
      'Coverage',
      'Expected reported',
      'Expected not published',
      'Reconciliation',
    ],
  ];
  header(labourCanada.getRange('A4:I4'));
  const coverageEnd = 4 + coverage.length;
  const latestRows = labourCanadaRows
    .filter((row) => row.period_end === national.period_end)
    .sort((a, b) =>
      `${a.geography_id}|${a.trade_node_id}|${a.noc_code}|${a.statistic}`.localeCompare(
        `${b.geography_id}|${b.trade_node_id}|${b.noc_code}|${b.statistic}`,
      ),
    );
  const warningRow = coverageEnd + 3;
  const headerRow = warningRow + 1;
  const observationStart = headerRow + 1;
  const observationEnd = observationStart + latestRows.length - 1;
  coverage.forEach((item, index) => {
    const row = 5 + index;
    labourCanada.getRange(`A${row}:B${row}`).values = [
      [item.geography_id, item.geography_label],
    ];
    labourCanada.getRange(`C${row}`).formulas = [
      [
        `=COUNTIFS($B$${observationStart}:$B$${observationEnd},$A${row},$I$${observationStart}:$I$${observationEnd},"<>")`,
      ],
    ];
    labourCanada.getRange(`D${row}`).formulas = [
      [
        `=COUNTIF($B$${observationStart}:$B$${observationEnd},$A${row})-C${row}`,
      ],
    ];
    labourCanada.getRange(`E${row}`).formulas = [[`=C${row}+D${row}`]];
    labourCanada.getRange(`F${row}`).formulas = [
      [`=IF(E${row}=0,0,C${row}/E${row})`],
    ];
    labourCanada.getRange(`G${row}:H${row}`).values = [
      [item.observed_cells, item.not_published_cells],
    ];
    labourCanada.getRange(`I${row}`).formulas = [
      [`=IF(AND(C${row}=G${row},D${row}=H${row}),"PASS","FAIL")`],
    ];
  });
  labourCanada.getRange(`F5:F${coverageEnd}`).format.numberFormat = '0.0%';
  labourCanada
    .getRange(`F5:F${coverageEnd}`)
    .conditionalFormats.add('colorScale', {
      colors: ['#F6D5C2', '#F4E7B2', '#B7DED3'],
      thresholds: ['min', '50%', 'max'],
    });
  labourCanada
    .getRange(`I5:I${coverageEnd}`)
    .conditionalFormats.add('containsText', {
      text: 'PASS',
      format: { fill: C.tealLight, font: { color: C.tealDark, bold: true } },
    });
  labourCanada
    .getRange(`I5:I${coverageEnd}`)
    .conditionalFormats.add('containsText', {
      text: 'FAIL',
      format: { fill: '#FDE8E5', font: { color: '#A33D32', bold: true } },
    });
  const coverageTable = labourCanada.tables.add(
    `A4:I${coverageEnd}`,
    true,
    'LabourCanadaCoverageTable',
  );
  coverageTable.style = 'TableStyleMedium2';

  labourCanada.getRange(`A${warningRow}:Q${warningRow}`).merge();
  labourCanada.getRange(`A${warningRow}`).values = [[national.warning]];
  noteBlock(labourCanada.getRange(`A${warningRow}:Q${warningRow}`));
  labourCanada.getRange(`A${warningRow}`).format.rowHeight = 42;
  labourCanada.getRange(`A${headerRow}:Q${headerRow}`).values = [
    [
      'Observation ID',
      'Geography ID',
      'Province / territory',
      'StatCan DGUID',
      'NOC',
      'Occupation',
      'Model trade node',
      'Statistic',
      'Value',
      'Unit',
      'Period end',
      'Evidence status',
      'Source ID',
      'Transformation ID',
      'Quality flags',
      'Source URL',
      'Missingness check',
    ],
  ];
  header(labourCanada.getRange(`A${headerRow}:Q${headerRow}`));
  labourCanada.getRange(`A${observationStart}:Q${observationEnd}`).values =
    latestRows.map((row) => [
      row.observation_id,
      row.geography_id,
      row.geography_label,
      row.statcan_dguid,
      row.noc_code,
      row.occupation_label,
      row.trade_node_id,
      row.statistic,
      row.value === '' ? null : Number(row.value),
      row.unit,
      new Date(`${row.period_end}T00:00:00Z`),
      row.evidence_status,
      row.source_id,
      row.transformation_id,
      row.quality_flags,
      'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410044401',
      row.value !== '' ||
      row.quality_flags.includes('value_missing_or_suppressed')
        ? 'PASS'
        : 'FAIL',
    ]);
  labourCanada.getRange(
    `I${observationStart}:I${observationEnd}`,
  ).format.numberFormat = '0.00';
  labourCanada.getRange(
    `K${observationStart}:K${observationEnd}`,
  ).format.numberFormat = 'yyyy-mm-dd';
  labourCanada
    .getRange(`Q${observationStart}:Q${observationEnd}`)
    .conditionalFormats.add('containsText', {
      text: 'PASS',
      format: { fill: C.tealLight, font: { color: C.tealDark, bold: true } },
    });
  labourCanada
    .getRange(`Q${observationStart}:Q${observationEnd}`)
    .conditionalFormats.add('containsText', {
      text: 'FAIL',
      format: { fill: '#FDE8E5', font: { color: '#A33D32', bold: true } },
    });
  const observationsTable = labourCanada.tables.add(
    `A${headerRow}:Q${observationEnd}`,
    true,
    'LabourCanadaLatestTable',
  );
  observationsTable.style = 'TableStyleMedium2';
  labourCanada.freezePanes.freezeRows(headerRow);
  labourCanada.freezePanes.freezeColumns(3);
  setWidths(
    labourCanada,
    {
      A: 28,
      B: 15,
      C: 28,
      D: 20,
      E: 10,
      F: 44,
      G: 24,
      H: 31,
      I: 13,
      J: 13,
      K: 14,
      L: 17,
      M: 28,
      N: 38,
      O: 40,
      P: 45,
      Q: 18,
    },
    28,
  );
}

function buildWorkforceCanada() {
  const national = release.baseline.labour_workforce_stock_canada;
  titleBand(
    workforceCanada,
    'Canada detailed-trade workforce stock',
    `2021 Census reference week ${national.period_start} to ${national.period_end} · six NOC unit groups · national totals excluded`,
    'S',
  );
  const coverage = [...national.coverage].sort((a, b) =>
    a.geography_label.localeCompare(b.geography_label),
  );
  workforceCanada.getRange('A4:J4').values = [
    [
      'Geography ID',
      'Province / territory',
      'Published cells',
      'Zero fillers',
      'Total cells',
      'Coverage',
      'Expected published',
      'Expected zero',
      'Expected total',
      'Reconciliation',
    ],
  ];
  header(workforceCanada.getRange('A4:J4'));
  const coverageEnd = 4 + coverage.length;
  const warningRow = coverageEnd + 3;
  const headerRow = warningRow + 1;
  const observationStart = headerRow + 1;
  const ordered = [...workforceCanadaRows].sort((a, b) =>
    `${a.geography_id}|${a.trade_node_id}|${a.noc_code}`.localeCompare(
      `${b.geography_id}|${b.trade_node_id}|${b.noc_code}`,
    ),
  );
  const observationEnd = observationStart + ordered.length - 1;
  coverage.forEach((item, index) => {
    const row = 5 + index;
    workforceCanada.getRange(`A${row}:B${row}`).values = [
      [item.geography_id, item.geography_label],
    ];
    workforceCanada.getRange(`C${row}`).formulas = [
      [`=COUNTIF($B$${observationStart}:$B$${observationEnd},$A${row})`],
    ];
    workforceCanada.getRange(`D${row}`).formulas = [
      [
        `=COUNTIFS($B$${observationStart}:$B$${observationEnd},$A${row},$R$${observationStart}:$R$${observationEnd},"YES")`,
      ],
    ];
    workforceCanada.getRange(`E${row}`).formulas = [[`=C${row}`]];
    workforceCanada.getRange(`F${row}`).formulas = [
      [`=IF(I${row}=0,0,C${row}/I${row})`],
    ];
    workforceCanada.getRange(`G${row}:I${row}`).values = [
      [item.published_cells, item.zero_filler_cells, item.total_cells],
    ];
    workforceCanada.getRange(`J${row}`).formulas = [
      [
        `=IF(AND(C${row}=G${row},D${row}=H${row},E${row}=I${row}),"PASS","FAIL")`,
      ],
    ];
  });
  workforceCanada.getRange(`F5:F${coverageEnd}`).format.numberFormat = '0.0%';
  workforceCanada
    .getRange(`J5:J${coverageEnd}`)
    .conditionalFormats.add('containsText', {
      text: 'PASS',
      format: { fill: C.tealLight, font: { color: C.tealDark, bold: true } },
    });
  workforceCanada
    .getRange(`J5:J${coverageEnd}`)
    .conditionalFormats.add('containsText', {
      text: 'FAIL',
      format: { fill: '#FDE8E5', font: { color: '#A33D32', bold: true } },
    });
  const coverageTable = workforceCanada.tables.add(
    `A4:J${coverageEnd}`,
    true,
    'WorkforceCanadaCoverageTable',
  );
  coverageTable.style = 'TableStyleMedium2';

  workforceCanada.getRange(`A${warningRow}:S${warningRow}`).merge();
  workforceCanada.getRange(`A${warningRow}`).values = [[national.warning]];
  noteBlock(workforceCanada.getRange(`A${warningRow}:S${warningRow}`));
  workforceCanada.getRange(`A${warningRow}`).format.rowHeight = 48;
  workforceCanada.getRange(`A${headerRow}:S${headerRow}`).values = [
    [
      'Observation ID',
      'Geography ID',
      'Province / territory',
      'StatCan DGUID',
      'NOC',
      'Occupation',
      'Model trade node',
      'Statistic',
      'Employed persons',
      'Unit',
      'Period start',
      'Period end',
      'Release date',
      'Evidence status',
      'Source ID',
      'Transformation ID',
      'Quality flags',
      'Zero filler',
      'Cell check',
    ],
  ];
  header(workforceCanada.getRange(`A${headerRow}:S${headerRow}`));
  workforceCanada.getRange(`A${observationStart}:R${observationEnd}`).values =
    ordered.map((row) => [
      row.observation_id,
      row.geography_id,
      row.geography_label,
      row.statcan_dguid,
      row.noc_code,
      row.occupation_label,
      row.trade_node_id,
      row.statistic,
      Number(row.value),
      row.unit,
      new Date(`${row.period_start}T00:00:00Z`),
      new Date(`${row.period_end}T00:00:00Z`),
      new Date(`${row.release_date}T00:00:00Z`),
      row.evidence_status,
      row.source_id,
      row.transformation_id,
      row.quality_flags,
      row.quality_flags.includes('census_zero_filler') ? 'YES' : 'NO',
    ]);
  workforceCanada.getRange(`S${observationStart}`).formulas = [
    [
      `=IF(OR(AND(I${observationStart}>0,R${observationStart}="NO"),AND(I${observationStart}=0,R${observationStart}="YES")),"PASS","FAIL")`,
    ],
  ];
  workforceCanada
    .getRange(`S${observationStart}:S${observationEnd}`)
    .fillDown();
  workforceCanada.getRange(
    `I${observationStart}:I${observationEnd}`,
  ).format.numberFormat = '#,##0';
  workforceCanada.getRange(
    `K${observationStart}:M${observationEnd}`,
  ).format.numberFormat = 'yyyy-mm-dd';
  workforceCanada
    .getRange(`S${observationStart}:S${observationEnd}`)
    .conditionalFormats.add('containsText', {
      text: 'PASS',
      format: { fill: C.tealLight, font: { color: C.tealDark, bold: true } },
    });
  workforceCanada
    .getRange(`S${observationStart}:S${observationEnd}`)
    .conditionalFormats.add('containsText', {
      text: 'FAIL',
      format: { fill: '#FDE8E5', font: { color: '#A33D32', bold: true } },
    });
  const observationsTable = workforceCanada.tables.add(
    `A${headerRow}:S${observationEnd}`,
    true,
    'WorkforceCanadaTable',
  );
  observationsTable.style = 'TableStyleMedium2';
  workforceCanada.freezePanes.freezeRows(headerRow);
  workforceCanada.freezePanes.freezeColumns(3);
  setWidths(
    workforceCanada,
    {
      A: 29,
      B: 15,
      C: 28,
      D: 20,
      E: 10,
      F: 46,
      G: 24,
      H: 15,
      I: 18,
      J: 12,
      K: 14,
      L: 14,
      M: 14,
      N: 17,
      O: 35,
      P: 41,
      Q: 45,
      R: 13,
      S: 15,
    },
    28,
  );
}

function buildLabourDiagnostic() {
  titleBand(
    labourDiagnostic,
    'Cross-vintage labour recruitment screen',
    `Current JVWS vacancies (${labourPressure.vacancy_period_end}) per 1,000 employed persons in the 2021 Census · inferred screening metric`,
    'N',
  );
  const albertaRows = labourPressure.trade_diagnostics
    .filter((item) => item.geography_id === 'PR_48')
    .sort((a, b) => {
      const aValue = a.vacancies_per_1_000_2021_employed;
      const bValue = b.vacancies_per_1_000_2021_employed;
      if (aValue === null && bValue !== null) return 1;
      if (aValue !== null && bValue === null) return -1;
      return (bValue ?? -1) - (aValue ?? -1);
    });
  labourDiagnostic.getRange('A4:G4').values = [
    [
      'Alberta model trade',
      'Current vacancies',
      '2021 employed stock',
      'Per 1,000',
      'Complete cells',
      'Availability',
      'Evidence status',
    ],
  ];
  header(labourDiagnostic.getRange('A4:G4'));
  labourDiagnostic.getRange(`A5:G${4 + albertaRows.length}`).values =
    albertaRows.map((item) => [
      tradeLabel(item.trade_node_id),
      item.vacancies,
      item.workforce_stock,
      item.vacancies_per_1_000_2021_employed,
      `${item.complete_cells} of ${item.component_cells}`,
      labelize(item.availability),
      item.evidence_status,
    ]);
  labourDiagnostic.getRange(
    `B5:C${4 + albertaRows.length}`,
  ).format.numberFormat = '#,##0';
  labourDiagnostic.getRange(
    `D5:D${4 + albertaRows.length}`,
  ).format.numberFormat = '0.00';
  const albertaTable = labourDiagnostic.tables.add(
    `A4:G${4 + albertaRows.length}`,
    true,
    'AlbertaLabourDiagnosticTable',
  );
  albertaTable.style = 'TableStyleMedium2';

  const warningRow = 4 + albertaRows.length + 2;
  labourDiagnostic.getRange(`A${warningRow}:N${warningRow}`).merge();
  labourDiagnostic.getRange(`A${warningRow}`).values = [
    [
      `${labourPressure.interpretation} ${labourPressure.limitations.join(' ')}`,
    ],
  ];
  labourDiagnostic.getRange(`A${warningRow}:N${warningRow}`).format = {
    fill: C.amberLight,
    font: { color: '#7B4529' },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };
  labourDiagnostic.getRange(`A${warningRow}`).format.rowHeight = 70;

  const headerRow = warningRow + 2;
  const observationStart = headerRow + 1;
  const ordered = [...labourPressure.occupation_diagnostics].sort((a, b) =>
    `${a.geography_id}|${a.trade_node_id}|${a.noc_code}`.localeCompare(
      `${b.geography_id}|${b.trade_node_id}|${b.noc_code}`,
    ),
  );
  const observationEnd = observationStart + ordered.length - 1;
  labourDiagnostic.getRange(`A${headerRow}:N${headerRow}`).values = [
    [
      'Geography ID',
      'Province / territory',
      'NOC',
      'Occupation',
      'Model trade node',
      'Current vacancies',
      'Vacancy period end',
      '2021 employed stock',
      'Workforce period end',
      'Workbook per 1,000',
      'Published per 1,000',
      'Availability',
      'Evidence status',
      'Formula check',
    ],
  ];
  header(labourDiagnostic.getRange(`A${headerRow}:N${headerRow}`));
  labourDiagnostic.getRange(`A${observationStart}:I${observationEnd}`).values =
    ordered.map((item) => [
      item.geography_id,
      item.geography_label,
      item.noc_code,
      item.occupation_label,
      item.trade_node_id,
      item.vacancies,
      new Date(`${item.vacancy_period_end}T00:00:00Z`),
      item.workforce_stock,
      new Date(`${item.workforce_period_end}T00:00:00Z`),
    ]);
  labourDiagnostic.getRange(`K${observationStart}:M${observationEnd}`).values =
    ordered.map((item) => [
      item.vacancies_per_1_000_2021_employed,
      labelize(item.availability),
      item.evidence_status,
    ]);
  labourDiagnostic.getRange(`J${observationStart}`).formulas = [
    [
      `=IF(OR(F${observationStart}="",H${observationStart}<=0),"",ROUND(F${observationStart}/H${observationStart}*1000,2))`,
    ],
  ];
  labourDiagnostic
    .getRange(`J${observationStart}:J${observationEnd}`)
    .fillDown();
  labourDiagnostic.getRange(`N${observationStart}`).formulas = [
    [
      `=IF(K${observationStart}="",IF(J${observationStart}="","PASS","FAIL"),IF(ABS(J${observationStart}-K${observationStart})<0.01,"PASS","FAIL"))`,
    ],
  ];
  labourDiagnostic
    .getRange(`N${observationStart}:N${observationEnd}`)
    .fillDown();
  labourDiagnostic.getRange(
    `F${observationStart}:F${observationEnd}`,
  ).format.numberFormat = '#,##0';
  labourDiagnostic.getRange(
    `H${observationStart}:H${observationEnd}`,
  ).format.numberFormat = '#,##0';
  labourDiagnostic.getRange(
    `G${observationStart}:G${observationEnd}`,
  ).format.numberFormat = 'yyyy-mm-dd';
  labourDiagnostic.getRange(
    `I${observationStart}:I${observationEnd}`,
  ).format.numberFormat = 'yyyy-mm-dd';
  labourDiagnostic.getRange(
    `J${observationStart}:K${observationEnd}`,
  ).format.numberFormat = '0.00';
  labourDiagnostic
    .getRange(`N${observationStart}:N${observationEnd}`)
    .conditionalFormats.add('containsText', {
      text: 'PASS',
      format: { fill: C.tealLight, font: { color: C.tealDark, bold: true } },
    });
  labourDiagnostic
    .getRange(`N${observationStart}:N${observationEnd}`)
    .conditionalFormats.add('containsText', {
      text: 'FAIL',
      format: { fill: '#FDE8E5', font: { color: '#A33D32', bold: true } },
    });
  const observationsTable = labourDiagnostic.tables.add(
    `A${headerRow}:N${observationEnd}`,
    true,
    'LabourDiagnosticTable',
  );
  observationsTable.style = 'TableStyleMedium2';
  labourDiagnostic.freezePanes.freezeRows(headerRow);
  labourDiagnostic.freezePanes.freezeColumns(2);
  setWidths(
    labourDiagnostic,
    {
      A: 15,
      B: 28,
      C: 10,
      D: 47,
      E: 24,
      F: 18,
      G: 17,
      H: 18,
      I: 18,
      J: 18,
      K: 18,
      L: 25,
      M: 17,
      N: 15,
    },
    28,
  );
}

function buildMaterialScreen() {
  titleBand(
    materialScreen,
    'Alberta material-cost component screen',
    `Selected Calgary and Edmonton BCPI proxies · period ending ${release.material_cost_screen.period_end} · not AI-attributed effects`,
    'R',
  );
  const headers = [
    'Geography ID',
    'Building archetype',
    'Component',
    'Indicator ID',
    'Period end',
    'Index value',
    'Unit',
    'Points from 2023 base',
    'Prior-quarter end',
    'Prior-quarter index',
    'QoQ change',
    'Year-ago end',
    'Year-ago index',
    'YoY change',
    'Source ID',
    'Source status',
    'Change status',
    'Source URL',
  ];
  materialScreen.getRange('A4:R4').values = [headers];
  header(materialScreen.getRange('A4:R4'));
  const ordered = [...materialRows].sort((a, b) =>
    `${a.geography_id}|${a.archetype}|${a.component}`.localeCompare(
      `${b.geography_id}|${b.archetype}|${b.component}`,
    ),
  );
  const endRow = 4 + ordered.length;
  materialScreen.getRange(`A5:R${endRow}`).values = ordered.map((row) => [
    row.geography_id,
    labelize(row.archetype),
    labelize(row.component),
    row.indicator_id,
    new Date(`${row.period_end}T00:00:00Z`),
    Number(row.index_value),
    row.unit,
    Number(row.index_points_since_2023_base),
    new Date(`${row.previous_quarter_period_end}T00:00:00Z`),
    Number(row.previous_quarter_index),
    row.quarter_over_quarter_percent_change === ''
      ? null
      : Number(row.quarter_over_quarter_percent_change) / 100,
    new Date(`${row.year_ago_period_end}T00:00:00Z`),
    row.year_ago_index === '' ? null : Number(row.year_ago_index),
    row.year_over_year_percent_change === ''
      ? null
      : Number(row.year_over_year_percent_change) / 100,
    row.source_id,
    row.source_evidence_status,
    row.change_evidence_status,
    'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810028901',
  ]);
  materialScreen.getRange(`E5:E${endRow}`).format.numberFormat = 'yyyy-mm-dd';
  materialScreen.getRange(`F5:F${endRow}`).format.numberFormat = '0.0';
  materialScreen.getRange(`H5:H${endRow}`).format.numberFormat = '0.0';
  materialScreen.getRange(`I5:I${endRow}`).format.numberFormat = 'yyyy-mm-dd';
  materialScreen.getRange(`J5:J${endRow}`).format.numberFormat = '0.0';
  materialScreen.getRange(`K5:K${endRow}`).format.numberFormat = '0.0%';
  materialScreen.getRange(`L5:L${endRow}`).format.numberFormat = 'yyyy-mm-dd';
  materialScreen.getRange(`M5:M${endRow}`).format.numberFormat = '0.0';
  materialScreen.getRange(`N5:N${endRow}`).format.numberFormat = '0.0%';
  materialScreen
    .getRange(`N5:N${endRow}`)
    .conditionalFormats.add('colorScale', {
      colors: ['#B7DED3', '#F4E7B2', '#F6D5C2'],
      thresholds: ['min', '50%', 'max'],
    });
  const table = materialScreen.tables.add(
    `A4:R${endRow}`,
    true,
    'MaterialScreenTable',
  );
  table.style = 'TableStyleMedium2';
  materialScreen.freezePanes.freezeRows(4);
  materialScreen.freezePanes.freezeColumns(3);
  setWidths(
    materialScreen,
    {
      A: 15,
      B: 31,
      C: 27,
      D: 54,
      E: 14,
      F: 13,
      G: 18,
      H: 18,
      I: 16,
      J: 17,
      K: 14,
      L: 14,
      M: 15,
      N: 14,
      O: 28,
      P: 16,
      Q: 16,
      R: 45,
    },
    endRow,
  );
}

function buildProjectExposure() {
  titleBand(
    projectExposure,
    'Alberta public-delivery asset exposure',
    `Controlled classification + schedule-overlap screen · ${release.public_project_exposure.window.start_year}–${release.public_project_exposure.window.end_year} · not a delay finding`,
    'Y',
  );
  projectExposure.getRange('A4:J4').values = [
    [
      'Asset class',
      'Records',
      'Overlap',
      'Cost records',
      'Reported cost (CAD)',
      'Costed + dated overlap',
      'Cost allocated to window (CAD)',
      'Public sponsor signals',
      'Utility signals',
      'Unresolved sponsor signals',
    ],
  ];
  header(projectExposure.getRange('A4:J4'));
  const summaries = release.public_project_exposure.asset_class_summaries;
  const summaryEnd = 4 + summaries.length;
  projectExposure.getRange(`A5:J${summaryEnd}`).values = summaries.map(
    (item) => [
      labelize(item.asset_class),
      item.project_count,
      item.overlap_project_count,
      item.reported_cost_project_count,
      item.reported_cost_cad,
      item.overlap_with_cost_and_complete_schedule_count,
      item.indicative_cost_allocated_to_window_cad,
      item.government_or_public_institution_signal_count,
      item.municipal_or_public_utility_signal_count,
      item.unresolved_sponsor_signal_count,
    ],
  );
  projectExposure.getRange(`B5:D${summaryEnd}`).format.numberFormat = '#,##0';
  projectExposure.getRange(`E5:E${summaryEnd}`).format.numberFormat = '$#,##0';
  projectExposure.getRange(`F5:F${summaryEnd}`).format.numberFormat = '#,##0';
  projectExposure.getRange(`G5:G${summaryEnd}`).format.numberFormat = '$#,##0';
  projectExposure.getRange(`H5:J${summaryEnd}`).format.numberFormat = '#,##0';
  const summaryTable = projectExposure.tables.add(
    `A4:J${summaryEnd}`,
    true,
    'ProjectExposureSummaryTable',
  );
  summaryTable.style = 'TableStyleMedium2';

  projectExposure.getRange('A12:Y12').merge();
  projectExposure.getRange('A12').values = [
    [
      'Asset class, sponsor signal and uniform cost allocation are disclosed inferences. Incomplete schedules remain indeterminate. Reported-cost totals are not probability-weighted budgets or expenditure forecasts.',
    ],
  ];
  noteBlock(projectExposure.getRange('A12:Y12'));
  projectExposure.getRange('A12').format.rowHeight = 34;

  const headers = [
    'Project ID',
    'Name',
    'Asset class',
    'Asset class status',
    'Project type',
    'Sector',
    'Developer',
    'Sponsor signal',
    'Sponsor status',
    'Municipality',
    'Stage',
    'Reported cost (CAD)',
    'Start year',
    'End year',
    'Overlap status',
    'Overlap years',
    'Annualized cost if complete (CAD)',
    'Cost allocated to window (CAD)',
    'Longitude',
    'Latitude',
    'Location precision',
    'Source ID',
    'Source status',
    'As-of date',
    'Source URL',
  ];
  projectExposure.getRange('A14:Y14').values = [headers];
  header(projectExposure.getRange('A14:Y14'));
  const endRow = 14 + projectExposureRows.length;
  projectExposure.getRange(`A15:Y${endRow}`).values = projectExposureRows.map(
    (row) => [
      row.project_id,
      row.name,
      labelize(row.asset_class),
      row.asset_class_evidence_status,
      row.project_type,
      row.sector,
      row.developer,
      labelize(row.sponsor_signal),
      row.sponsor_signal_evidence_status,
      row.municipality,
      row.stage,
      numberOrNull(row.estimated_cost_cad),
      numberOrNull(row.start_year),
      numberOrNull(row.end_year),
      row.schedule_overlap_status,
      row.overlap_years,
      numberOrNull(row.annualized_cost_cad_if_complete),
      numberOrNull(row.indicative_cost_allocated_to_window_cad),
      numberOrNull(row.longitude),
      numberOrNull(row.latitude),
      row.location_precision,
      row.source_id,
      row.source_evidence_status,
      new Date(`${row.as_of_date}T00:00:00Z`),
      'https://www.majorprojects.alberta.ca/',
    ],
  );
  projectExposure.getRange(`L15:L${endRow}`).format.numberFormat = '$#,##0';
  projectExposure.getRange(`M15:N${endRow}`).format.numberFormat = '0';
  projectExposure.getRange(`Q15:R${endRow}`).format.numberFormat = '$#,##0';
  projectExposure.getRange(`S15:T${endRow}`).format.numberFormat = '0.0000';
  projectExposure.getRange(`X15:X${endRow}`).format.numberFormat = 'yyyy-mm-dd';
  const table = projectExposure.tables.add(
    `A14:Y${endRow}`,
    true,
    'ProjectExposureTable',
  );
  table.style = 'TableStyleMedium2';
  projectExposure.freezePanes.freezeRows(14);
  projectExposure.freezePanes.freezeColumns(3);
  setWidths(
    projectExposure,
    {
      A: 15,
      B: 44,
      C: 31,
      D: 17,
      E: 27,
      F: 18,
      G: 38,
      H: 36,
      I: 17,
      J: 24,
      K: 19,
      L: 20,
      M: 12,
      N: 12,
      O: 32,
      P: 19,
      Q: 27,
      R: 27,
      S: 13,
      T: 13,
      U: 18,
      V: 28,
      W: 15,
      X: 14,
      Y: 39,
    },
    endRow,
  );
}

function buildPowerEvidence() {
  titleBand(
    powerEvidence,
    'Observed AESO data-centre power boundary',
    'Requested load, Phase 1 allocation and executed contracts · separate from the AIIO MW scenario',
    'H',
  );
  powerEvidence.getRange('A5:A10').values = [
    ['Latest requested load (MW)'],
    ['Phase 1 interim limit (MW)'],
    ['Phase 1 allocated contracts (MW)'],
    ['Executed contract sum (MW)'],
    ['$50B additional transmission (MW)'],
    ['Phase 1 reconciliation'],
  ];
  powerEvidence.getRange('A5:A10').format.font = { bold: true, color: C.ink };
  powerEvidence.getRange('B5').formulas = [['=C19']];
  powerEvidence.getRange('B6').formulas = [['=C20']];
  powerEvidence.getRange('B7').formulas = [['=C21']];
  powerEvidence.getRange('B8').formulas = [['=SUM(C22:C23)']];
  powerEvidence.getRange('B9').values = [['UNKNOWN']];
  powerEvidence.getRange('B10').formulas = [
    ['=IF(AND(B6=B7,B7=B8),"PASS","FAIL")'],
  ];
  powerEvidence.getRange('B5:B10').format = {
    fill: C.soft,
    borders: { preset: 'outside', style: 'thin', color: C.line },
  };
  powerEvidence.getRange('B5:B8').format.numberFormat = '#,##0.0';
  powerEvidence.getRange('B10').conditionalFormats.add('containsText', {
    text: 'PASS',
    format: { fill: C.tealLight, font: { color: C.tealDark, bold: true } },
  });
  powerEvidence.getRange('B10').conditionalFormats.add('containsText', {
    text: 'FAIL',
    format: { fill: '#FDE8E5', font: { color: '#A33D32', bold: true } },
  });

  powerEvidence.getRange('D5:H10').merge();
  powerEvidence.getRange('D5').values = [
    [
      `${release.power_evidence.requested_load.warning} Requested load, allocated limits, executed contracts, connected load and forecasts are different quantities. AESO's no-reinforcement statement applies only to its scoped 1,200 MW interim approach through 2028 on the existing transmission system. Additional transmission for the separate $50B counterfactual remains unknown pending locations, connection studies and a system needs assessment.`,
    ],
  ];
  powerEvidence.getRange('D5:H10').format = {
    fill: C.amberLight,
    font: { color: '#7B4529' },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };

  powerEvidence.getRange('A13:H13').values = [
    [
      'Metric ID',
      'Period',
      'Value',
      'Unit',
      'Evidence status',
      'Source ID',
      'Source locator',
      'Source URL',
    ],
  ];
  header(powerEvidence.getRange('A13:H13'));
  const endRow = 13 + powerEvidenceRows.length;
  powerEvidence.getRange(`A14:H${endRow}`).values = powerEvidenceRows.map(
    (row) => [
      row.metric_id,
      row.period,
      Number(row.value),
      row.unit,
      row.evidence_status,
      row.source_id,
      row.source_locator,
      powerSourceUrl(row.source_id),
    ],
  );
  powerEvidence.getRange(`C14:C${endRow}`).format.numberFormat = '#,##0.000';
  const table = powerEvidence.tables.add(
    `A13:H${endRow}`,
    true,
    'PowerEvidenceTable',
  );
  table.style = 'TableStyleMedium2';
  powerEvidence.freezePanes.freezeRows(13);
  powerEvidence.freezePanes.freezeColumns(2);
  setWidths(
    powerEvidence,
    { A: 47, B: 17, C: 16, D: 13, E: 17, F: 47, G: 53, H: 54 },
    28,
  );
}

function buildCostBaseline() {
  titleBand(
    costBaselineSheet,
    'Validated market-reference cost baseline',
    `Internal model artifact · as of ${costBaseline.as_of_date} · public projections withheld`,
    'P',
  );

  costBaselineSheet.getRange('A5:B8').values = [
    ['Baseline model ID', costBaseline.model_id],
    [
      'Public projection authorized',
      costBaseline.publication_authorization.public_projection_authorized
        ? 'YES'
        : 'NO',
    ],
    [
      'Horizon checks passed',
      costBaseline.publication_summary.horizon_status_counts.gate_passed,
    ],
    [
      'Total horizon checks',
      costBaseline.publication_summary.horizon_result_count,
    ],
  ];
  costBaselineSheet.getRange('A5:A8').format.font = {
    bold: true,
    color: C.ink,
  };
  costBaselineSheet.getRange('B5:B8').format = {
    fill: C.soft,
    borders: { preset: 'outside', style: 'thin', color: C.line },
  };
  costBaselineSheet.getRange('B6').format = {
    fill: C.amberLight,
    font: { bold: true, color: '#8A4826' },
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };
  costBaselineSheet.getRange('D5:P8').merge();
  costBaselineSheet.getRange('D5').values = [
    [
      'FAIL-CLOSED RESULT. Only one of 40 reference-class horizon checks passes. All Calgary and Edmonton four- and five-year health and school projections are null. The one passing horizon is not publishable until the independent modelling review gate authorizes it. These are shared-market BCPI reference classes, not AI effects and not realized project-cost forecasts.',
    ],
  ];
  costBaselineSheet.getRange('D5:P8').format = {
    fill: C.amberLight,
    font: { color: '#7B4529' },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };

  const baselineRows = costBaseline.reference_class_results.flatMap(
    (reference) =>
      reference.horizons.map((horizon) => [
        reference.asset_class,
        reference.asset_class_label,
        reference.geography_id,
        reference.geography_label,
        horizon.horizon_years,
        horizon.status,
        horizon.selected_method,
        horizon.validation_period?.selected_method_metrics
          ?.mean_absolute_percentage_error ?? null,
        horizon.validation_period?.selected_method_metrics
          ?.mean_percentage_error ?? null,
        horizon.validation_period?.empirical_interval_coverage_percent ?? null,
        horizon.projected_cumulative_change_percent,
        horizon.projected_index,
        horizon.reason,
        reference.latest_index,
        reference.reference_indicator_id,
        reference.mapping_status,
      ]),
  );
  costBaselineSheet.getRange('A10:P10').values = [
    [
      'Asset class',
      'Asset label',
      'Geography ID',
      'Geography',
      'Horizon (years)',
      'Gate status',
      'Selected method',
      'Validation MAPE (%)',
      'Validation bias (%)',
      'Interval coverage (%)',
      'Projected change (%)',
      'Projected index',
      'Failure reason',
      'Latest observed index',
      'Reference indicator ID',
      'Mapping status',
    ],
  ];
  header(costBaselineSheet.getRange('A10:P10'));
  const baselineEndRow = 10 + baselineRows.length;
  costBaselineSheet.getRange(`A11:P${baselineEndRow}`).values = baselineRows;
  costBaselineSheet.getRange(`E11:E${baselineEndRow}`).format.numberFormat =
    '0';
  costBaselineSheet.getRange(`H11:L${baselineEndRow}`).format.numberFormat =
    '0.000';
  costBaselineSheet.getRange(`N11:N${baselineEndRow}`).format.numberFormat =
    '0.0';
  costBaselineSheet
    .getRange(`F11:F${baselineEndRow}`)
    .conditionalFormats.add('containsText', {
      text: 'gate_passed',
      format: { fill: C.tealLight, font: { color: C.tealDark, bold: true } },
    });
  costBaselineSheet
    .getRange(`F11:F${baselineEndRow}`)
    .conditionalFormats.add('containsText', {
      text: 'gate_failed',
      format: { fill: '#FDE8E5', font: { color: '#A33D32', bold: true } },
    });
  const baselineTable = costBaselineSheet.tables.add(
    `A10:P${baselineEndRow}`,
    true,
    'CostBaselineGateTable',
  );
  baselineTable.style = 'TableStyleMedium2';
  costBaselineSheet
    .getRange(`A${baselineEndRow + 2}:P${baselineEndRow + 4}`)
    .merge();
  costBaselineSheet.getRange(`A${baselineEndRow + 2}`).values = [
    [costBaseline.publication_authorization.reason],
  ];
  noteBlock(
    costBaselineSheet.getRange(`A${baselineEndRow + 2}:P${baselineEndRow + 4}`),
  );
  costBaselineSheet.freezePanes.freezeRows(10);
  costBaselineSheet.freezePanes.freezeColumns(4);
  setWidths(
    costBaselineSheet,
    {
      A: 22,
      B: 22,
      C: 15,
      D: 18,
      E: 14,
      F: 16,
      G: 24,
      H: 18,
      I: 18,
      J: 19,
      K: 19,
      L: 17,
      M: 34,
      N: 19,
      O: 46,
      P: 16,
    },
    baselineEndRow + 4,
  );
}

function buildProjectCostCheck() {
  titleBand(
    projectCost,
    'Project cost decision check',
    'Editable blue cells · schedule-weighted market reference · AI increment remains separate',
    'L',
  );
  projectCost.getRange('A5:B9').values = [
    ['Project name', 'Demonstration Calgary health project'],
    ['Asset class', 'health_facilities'],
    ['Geography ID', 'CMA_825'],
    ['Current estimate (CAD)', 100000000],
    ['Estimate price basis', costBaseline.as_of_date],
  ];
  projectCost.getRange('A5:A9').format.font = { bold: true, color: C.ink };
  inputStyle(projectCost.getRange('B5:B9'));
  projectCost.getRange('B8').format.numberFormat = '$#,##0';
  projectCost.dataValidations.add({
    range: 'B8',
    rule: { type: 'decimal', operator: 'greaterThan', formula1: 0 },
  });

  projectCost.getRange('D5:L9').merge();
  projectCost.getRange('D5').values = [
    [
      'DEMONSTRATION INPUT, NOT AN OBSERVED PROJECT. Enter a project estimate only when its price basis is known. Version 0.1 requires that basis to equal the latest observed baseline quarter. Each expenditure year is evaluated separately; the full estimate is never escalated by only the end-year index.',
    ],
  ];
  noteBlock(projectCost.getRange('D5:L9'));

  projectCost.getRange('A12:C12').values = [
    ['Horizon year', 'Illustrative calendar year', 'Expenditure share'],
  ];
  header(projectCost.getRange('A12:C12'));
  projectCost.getRange('A13:C18').values = [
    [0, 2026, 0],
    [1, 2027, 0.2],
    [2, 2028, 0.2],
    [3, 2029, 0.2],
    [4, 2030, 0.2],
    [5, 2031, 0.2],
  ];
  inputStyle(projectCost.getRange('C13:C18'));
  projectCost.getRange('C13:C18').format.numberFormat = '0.0%';
  projectCost.dataValidations.add({
    range: 'C13:C18',
    rule: { type: 'decimal', operator: 'between', formula1: 0, formula2: 1 },
  });

  projectCost.getRange('E12:L12').values = [
    [
      'Horizon',
      'Share',
      'Gate status',
      'Reference index',
      'Index factor',
      'Weighted factor',
      'Failure boundary',
      'Evidence status',
    ],
  ];
  header(projectCost.getRange('E12:L12'));
  for (let index = 0; index < 6; index += 1) {
    const row = 13 + index;
    projectCost.getRange(`E${row}`).formulas = [[`=A${row}`]];
    projectCost.getRange(`F${row}`).formulas = [[`=C${row}`]];
    projectCost.getRange(`G${row}`).formulas = [
      [
        index === 0
          ? `=IF(F${row}=0,"NOT USED","observed_origin")`
          : `=IF(F${row}=0,"NOT USED",IF(COUNTIFS('Cost Baseline'!$A$11:$A$50,$B$6,'Cost Baseline'!$C$11:$C$50,$B$7,'Cost Baseline'!$E$11:$E$50,E${row},'Cost Baseline'!$F$11:$F$50,"gate_passed")=1,"gate_passed","WITHHELD"))`,
      ],
    ];
    projectCost.getRange(`H${row}`).formulas = [
      [
        index === 0
          ? `=IF(G${row}="observed_origin",SUMIFS('Cost Baseline'!$N$11:$N$50,'Cost Baseline'!$A$11:$A$50,$B$6,'Cost Baseline'!$C$11:$C$50,$B$7),"")`
          : `=IF(G${row}="gate_passed",SUMIFS('Cost Baseline'!$L$11:$L$50,'Cost Baseline'!$A$11:$A$50,$B$6,'Cost Baseline'!$C$11:$C$50,$B$7,'Cost Baseline'!$E$11:$E$50,E${row}),"")`,
      ],
    ];
    projectCost.getRange(`I${row}`).formulas = [
      [
        `=IF(H${row}="","",H${row}/SUMIFS('Cost Baseline'!$N$11:$N$50,'Cost Baseline'!$A$11:$A$50,$B$6,'Cost Baseline'!$C$11:$C$50,$B$7))`,
      ],
    ];
    projectCost.getRange(`J${row}`).formulas = [
      [`=IF(I${row}="","",F${row}*I${row})`],
    ];
    projectCost.getRange(`K${row}`).formulas = [
      [
        `=IF(G${row}="WITHHELD","Required horizon gate failed or is unavailable","")`,
      ],
    ];
    projectCost.getRange(`L${row}`).formulas = [
      [
        `=IF(F${row}=0,"not_used",IF(G${row}="WITHHELD","withheld","reference_baseline"))`,
      ],
    ];
  }
  projectCost.getRange('F13:F18').format.numberFormat = '0.0%';
  projectCost.getRange('H13:J18').format.numberFormat = '0.0000';
  projectCost.getRange('G13:G18').conditionalFormats.add('containsText', {
    text: 'WITHHELD',
    format: { fill: '#FDE8E5', font: { color: '#A33D32', bold: true } },
  });

  projectCost.getRange('A21:B21').values = [
    ['Project calculation gate', 'Result'],
  ];
  header(projectCost.getRange('A21:B21'));
  projectCost.getRange('A22:A30').values = [
    ['Expenditure shares'],
    ['Active expenditure horizons'],
    ['Required horizon gates'],
    ['Independent modelling review'],
    ['Project result status'],
    ['Schedule-weighted factor'],
    ['Reference change'],
    ['Reference estimate'],
    ['Reference escalation'],
  ];
  projectCost.getRange('A22:A30').format.font = { bold: true, color: C.ink };
  projectCost.getRange('B22').formulas = [
    ['=IF(ABS(SUM(C13:C18)-1)<0.000001,"PASS","FAIL")'],
  ];
  projectCost.getRange('B23').formulas = [['=COUNTIF(C13:C18,">0")']];
  projectCost.getRange('B24').formulas = [
    ['=IF(COUNTIF(G13:G18,"WITHHELD")=0,"PASS","WITHHELD")'],
  ];
  projectCost.getRange('B25').values = [
    [
      costBaseline.publication_authorization.public_projection_authorized
        ? 'AUTHORIZED'
        : 'WITHHELD',
    ],
  ];
  projectCost.getRange('B26').formulas = [
    [
      '=IF(B22<>"PASS","NOT ASSESSED — PROFILE INVALID",IF(B24<>"PASS","WITHHELD — REQUIRED HORIZON GATE FAILED",IF(B25<>"AUTHORIZED","WITHHELD — INDEPENDENT REVIEW","BASELINE ONLY")))',
    ],
  ];
  projectCost.getRange('B27').formulas = [
    ['=IF(B26="BASELINE ONLY",SUM(J13:J18),"")'],
  ];
  projectCost.getRange('B28').formulas = [
    ['=IF(B26="BASELINE ONLY",B27-1,"")'],
  ];
  projectCost.getRange('B29').formulas = [
    ['=IF(B26="BASELINE ONLY",B8*B27,"")'],
  ];
  projectCost.getRange('B30').formulas = [
    ['=IF(B26="BASELINE ONLY",B29-B8,"")'],
  ];
  projectCost.getRange('B27').format.numberFormat = '0.0000';
  projectCost.getRange('B28').format.numberFormat = '0.0%';
  projectCost.getRange('B29:B30').format.numberFormat = '$#,##0';
  projectCost.getRange('B22:B26').conditionalFormats.add('containsText', {
    text: 'WITHHELD',
    format: { fill: '#FDE8E5', font: { color: '#A33D32', bold: true } },
  });
  projectCost.getRange('B22:B26').conditionalFormats.add('containsText', {
    text: 'PASS',
    format: { fill: C.tealLight, font: { color: C.tealDark, bold: true } },
  });

  projectCost.getRange('D21:L26').merge();
  projectCost.getRange('D21').values = [
    [
      'EXPECTED DEFAULT RESULT: WITHHELD. The five-year Calgary health example requires horizons 1 through 5. Those horizons do not pass the predeclared validation gates, so the schedule-weighted project estimate remains blank. This protects decision makers from a precise-looking but unsupported escalation number.',
    ],
  ];
  projectCost.getRange('D21:L26').format = {
    fill: C.amberLight,
    font: { color: '#7B4529' },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };
  projectCost.getRange('D28:L34').merge();
  projectCost.getRange('D28').values = [
    [
      'AI-ATTRIBUTABLE INCREMENT: NOT CALIBRATED. Cost escalation %, escalation CAD and schedule delay remain blank. Graph pressure scores may explain mechanisms and bottlenecks, but they do not enter the market-reference calculation and cannot be converted into dollars or days without a separately validated attribution model.',
    ],
  ];
  noteBlock(projectCost.getRange('D28:L34'));
  projectCost.getRange('A33:B36').values = [
    ['AI-attributable cost escalation', null],
    ['AI-attributable escalation (CAD)', null],
    ['AI-attributable schedule delay', null],
    ['AI increment status', 'NOT CALIBRATED'],
  ];
  projectCost.getRange('A33:A36').format.font = { bold: true, color: C.ink };
  projectCost.getRange('B33').format.numberFormat = '0.0%';
  projectCost.getRange('B34').format.numberFormat = '$#,##0';
  projectCost.getRange('B35').format.numberFormat = '0 "days"';
  projectCost.getRange('B36').format = {
    fill: C.amberLight,
    font: { bold: true, color: '#8A4826' },
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };
  projectCost.freezePanes.freezeRows(4);
  setWidths(
    projectCost,
    {
      A: 26,
      B: 30,
      C: 19,
      D: 4,
      E: 12,
      F: 12,
      G: 20,
      H: 18,
      I: 15,
      J: 18,
      K: 34,
      L: 20,
    },
    38,
  );
}

function buildCanadaExpansion() {
  titleBand(
    canadaExpansion,
    'Canada expansion evidence gate',
    `Current research intake · excluded from public release basis ${release.manifest.version}`,
    'J',
  );

  canadaExpansion.getRange('A5:B5').values = [['Control', 'Value']];
  header(canadaExpansion.getRange('A5:B5'));
  canadaExpansion.getRange('A6:B20').values = [
    ['Public release basis', release.manifest.version],
    ['Project intake ID', provincialProjects.transformation_id],
    [
      'Project exposure authorized',
      provincialProjects.publication_boundary.public_project_exposure_authorized
        ? 'YES'
        : 'NO',
    ],
    ['Normalized project records', provincialProjects.record_count],
    ['Provincial BCPI model ID', provincialCostBaseline.model_id],
    [
      'Provincial BCPI horizon results',
      provincialCostBaseline.publication_summary.horizon_result_count,
    ],
    [
      'Provincial projections authorized',
      provincialCostBaseline.publication_authorization
        .public_projection_authorized
        ? 'YES'
        : 'NO',
    ],
    ['Power-planning contract ID', provincialPowerPlanning.model_id],
    ['Power-planning metrics', provincialPowerPlanning.metric_count],
    [
      'Named transmission actions',
      provincialPowerPlanning.transmission_action_count,
    ],
    [
      'Power profile authorized',
      provincialPowerPlanning.publication_boundary
        .provincial_power_profile_authorized
        ? 'YES'
        : 'NO',
    ],
    ['Digest ID', digestManifest.digest_id],
    ['Digest edition (UTC)', new Date(`${digestManifest.edition_date}T00:00:00Z`)],
    ['Digest items', digestManifest.item_count],
    ['Automatic model change', digestManifest.automatic_model_change ? 'YES' : 'NO'],
  ];
  canadaExpansion.getRange('A6:A20').format.font = {
    bold: true,
    color: C.ink,
  };
  canadaExpansion.getRange('B6:B20').format = {
    fill: C.white,
    font: { color: C.ink },
    borders: { preset: 'inside', style: 'thin', color: C.line },
  };
  canadaExpansion.getRange('B18').format.numberFormat = 'yyyy-mm-dd';
  for (const cell of ['B8', 'B12', 'B16', 'B20']) {
    canadaExpansion.getRange(cell).format = {
      fill: C.amberLight,
      font: { bold: true, color: '#8A4826' },
      borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
    };
  }

  canadaExpansion.getRange('D5:J5').merge();
  canadaExpansion.getRange('D5').values = [['Interpretation boundary']];
  sectionHeader(canadaExpansion.getRange('D5:J5'), C.amber);
  canadaExpansion.getRange('D6:J9').merge();
  canadaExpansion.getRange('D6').values = [
    [
      'PUBLIC PROJECTS — RESEARCH INTAKE ONLY. B.C., Ontario and Quebec source inventories differ in scope, vintage, threshold and schedule completeness. Counts support source audit; they do not authorize pooled exposure, cost totals, delay estimates or AI-attributable escalation.',
    ],
  ];
  noteBlock(canadaExpansion.getRange('D6:J9'));
  canadaExpansion.getRange('D11:J14').merge();
  canadaExpansion.getRange('D11').values = [
    [
      'PROVINCIAL COST REFERENCE — NOT ASSESSED. All 60 one- through five-year horizon checks remain null under the locked validation protocol. No Alberta coefficient, model choice or error band is transferred to another province.',
    ],
  ];
  noteBlock(canadaExpansion.getRange('D11:J14'));
  canadaExpansion.getRange('D16:J20').merge();
  canadaExpansion.getRange('D16').values = [
    [
      'POWER + DIGEST — SOURCE CONTRACT ONLY. Ontario energy, Quebec peak demand and B.C. plan actions remain separate quantities. The digest can flag review candidates but cannot change the graph, scenarios, baselines, workbook publication basis or Decision Mode.',
    ],
  ];
  noteBlock(canadaExpansion.getRange('D16:J20'));

  canadaExpansion.getRange('A23:G23').values = [
    [
      'Geography',
      'Source ID',
      'Raw records',
      'Normalized',
      'Reported cost',
      'Complete schedule',
      'Gate',
    ],
  ];
  header(canadaExpansion.getRange('A23:G23'));
  const projectRows = provincialProjects.source_diagnostics.map((item) => [
    provinceLabel(item.geography_id),
    item.source_id,
    item.raw_record_count,
    item.normalized_record_count,
    item.reported_cost_record_count,
    item.complete_schedule_record_count,
    'RESEARCH ONLY',
  ]);
  canadaExpansion.getRange('A24:G26').values = projectRows;
  canadaExpansion.getRange('C24:F26').format.numberFormat = '#,##0';
  canadaExpansion.getRange('G24:G26').format = {
    fill: C.amberLight,
    font: { bold: true, color: '#8A4826' },
  };

  const bcpiSummary = new Map();
  for (const item of provincialCostBaseline.reference_class_results) {
    const summary = bcpiSummary.get(item.geography_id) ?? {
      geography_id: item.geography_id,
      series: 0,
      horizons: 0,
      notAssessed: 0,
      latestPeriod: item.latest_period_end,
    };
    summary.series += 1;
    summary.horizons += item.horizons.length;
    summary.notAssessed += item.horizons.filter(
      (horizon) => horizon.status === 'not_assessed',
    ).length;
    bcpiSummary.set(item.geography_id, summary);
  }
  canadaExpansion.getRange('A29:G29').values = [
    [
      'Geography',
      'Reference series',
      'Horizon results',
      'Not assessed',
      'Latest quarter',
      'Unit',
      'Gate',
    ],
  ];
  header(canadaExpansion.getRange('A29:G29'));
  canadaExpansion.getRange('A30:G32').values = [...bcpiSummary.values()]
    .sort((a, b) => a.geography_id.localeCompare(b.geography_id))
    .map((item) => [
      provinceLabel(item.geography_id),
      item.series,
      item.horizons,
      item.notAssessed,
      new Date(`${item.latestPeriod}T00:00:00Z`),
      'Index, 2023=100',
      'WITHHELD',
    ]);
  canadaExpansion.getRange('B30:D32').format.numberFormat = '#,##0';
  canadaExpansion.getRange('E30:E32').format.numberFormat = 'yyyy-mm-dd';
  canadaExpansion.getRange('G30:G32').format = {
    fill: C.amberLight,
    font: { bold: true, color: '#8A4826' },
  };

  canadaExpansion.getRange('A35:G35').values = [
    [
      'Geography',
      'Metric count',
      'Quantity types',
      'Review status',
      'Comparison',
      'Scenario calibration',
      'Transmission requirement',
    ],
  ];
  header(canadaExpansion.getRange('A35:G35'));
  canadaExpansion.getRange('A36:G38').values = Object.entries(
    provincialPowerPlanning.coverage,
  )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([geographyId, item]) => [
      provinceLabel(geographyId),
      item.metric_count,
      item.quantity_types.map(labelize).join('; '),
      provincialPowerPlanning.review_status,
      'SOURCE-SPECIFIC',
      'NO',
      'NO',
    ]);
  canadaExpansion.getRange('B36:B38').format.numberFormat = '#,##0';
  canadaExpansion.getRange('E36:G38').format = {
    fill: C.amberLight,
    font: { bold: true, color: '#8A4826' },
  };

  const sourceById = new Map(
    currentSourceRegistry.sources.map((item) => [item.source_id, item]),
  );
  const sourceRows = digestManifest.source_ids.map((sourceId) => {
    const item = sourceById.get(sourceId);
    return [sourceId, item?.geography ?? 'Unknown', item?.canonical_url ?? ''];
  });
  canadaExpansion.getRange('H23:J23').values = [
    ['Digest source ID', 'Publisher geography', 'Canonical URL'],
  ];
  header(canadaExpansion.getRange('H23:J23'));
  canadaExpansion.getRange('H24:J32').values = sourceRows;
  canadaExpansion.getRange('H24:H32').format.font = {
    name: 'Aptos Mono',
    size: 8,
    color: C.tealDark,
  };
  canadaExpansion.getRange('J24:J32').format.font = {
    size: 8,
    color: C.blueInput,
  };

  canadaExpansion.getRange('A41:J41').merge();
  canadaExpansion.getRange('A41').values = [['Publication boundary']];
  sectionHeader(canadaExpansion.getRange('A41:J41'), C.amber);
  canadaExpansion.getRange('A42:J46').merge();
  canadaExpansion.getRange('A42').values = [
    [
      'This sheet documents current research readiness, not provincial performance. It is deliberately outside the public release manifest. None of these intake artifacts can populate Decision Mode, create a provincial forecast, convert capital expenditure to transmission capacity, or change a model parameter until the relevant independent review and versioned release gates pass.',
    ],
  ];
  canadaExpansion.getRange('A42:J46').format = {
    fill: C.amberLight,
    font: { color: '#7B4529', size: 10 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };
  canadaExpansion.getRange('A48:J48').merge();
  canadaExpansion.getRange('A48').values = [
    [
      `Digest hash: ${digestManifest.markdown_sha256} · source registry hash: ${digestManifest.source_registry_sha256}`,
    ],
  ];
  canadaExpansion.getRange('A48').format = {
    font: { name: 'Aptos Mono', size: 8, color: C.muted },
  };
  canadaExpansion.freezePanes.freezeRows(4);
  setWidths(
    canadaExpansion,
    {
      A: 25,
      B: 34,
      C: 16,
      D: 18,
      E: 18,
      F: 20,
      G: 21,
      H: 32,
      I: 27,
      J: 48,
    },
    48,
  );
}

function buildAttributionGate() {
  titleBand(
    attributionGate,
    'AI-attributable effect identification gate',
    'Preregistered treatment, outcome, control and diagnostic requirements · research only',
    'J',
  );

  attributionGate.getRange('A5:B5').values = [['Control', 'Current value']];
  header(attributionGate.getRange('A5:B5'));
  attributionGate.getRange('A6:B13').values = [
    ['Contract ID', attributionReadiness.contract_id],
    ['Estimand ID', attributionReadiness.estimand_id],
    ['Analysis status', attributionReadiness.analysis_status],
    [
      'AI-attributable increment authorized',
      attributionReadiness.publication_authorization
        .ai_attributable_increment_authorized
        ? 'YES'
        : 'NO',
    ],
    [
      'Cost escalation (CAD)',
      attributionReadiness.publication_authorization.cost_escalation_cad,
    ],
    [
      'Cost escalation (%)',
      attributionReadiness.publication_authorization.cost_escalation_percent,
    ],
    [
      'Schedule delay (days)',
      attributionReadiness.publication_authorization.schedule_delay_days,
    ],
    [
      'Publication status',
      attributionReadiness.publication_authorization.status,
    ],
  ];
  attributionGate.getRange('A6:A13').format.font = {
    bold: true,
    color: C.ink,
  };
  attributionGate.getRange('B6:B13').format = {
    fill: C.white,
    font: { color: C.ink },
    borders: { preset: 'inside', style: 'thin', color: C.line },
  };
  attributionGate.getRange('B9:B13').format = {
    fill: C.amberLight,
    font: { bold: true, color: '#8A4826' },
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };
  attributionGate.getRange('B10').format.numberFormat = '$#,##0';
  attributionGate.getRange('B11').format.numberFormat = '0.0%';
  attributionGate.getRange('B12').format.numberFormat = '#,##0';

  attributionGate.getRange('D5:J5').merge();
  attributionGate.getRange('D5').values = [['Publication boundary']];
  sectionHeader(attributionGate.getRange('D5:J5'), C.amber);
  attributionGate.getRange('D6:J13').merge();
  attributionGate.getRange('D6').values = [
    [
      `${attributionReadiness.publication_authorization.reason} The Edmonton permit screen contributes ${permitProxyReport.data_centre_candidate_count} inferred data-centre candidates, but it contains ${permitProxyReport.explicit_ai_reference_count} explicit AI references and ${permitProxyReport.data_centre_candidate_occupancy_date_available_count} candidate occupancy dates. Its reported permit estimates are not realized spend. Announced capex, requested connection load, demand forecasts, scenario capex and graph pressure scores are prohibited as authorizing treatment measures. The graph remains a mechanism and bottleneck map; it does not supply the counterfactual or identify the treatment effect.`,
    ],
  ];
  attributionGate.getRange('D6:J13').format = {
    fill: C.amberLight,
    font: { color: '#7B4529', size: 10 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };

  attributionGate.getRange('A16:F16').values = [
    [
      'Domain',
      'Role',
      'Status',
      'Available variables',
      'Missing variables',
      'Registry-bound source IDs',
    ],
  ];
  header(attributionGate.getRange('A16:F16'));
  const domainRows = attributionReadiness.domain_status.map((domain) => [
    labelize(domain.domain_id),
    labelize(domain.role),
    domain.status,
    domain.available_variables.map(labelize).join('; '),
    domain.missing_variables.map(labelize).join('; '),
    domain.source_ids.join('; '),
  ]);
  attributionGate.getRange(`A17:F${16 + domainRows.length}`).values = domainRows;
  attributionGate.getRange(`A17:F${16 + domainRows.length}`).format = {
    font: { color: C.ink, size: 9 },
    wrapText: true,
    verticalAlignment: 'top',
    borders: {
      insideHorizontal: { style: 'thin', color: C.line },
      bottom: { style: 'thin', color: C.line },
    },
  };
  attributionGate.getRange(`A17:C${16 + domainRows.length}`).format.font = {
    bold: true,
    color: C.ink,
    size: 9,
  };
  attributionGate
    .getRange(`C17:C${16 + domainRows.length}`)
    .conditionalFormats.add('containsText', {
      text: 'available',
      format: {
        fill: C.tealLight,
        font: { color: C.tealDark, bold: true },
      },
    });
  attributionGate
    .getRange(`C17:C${16 + domainRows.length}`)
    .conditionalFormats.add('containsText', {
      text: 'missing',
      format: {
        fill: C.amberLight,
        font: { color: '#8A4826', bold: true },
      },
    });
  attributionGate.getRange(`A17:F${16 + domainRows.length}`).format.rowHeight = 58;

  attributionGate.getRange('A26:D26').values = [
    ['Design requirement', 'Value', 'Required before estimation', 'Status'],
  ];
  header(attributionGate.getRange('A26:D26'));
  attributionGate.getRange('A27:D34').values = [
    [
      'Primary estimator',
      labelize(attributionReadiness.design.primary_estimator),
      'Yes',
      'locked',
    ],
    [
      'Unit of analysis',
      attributionContract.unit_of_analysis,
      'Yes',
      'locked',
    ],
    ['Frequency', attributionContract.frequency, 'Yes', 'locked'],
    [
      'Anticipation periods',
      attributionReadiness.design.anticipation_periods,
      'Yes',
      'locked',
    ],
    [
      'Minimum pre-treatment quarters',
      attributionReadiness.design.minimum_pre_treatment_quarters,
      'Yes',
      'locked',
    ],
    [
      'Minimum post-treatment quarters',
      attributionReadiness.design.minimum_post_treatment_quarters,
      'Yes',
      'locked',
    ],
    [
      'Minimum treated regions',
      attributionReadiness.design.minimum_treated_regions,
      'Yes',
      'locked',
    ],
    [
      'Minimum controls per cohort',
      attributionReadiness.design.minimum_control_regions_per_cohort,
      'Yes',
      'locked',
    ],
  ];
  attributionGate.getRange('A27:A34').format.font = { bold: true, color: C.ink };
  attributionGate.getRange('B27:D34').format = {
    fill: C.white,
    font: { color: C.ink, size: 9 },
    wrapText: true,
    borders: { preset: 'inside', style: 'thin', color: C.line },
  };

  attributionGate.getRange('F26:H26').values = [
    ['Readiness check', 'Status', 'Summary'],
  ];
  header(attributionGate.getRange('F26:H26'));
  const readinessRows = attributionReadiness.readiness_checks.map((check) => [
    labelize(check.check_id),
    check.status,
    check.summary,
  ]);
  attributionGate.getRange(`F27:H${26 + readinessRows.length}`).values =
    readinessRows;
  attributionGate.getRange(`F27:H${26 + readinessRows.length}`).format = {
    font: { color: C.ink, size: 9 },
    wrapText: true,
    verticalAlignment: 'top',
    borders: {
      insideHorizontal: { style: 'thin', color: C.line },
      bottom: { style: 'thin', color: C.line },
    },
  };
  attributionGate.getRange(`F27:F${26 + readinessRows.length}`).format.font = {
    bold: true,
    color: C.ink,
    size: 9,
  };
  attributionGate
    .getRange(`G27:G${26 + readinessRows.length}`)
    .conditionalFormats.add('containsText', {
      text: 'pass',
      format: {
        fill: C.tealLight,
        font: { color: C.tealDark, bold: true },
      },
    });
  attributionGate
    .getRange(`G27:G${26 + readinessRows.length}`)
    .conditionalFormats.add('containsText', {
      text: 'pending',
      format: {
        fill: C.amberLight,
        font: { color: '#8A4826', bold: true },
      },
    });
  attributionGate.getRange(`F27:H${26 + readinessRows.length}`).format.rowHeight =
    44;

  attributionGate.getRange('A40:J40').merge();
  attributionGate.getRange('A40').values = [['Identification rule']];
  sectionHeader(attributionGate.getRange('A40:J40'), C.amber);
  attributionGate.getRange('A41:J46').merge();
  attributionGate.getRange('A41').values = [
    [
      `Authorizing measures: ${attributionContract.treatment.authorizing_measures.map(labelize).join('; ')}. Research-only proxies: ${attributionContract.treatment.proxy_measures_research_only.map(labelize).join('; ')}. Prohibited as treatment: ${attributionContract.treatment.prohibited_as_treatment.map(labelize).join('; ')}. Effect publication remains withheld until the identifying panel, common support, pre-trend equivalence, placebo and negative-control tests, leave-one-out sensitivity and independent review all pass.`,
    ],
  ];
  attributionGate.getRange('A41:J46').format = {
    fill: C.amberLight,
    font: { color: '#7B4529', size: 10 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };
  attributionGate.getRange('A48:J48').merge();
  attributionGate.getRange('A48').values = [
    [
      `Contract hash: ${attributionReadiness.contract_sha256} · regional control output hash: ${investmentControlReport.output_sha256} · permit proxy output hash: ${permitProxyReport.output_sha256}`,
    ],
  ];
  attributionGate.getRange('A48').format = {
    font: { name: 'Aptos Mono', size: 8, color: C.muted },
  };
  attributionGate.freezePanes.freezeRows(4);
  setWidths(
    attributionGate,
    {
      A: 31,
      B: 26,
      C: 17,
      D: 40,
      E: 40,
      F: 34,
      G: 18,
      H: 58,
      I: 16,
      J: 16,
    },
    48,
  );
}

function buildInvestmentControls() {
  titleBand(
    investmentControls,
    'Canada regional building-investment controls',
    `Statistics Canada ${investmentControlReport.source_id} · quarterly control panel through ${investmentControlReport.as_of_date}`,
    'R',
  );

  const summaryCards = [
    ['A5:C5', 'A6:C6', 'Observations', investmentControlReport.observation_count],
    ['D5:F5', 'D6:F6', 'Geographies', investmentControlReport.geography_count],
    ['G5:I5', 'G6:I6', 'Quarters', investmentControlReport.quarter_count],
    ['J5:L5', 'J6:L6', 'Latest period', investmentControlReport.as_of_date],
    ['M5:O5', 'M6:O6', 'Source evidence', 'observed monthly'],
    ['P5:R5', 'P6:R6', 'Panel evidence', 'inferred quarterly'],
  ];
  for (const [labelRange, valueRange, label, value] of summaryCards) {
    investmentControls.getRange(labelRange).merge();
    investmentControls.getRange(labelRange.split(':')[0]).values = [[label]];
    investmentControls.getRange(labelRange).format = {
      fill: C.tealLight,
      font: { bold: true, color: C.tealDark, size: 9 },
      horizontalAlignment: 'center',
      verticalAlignment: 'center',
      borders: { preset: 'outside', style: 'thin', color: '#B9CEC7' },
    };
    investmentControls.getRange(valueRange).merge();
    investmentControls.getRange(valueRange.split(':')[0]).values = [[value]];
    investmentControls.getRange(valueRange).format = {
      fill: C.white,
      font: { bold: true, color: C.ink, size: 14 },
      horizontalAlignment: 'center',
      verticalAlignment: 'center',
      borders: { preset: 'outside', style: 'thin', color: '#B9CEC7' },
    };
  }
  investmentControls.getRange('A6:I6').format.numberFormat = '#,##0';

  investmentControls.getRange('A8:R8').merge();
  investmentControls.getRange('A8').values = [
    [
      `REGIONAL CONTROL ONLY. ${investmentControlReport.publication_boundary.reason} Values are sums of three contiguous observed monthly values; incomplete quarters remain missing.`,
    ],
  ];
  investmentControls.getRange('A8:R8').format = {
    fill: C.amberLight,
    font: { color: '#7B4529', size: 10 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };
  investmentControls.getRange('A8').format.rowHeight = 42;

  const headers = [
    'observation_id',
    'indicator_id',
    'geography_label',
    'statcan_dguid',
    'type_of_structure',
    'investment_basis',
    'value',
    'unit',
    'geography_id',
    'period_start',
    'period_end',
    'source_id',
    'source_evidence_status',
    'evidence_status',
    'transformation_id',
    'source_month_count',
    'quality_flags',
    'source_url',
  ];
  investmentControls.getRange('A10:R10').values = [headers];
  header(investmentControls.getRange('A10:R10'));
  const sourceUrl = currentSourceRegistry.sources.find(
    (source) => source.source_id === investmentControlReport.source_id,
  )?.canonical_url;
  const rows = investmentControlRows.map((row) => [
    row.observation_id,
    row.indicator_id,
    row.geography_label,
    row.statcan_dguid,
    row.type_of_structure,
    row.investment_basis,
    numberOrNull(row.value),
    row.unit,
    row.geography_id,
    new Date(`${row.period_start}T00:00:00Z`),
    new Date(`${row.period_end}T00:00:00Z`),
    row.source_id,
    row.source_evidence_status,
    row.evidence_status,
    row.transformation_id,
    numberOrNull(row.source_month_count),
    row.quality_flags,
    sourceUrl ?? '',
  ]);
  const lastRow = 10 + rows.length;
  investmentControls.getRange(`A11:R${lastRow}`).values = rows;
  investmentControls.getRange(`G11:G${lastRow}`).format.numberFormat = '$#,##0';
  investmentControls.getRange(`J11:K${lastRow}`).format.numberFormat =
    'yyyy-mm-dd';
  investmentControls.getRange(`P11:P${lastRow}`).format.numberFormat = '#,##0';
  investmentControls.getRange(`A11:B${lastRow}`).format.font = {
    name: 'Aptos Mono',
    size: 8,
    color: C.ink,
  };
  investmentControls.getRange(`L11:O${lastRow}`).format.font = {
    name: 'Aptos Mono',
    size: 8,
    color: C.tealDark,
  };
  investmentControls.getRange(`R11:R${lastRow}`).format.font = {
    size: 8,
    color: C.blueInput,
  };
  const table = investmentControls.tables.add(
    `A10:R${lastRow}`,
    true,
    'InvestmentControlsTable',
  );
  table.style = 'TableStyleMedium2';
  investmentControls.freezePanes.freezeRows(10);
  investmentControls.freezePanes.freezeColumns(3);
  const widths = {
    A: 27,
    B: 48,
    C: 40,
    D: 17,
    E: 38,
    F: 36,
    G: 17,
    H: 20,
    I: 16,
    J: 15,
    K: 15,
    L: 24,
    M: 22,
    N: 18,
    O: 39,
    P: 18,
    Q: 30,
    R: 48,
  };
  for (const [column, width] of Object.entries(widths)) {
    investmentControls.getRange(`${column}1:${column}${lastRow}`).format.columnWidth =
      width;
  }
}

function buildProcurementIntake() {
  titleBand(
    procurementIntake,
    'CanadaBuys construction procurement outcome-feasibility intake',
    `Federal fiscal-year 2026-2027 files · as of ${procurementOutcomeReport.as_of_date} · research only`,
    'X',
  );

  const summaryCards = [
    ['A5:D5', 'A6:D6', 'Construction linkages', procurementOutcomeReport.construction_linkage_count],
    ['E5:H5', 'E6:H6', 'Tender + award', procurementOutcomeReport.linked_tender_award_count],
    ['I5:L5', 'I6:L6', 'Tender + contract', procurementOutcomeReport.linked_tender_contract_count],
    [
      'M5:P5',
      'M6:P6',
      'Positive award value',
      procurementOutcomeReport.field_availability.reported_award_value_cad,
    ],
    [
      'Q5:T5',
      'Q6:T6',
      'Single-province geography',
      procurementOutcomeReport.single_province_geography_count,
    ],
    ['U5:X5', 'U6:X6', 'CMA geography', procurementOutcomeReport.cma_geography_count],
  ];
  for (const [labelRange, valueRange, label, value] of summaryCards) {
    procurementIntake.getRange(labelRange).merge();
    procurementIntake.getRange(labelRange.split(':')[0]).values = [[label]];
    procurementIntake.getRange(labelRange).format = {
      fill: C.tealLight,
      font: { bold: true, color: C.tealDark, size: 9 },
      horizontalAlignment: 'center',
      verticalAlignment: 'center',
      borders: { preset: 'outside', style: 'thin', color: '#B9CEC7' },
    };
    procurementIntake.getRange(valueRange).merge();
    procurementIntake.getRange(valueRange.split(':')[0]).values = [[value]];
    procurementIntake.getRange(valueRange).format = {
      fill: C.white,
      font: { bold: true, color: C.ink, size: 14 },
      horizontalAlignment: 'center',
      verticalAlignment: 'center',
      borders: { preset: 'outside', style: 'thin', color: '#B9CEC7' },
    };
  }
  procurementIntake.getRange('A6:X6').format.numberFormat = '#,##0';

  procurementIntake.getRange('A8:X8').merge();
  procurementIntake.getRange('A8').values = [
    [
      `PROCUREMENT FEASIBILITY ONLY. ${procurementOutcomeReport.publication_boundary.reason} Procurement-instrument dates are not physical construction dates. Generated linkage IDs are not physical-project IDs, and null authorizing outcome fields are not zero effects.`,
    ],
  ];
  procurementIntake.getRange('A8:X8').format = {
    fill: C.amberLight,
    font: { color: '#7B4529', size: 10 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };
  procurementIntake.getRange('A8').format.rowHeight = 48;

  const headers = [
    'procurement_linkage_id',
    'solicitation_number',
    'title',
    'geography_id',
    'geography_label',
    'geography_evidence_status',
    'tender_publication_date',
    'tender_close_date',
    'tender_duration_days',
    'award_record_count',
    'award_date',
    'reported_award_value_cad',
    'contract_record_count',
    'contract_amendment_row_count',
    'reported_total_contract_value_cad',
    'reported_contract_start_date',
    'reported_contract_end_date',
    'cost_outcome_status',
    'schedule_outcome_status',
    'competition_outcome_status',
    'source_ids',
    'source_evidence_status',
    'evidence_status',
    'quality_flags',
  ];
  procurementIntake.getRange('A10:X10').values = [headers];
  header(procurementIntake.getRange('A10:X10'));
  const rows = procurementOutcomeRows.map((row) => [
    row.procurement_linkage_id,
    row.solicitation_number,
    row.title,
    row.geography_id,
    row.geography_label,
    row.geography_evidence_status,
    dateOrNull(row.tender_publication_date),
    dateOrNull(row.tender_close_date),
    numberOrNull(row.tender_duration_days),
    numberOrNull(row.award_record_count),
    dateOrNull(row.award_date),
    numberOrNull(row.reported_award_value_cad),
    numberOrNull(row.contract_record_count),
    numberOrNull(row.contract_amendment_row_count),
    numberOrNull(row.reported_total_contract_value_cad),
    dateOrNull(row.reported_contract_start_date),
    dateOrNull(row.reported_contract_end_date),
    row.cost_outcome_status,
    row.schedule_outcome_status,
    row.competition_outcome_status,
    row.source_ids,
    row.source_evidence_status,
    row.evidence_status,
    row.quality_flags,
  ]);
  const lastRow = 10 + rows.length;
  procurementIntake.getRange(`A11:X${lastRow}`).values = rows;
  procurementIntake.getRange(`G11:H${lastRow}`).format.numberFormat = 'yyyy-mm-dd';
  procurementIntake.getRange(`K11:K${lastRow}`).format.numberFormat = 'yyyy-mm-dd';
  procurementIntake.getRange(`P11:Q${lastRow}`).format.numberFormat = 'yyyy-mm-dd';
  procurementIntake.getRange(`L11:L${lastRow}`).format.numberFormat = '$#,##0';
  procurementIntake.getRange(`O11:O${lastRow}`).format.numberFormat = '$#,##0';
  procurementIntake.getRange(`A11:B${lastRow}`).format.font = {
    name: 'Aptos Mono',
    size: 8,
    color: C.ink,
  };
  procurementIntake.getRange(`U11:W${lastRow}`).format.font = {
    name: 'Aptos Mono',
    size: 8,
    color: C.tealDark,
  };
  procurementIntake.getRange(`R11:T${lastRow}`).format = {
    fill: C.amberLight,
    font: { color: '#8A4826', size: 8 },
  };
  const table = procurementIntake.tables.add(
    `A10:X${lastRow}`,
    true,
    'ProcurementIntakeTable',
  );
  table.style = 'TableStyleMedium2';
  procurementIntake.freezePanes.freezeRows(10);
  procurementIntake.freezePanes.freezeColumns(3);
  const widths = {
    A: 28,
    B: 24,
    C: 54,
    D: 15,
    E: 28,
    F: 25,
    G: 16,
    H: 16,
    I: 16,
    J: 15,
    K: 16,
    L: 20,
    M: 17,
    N: 19,
    O: 24,
    P: 17,
    Q: 17,
    R: 23,
    S: 23,
    T: 26,
    U: 48,
    V: 18,
    W: 23,
    X: 62,
  };
  for (const [column, width] of Object.entries(widths)) {
    procurementIntake.getRange(`${column}1:${column}${lastRow}`).format.columnWidth =
      width;
  }
}

function buildPermitProxy() {
  titleBand(
    permitProxy,
    'Edmonton data-centre permit activity proxy',
    `City of Edmonton issued-permit screen · ${permitProxyReport.period_start} to ${permitProxyReport.period_end} · research only`,
    'M',
  );

  const summaryCards = [
    ['A5:B5', 'A6:B6', 'Broad keyword screen', permitProxyReport.broad_screen_row_count],
    ['C5:D5', 'C6:D6', 'Data-centre candidates', permitProxyReport.data_centre_candidate_count],
    ['E5:F5', 'E6:F6', 'Candidates since 2018', permitProxyReport.data_centre_candidate_count_since_2018],
    ['G5:H5', 'G6:H6', 'Explicit AI references', permitProxyReport.explicit_ai_reference_count],
    ['I5:J5', 'I6:J6', 'Candidate occupancy dates', permitProxyReport.data_centre_candidate_occupancy_date_available_count],
    [
      'K5:M5',
      'K6:M6',
      'Reported permit estimate proxy',
      permitProxyReport.data_centre_candidate_reported_value_total_cad_proxy,
    ],
  ];
  for (const [labelRange, valueRange, label, value] of summaryCards) {
    permitProxy.getRange(labelRange).merge();
    permitProxy.getRange(labelRange.split(':')[0]).values = [[label]];
    permitProxy.getRange(labelRange).format = {
      fill: C.tealLight,
      font: { bold: true, color: C.tealDark, size: 9 },
      horizontalAlignment: 'center',
      verticalAlignment: 'center',
      borders: { preset: 'outside', style: 'thin', color: '#B9CEC7' },
    };
    permitProxy.getRange(valueRange).merge();
    permitProxy.getRange(valueRange.split(':')[0]).values = [[value]];
    permitProxy.getRange(valueRange).format = {
      fill: C.white,
      font: { bold: true, color: C.ink, size: 16 },
      horizontalAlignment: 'center',
      verticalAlignment: 'center',
      borders: { preset: 'outside', style: 'thin', color: '#B9CEC7' },
    };
  }
  permitProxy.getRange('A6:J6').format.numberFormat = '#,##0';
  permitProxy.getRange('K6:M6').format.numberFormat = '$#,##0';

  permitProxy.getRange('A8:M8').merge();
  permitProxy.getRange('A8').values = [
    [
      `NON-AUTHORIZING MUNICIPAL ACTIVITY PROXY. ${permitProxyReport.publication_boundary.reason} The CAD ${permitProxyReport.data_centre_candidate_reported_value_total_cad_proxy.toLocaleString('en-CA')} aggregate includes one demolition candidate; the non-demolition candidate aggregate is CAD ${permitProxyReport.data_centre_candidate_non_demolition_reported_value_total_cad_proxy.toLocaleString('en-CA')}. Neither is AI capex.`,
    ],
  ];
  permitProxy.getRange('A8:M8').format = {
    fill: C.amberLight,
    font: { color: '#7B4529', size: 10 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };
  permitProxy.getRange('A8').format.rowHeight = 62;

  const classificationCards = [
    [
      'A10:D10',
      'A11:D11',
      'Explicit data-centre reference',
      permitProxyReport.classification_counts.explicit_data_centre_reference,
    ],
    [
      'E10:H10',
      'E11:H11',
      'Server reference only',
      permitProxyReport.classification_counts.server_reference_only,
    ],
    [
      'I10:M10',
      'I11:M11',
      'Broad-query substring false positive',
      permitProxyReport.classification_counts.broad_query_substring_false_positive,
    ],
  ];
  for (const [labelRange, valueRange, label, value] of classificationCards) {
    permitProxy.getRange(labelRange).merge();
    permitProxy.getRange(labelRange.split(':')[0]).values = [[label]];
    permitProxy.getRange(labelRange).format = {
      fill: C.soft,
      font: { bold: true, color: C.muted, size: 9 },
      horizontalAlignment: 'center',
      verticalAlignment: 'center',
      borders: { preset: 'outside', style: 'thin', color: C.line },
    };
    permitProxy.getRange(valueRange).merge();
    permitProxy.getRange(valueRange.split(':')[0]).values = [[value]];
    permitProxy.getRange(valueRange).format = {
      fill: C.white,
      font: { bold: true, color: C.ink, size: 13 },
      horizontalAlignment: 'center',
      verticalAlignment: 'center',
      borders: { preset: 'outside', style: 'thin', color: C.line },
    };
  }

  const headers = [
    'permit_proxy_id',
    'issue_date',
    'job_category',
    'building_type',
    'work_type',
    'matched_terms',
    'reported_estimated_value_cad_proxy',
    'floor_area_sq_ft',
    'occupancy_status',
    'ai_specificity_status',
    'classification_evidence_status',
    'description_sha256',
    'quality_flags',
  ];
  permitProxy.getRange('A13:M13').values = [headers];
  header(permitProxy.getRange('A13:M13'));
  const candidateRows = permitProxyRows
    .filter((row) => row.candidate_status === 'data_centre_candidate')
    .map((row) => [
      row.permit_proxy_id,
      dateOrNull(row.issue_date),
      row.job_category,
      row.building_type,
      row.work_type,
      row.matched_terms,
      numberOrNull(row.reported_estimated_construction_value_cad),
      numberOrNull(row.floor_area_sq_ft),
      row.occupancy_date_status,
      row.ai_specificity_status,
      row.classification_evidence_status,
      row.description_sha256,
      row.quality_flags,
    ]);
  const candidateLastRow = 13 + candidateRows.length;
  permitProxy.getRange(`A14:M${candidateLastRow}`).values = candidateRows;
  permitProxy.getRange(`B14:B${candidateLastRow}`).format.numberFormat = 'yyyy-mm-dd';
  permitProxy.getRange(`G14:G${candidateLastRow}`).format.numberFormat = '$#,##0';
  permitProxy.getRange(`H14:H${candidateLastRow}`).format.numberFormat = '#,##0';
  permitProxy.getRange(`A14:A${candidateLastRow}`).format.font = {
    name: 'Aptos Mono',
    size: 8,
    color: C.ink,
  };
  permitProxy.getRange(`L14:L${candidateLastRow}`).format.font = {
    name: 'Aptos Mono',
    size: 7,
    color: C.muted,
  };
  permitProxy.getRange(`I14:J${candidateLastRow}`).format = {
    fill: C.amberLight,
    font: { color: '#8A4826', size: 8 },
  };
  const table = permitProxy.tables.add(
    `A13:M${candidateLastRow}`,
    true,
    'EdmontonPermitProxyTable',
  );
  table.style = 'TableStyleMedium2';

  permitProxy.getRange('A33:M33').merge();
  permitProxy.getRange('A33').values = [['Audit and privacy controls']];
  sectionHeader(permitProxy.getRange('A33:M33'));
  const auditRows = [
    ['Source ID', permitProxyReport.source_ids.join('; ')],
    ['Evidence status', permitProxyReport.evidence_status],
    ['Input SHA-256', permitProxyReport.input_sha256],
    ['Output SHA-256', permitProxyReport.output_sha256],
    ['Retrieval manifest SHA-256', permitProxyReport.retrieval_manifest_sha256],
    ['Fields excluded', permitProxyReport.field_minimization.processed_output_excludes.join('; ')],
    ['Publication status', permitProxyReport.publication_boundary.status],
  ];
  auditRows.forEach(([label, value], index) => {
    const row = 34 + index;
    permitProxy.getRange(`A${row}:B${row}`).merge();
    permitProxy.getRange(`A${row}`).values = [[label]];
    permitProxy.getRange(`A${row}:B${row}`).format = {
      font: { bold: true, color: C.ink },
      borders: { preset: 'inside', style: 'thin', color: C.line },
    };
    permitProxy.getRange(`C${row}:G${row}`).merge();
    permitProxy.getRange(`C${row}`).values = [[value]];
    permitProxy.getRange(`C${row}:G${row}`).format = {
      font: { name: 'Aptos Mono', size: 8, color: C.muted },
      wrapText: true,
      borders: { preset: 'inside', style: 'thin', color: C.line },
    };
  });
  permitProxy.getRange('H34:M40').merge();
  permitProxy.getRange('H34').values = [
    [
      `Controlled classification is inferred and requires human review. Exact addresses, legal descriptions, coordinates, neighbourhoods and raw free-text job descriptions are absent from this processed sheet. Description lineage is retained only as a SHA-256 trace plus controlled matched-term labels. Official source: ${currentSourceRegistry.sources.find((item) => item.source_id === permitProxyReport.source_ids[0])?.canonical_url ?? ''}`,
    ],
  ];
  noteBlock(permitProxy.getRange('H34:M40'));
  permitProxy.freezePanes.freezeRows(13);
  permitProxy.freezePanes.freezeColumns(2);
  setWidths(
    permitProxy,
    {
      A: 27,
      B: 15,
      C: 24,
      D: 31,
      E: 27,
      F: 18,
      G: 23,
      H: 16,
      I: 18,
      J: 19,
      K: 21,
      L: 30,
      M: 60,
    },
    42,
  );
}

function buildAuditedOutcomes() {
  titleBand(
    auditedOutcomeSheet,
    'Audited public-project outcome references',
    'Hash-locked Ontario Auditor General cases · field discovery only · pending independent transcription review',
    'O',
  );

  const coverage = auditedOutcomes.coverage_summary;
  auditedOutcomeSheet.getRange('A5:B5').values = [['Coverage', 'Count / status']];
  header(auditedOutcomeSheet.getRange('A5:B5'));
  auditedOutcomeSheet.getRange('A6:B11').values = [
    ['Named completed projects', coverage.named_completed_project_count],
    ['Completed total-cost cases', coverage.completed_total_cost_case_count],
    [
      'Exact-day completion pairs',
      coverage.exact_day_substantial_completion_pair_count,
    ],
    ['Published price-basis dates', coverage.price_basis_date_case_count],
    [
      'Stable publisher project IDs',
      coverage.publisher_stable_project_id_case_count,
    ],
    [
      'Reference cases authorized',
      auditedOutcomes.publication_boundary.reference_case_publication_authorized
        ? 'YES'
        : 'NO',
    ],
  ];
  auditedOutcomeSheet.getRange('A6:A11').format.font = {
    bold: true,
    color: C.ink,
  };
  auditedOutcomeSheet.getRange('B6:B11').format = {
    fill: C.white,
    font: { color: C.ink },
    borders: { preset: 'inside', style: 'thin', color: C.line },
  };
  auditedOutcomeSheet.getRange('B11').format = {
    fill: C.amberLight,
    font: { bold: true, color: '#8A4826' },
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };

  auditedOutcomeSheet.getRange('D5:O5').merge();
  auditedOutcomeSheet.getRange('D5').values = [['Publication boundary']];
  sectionHeader(auditedOutcomeSheet.getRange('D5:O5'), C.amber);
  auditedOutcomeSheet.getRange('D6:O11').merge();
  auditedOutcomeSheet.getRange('D6').values = [
    [
      `${auditedOutcomes.publication_boundary.reason} These cases may inform schema design and graph-channel mapping, but they do not authorize an AI-attributable cost or schedule effect. Review status: ${labelize(auditedOutcomes.review.status)}.`,
    ],
  ];
  auditedOutcomeSheet.getRange('D6:O11').format = {
    fill: C.amberLight,
    font: { color: '#7B4529', size: 10 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };

  auditedOutcomeSheet.getRange('A13:O13').values = [
    [
      'Project',
      'Asset class',
      'Delivery model',
      'Baseline cost (CAD)',
      'Latest / final cost (CAD)',
      'Variance (CAD)',
      'Variance (%)',
      'Baseline substantial completion',
      'Actual substantial completion',
      'Delay (days)',
      'Latest cost status',
      'Price basis date',
      'Complete change history',
      'Cost panel authorized',
      'Schedule panel authorized',
    ],
  ];
  header(auditedOutcomeSheet.getRange('A13:O13'));
  const caseFirstRow = 14;
  const caseLastRow = caseFirstRow + auditedOutcomes.cases.length - 1;
  auditedOutcomeSheet.getRange(`A${caseFirstRow}:O${caseLastRow}`).values =
    auditedOutcomes.cases.map((item) => [
      item.project_name,
      labelize(item.asset_class),
      labelize(item.delivery_model),
      item.baseline_cost_cad,
      item.latest_or_final_cost_cad,
      item.cost_variance_cad,
      item.cost_variance_percent / 100,
      item.baseline_substantial_completion_date,
      item.actual_substantial_completion_date,
      item.schedule_delay_days,
      labelize(item.latest_or_final_cost_status),
      item.baseline_price_basis_date,
      item.approved_change_history_complete ? 'YES' : 'NO',
      item.cost_outcome_panel_authorized ? 'YES' : 'NO',
      item.schedule_outcome_panel_authorized ? 'YES' : 'NO',
    ]);
  auditedOutcomeSheet.getRange(`A${caseFirstRow}:O${caseLastRow}`).format = {
    font: { color: C.ink, size: 9 },
    wrapText: true,
    verticalAlignment: 'top',
    borders: {
      insideHorizontal: { style: 'thin', color: C.line },
      bottom: { style: 'thin', color: C.line },
    },
  };
  auditedOutcomeSheet.getRange(`A${caseFirstRow}:C${caseLastRow}`).format.font = {
    bold: true,
    color: C.ink,
    size: 9,
  };
  auditedOutcomeSheet.getRange(`D${caseFirstRow}:F${caseLastRow}`).format.numberFormat =
    '$#,##0';
  auditedOutcomeSheet.getRange(`G${caseFirstRow}:G${caseLastRow}`).format.numberFormat =
    '0.0%';
  auditedOutcomeSheet.getRange(`J${caseFirstRow}:J${caseLastRow}`).format.numberFormat =
    '#,##0';
  auditedOutcomeSheet.getRange(`M${caseFirstRow}:O${caseLastRow}`).format = {
    fill: C.amberLight,
    font: { bold: true, color: '#8A4826', size: 9 },
    borders: { preset: 'inside', style: 'thin', color: '#E1B48E' },
  };
  auditedOutcomeSheet.getRange(`A${caseFirstRow}:O${caseLastRow}`).format.rowHeight =
    58;

  const componentRows = auditedOutcomes.cases.flatMap((item) =>
    item.cost_components.map((component) => [
      item.project_name,
      component.source_category,
      labelize(component.graph_channel),
      component.value_cad,
      component.source_evidence_status,
      component.graph_channel_evidence_status,
    ]),
  );
  const componentFirstRow = 20;
  const componentLastRow = componentFirstRow + componentRows.length - 1;
  auditedOutcomeSheet.getRange('A19:F19').values = [
    [
      'Project',
      'Source cost category',
      'AIIO graph channel',
      'Value (CAD)',
      'Source evidence',
      'Channel evidence',
    ],
  ];
  header(auditedOutcomeSheet.getRange('A19:F19'));
  auditedOutcomeSheet.getRange(`A${componentFirstRow}:F${componentLastRow}`).values =
    componentRows;
  auditedOutcomeSheet.getRange(`A${componentFirstRow}:F${componentLastRow}`).format = {
    font: { color: C.ink, size: 9 },
    wrapText: true,
    verticalAlignment: 'top',
    borders: {
      insideHorizontal: { style: 'thin', color: C.line },
      bottom: { style: 'thin', color: C.line },
    },
  };
  auditedOutcomeSheet.getRange(`D${componentFirstRow}:D${componentLastRow}`).format.numberFormat =
    '$#,##0';

  auditedOutcomeSheet.getRange('H19:K19').values = [
    ['Project', 'Reported component total', 'Summed components', 'Check'],
  ];
  header(auditedOutcomeSheet.getRange('H19:K19'));
  const reconciliationFirstRow = 20;
  const reconciliationLastRow =
    reconciliationFirstRow + auditedOutcomes.cases.length - 1;
  auditedOutcomeSheet.getRange(
    `H${reconciliationFirstRow}:I${reconciliationLastRow}`,
  ).values = auditedOutcomes.cases.map((item) => [
    item.project_name,
    item.cost_component_total_cad,
  ]);
  for (let index = 0; index < auditedOutcomes.cases.length; index += 1) {
    const row = reconciliationFirstRow + index;
    auditedOutcomeSheet.getRange(`J${row}`).formulas = [
      [`=SUMIF($A$${componentFirstRow}:$A$${componentLastRow},H${row},$D$${componentFirstRow}:$D$${componentLastRow})`],
    ];
    auditedOutcomeSheet.getRange(`K${row}`).formulas = [
      [`=IF(ABS(I${row}-J${row})<1,"PASS","FAIL")`],
    ];
  }
  auditedOutcomeSheet.getRange(
    `H${reconciliationFirstRow}:K${reconciliationLastRow}`,
  ).format = {
    font: { color: C.ink, size: 9 },
    wrapText: true,
    borders: { preset: 'inside', style: 'thin', color: C.line },
  };
  auditedOutcomeSheet.getRange(
    `I${reconciliationFirstRow}:J${reconciliationLastRow}`,
  ).format.numberFormat = '$#,##0';
  auditedOutcomeSheet
    .getRange(`K${reconciliationFirstRow}:K${reconciliationLastRow}`)
    .conditionalFormats.add('containsText', {
      text: 'PASS',
      format: {
        fill: C.tealLight,
        font: { color: C.tealDark, bold: true },
      },
    });

  auditedOutcomeSheet.getRange('H24:O24').merge();
  auditedOutcomeSheet.getRange('H24').values = [['Evidence boundary']];
  sectionHeader(auditedOutcomeSheet.getRange('H24:O24'), C.amber);
  auditedOutcomeSheet.getRange('H25:O32').merge();
  auditedOutcomeSheet.getRange('H25').values = [
    [
      `Observed source categories are retained verbatim. AIIO graph channels are inferred classifications for mechanism mapping. Lakeridge Gardens has mixed month/day schedule precision, so no day-delay value is computed. Highway 427 has an exact ${auditedOutcomes.cases[1].schedule_delay_days}-day substantial-completion difference, but its latest cost was under dispute and not final at the audit date. Neither case has a published estimate price-basis date or complete approved-change history.`,
    ],
  ];
  auditedOutcomeSheet.getRange('H25:O32').format = {
    fill: C.amberLight,
    font: { color: '#7B4529', size: 10 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };

  const outcomeSource = currentSourceRegistry.sources.find(
    (item) => item.source_id === auditedOutcomes.source_id,
  );
  auditedOutcomeSheet.getRange('H34:O34').merge();
  auditedOutcomeSheet.getRange('H34').values = [['Source and reproducibility']];
  sectionHeader(auditedOutcomeSheet.getRange('H34:O34'));
  auditedOutcomeSheet.getRange('H35:O41').merge();
  auditedOutcomeSheet.getRange('H35').values = [
    [
      `Source: ${outcomeSource?.canonical_url ?? auditedOutcomes.source_id}\nArchive: ${auditedOutcomes.source_file.archive_file}\nContent hash: ${auditedOutcomes.source_file.content_hash}\nVerified text anchors: ${auditedOutcomes.source_file.verified_anchor_count}\nReview record: ${auditedOutcomes.review.review_record}`,
    ],
  ];
  auditedOutcomeSheet.getRange('H35:O41').format = {
    fill: C.soft,
    font: { name: 'Aptos Mono', color: C.muted, size: 8 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: C.line },
  };

  const table = auditedOutcomeSheet.tables.add(
    `A19:F${componentLastRow}`,
    true,
    'AuditedOutcomeComponentsTable',
  );
  table.style = 'TableStyleMedium2';
  auditedOutcomeSheet.freezePanes.freezeRows(13);
  auditedOutcomeSheet.freezePanes.freezeColumns(1);
  setWidths(
    auditedOutcomeSheet,
    {
      A: 38,
      B: 28,
      C: 34,
      D: 20,
      E: 19,
      F: 19,
      G: 15,
      H: 36,
      I: 22,
      J: 22,
      K: 26,
      L: 18,
      M: 20,
      N: 20,
      O: 21,
    },
    46,
  );
}

function buildQuebecRevisions() {
  titleBand(
    quebecRevisionSheet,
    'Quebec authorized project revisions',
    'Official lifecycle histories · chain-reconciled research candidate · not final outturn or an AI effect',
    'R',
  );

  const coverage = quebecRevisions.coverage_summary;
  const boundary = quebecRevisions.publication_boundary;
  quebecRevisionSheet.getRange('A5:D5').values = [
    ['Coverage', 'Count / status', 'Chain quality', 'Count / status'],
  ];
  header(quebecRevisionSheet.getRange('A5:D5'));
  quebecRevisionSheet.getRange('A6:D10').values = [
    [
      'Source projects',
      coverage.source_project_count,
      'Stable lifecycle IDs',
      coverage.stable_lifecycle_project_id_count,
    ],
    [
      'Authorized cost events',
      coverage.authorized_cost_revision_event_count,
      'Reconciled cost chains',
      coverage.cost_revision_chain_reconciled_project_count,
    ],
    [
      'Authorized schedule events',
      coverage.authorized_schedule_revision_event_count,
      'Reconciled schedule chains',
      coverage.schedule_revision_chain_reconciled_project_count,
    ],
    [
      'Joint reconciled chains',
      coverage.joint_reconciled_revision_project_count,
      'Fiscal-year completion markers',
      coverage.actual_completion_fiscal_year_count,
    ],
    [
      'Reference panel authorized',
      boundary.authorized_revision_reference_panel_authorized ? 'YES' : 'NO',
      'AI effect authorized',
      boundary.ai_attributable_effect_authorized ? 'YES' : 'NO',
    ],
  ];
  quebecRevisionSheet.getRange('A6:A10').format.font = {
    bold: true,
    color: C.ink,
  };
  quebecRevisionSheet.getRange('C6:C10').format.font = {
    bold: true,
    color: C.ink,
  };
  quebecRevisionSheet.getRange('B6:D10').format.borders = {
    preset: 'inside',
    style: 'thin',
    color: C.line,
  };
  quebecRevisionSheet.getRange('B10:D10').format = {
    fill: C.amberLight,
    font: { bold: true, color: '#8A4826' },
    borders: { preset: 'inside', style: 'thin', color: '#E1B48E' },
  };

  quebecRevisionSheet.getRange('F5:R5').merge();
  quebecRevisionSheet.getRange('F5').values = [['Publication boundary']];
  sectionHeader(quebecRevisionSheet.getRange('F5:R5'), C.amber);
  quebecRevisionSheet.getRange('F6:R10').merge();
  quebecRevisionSheet.getRange('F6').values = [
    [
      `${boundary.reason} The descriptive medians below are research diagnostics only: they must not be transferred to Alberta, applied as project contingencies, or interpreted as causal AI effects.`,
    ],
  ];
  quebecRevisionSheet.getRange('F6:R10').format = {
    fill: C.amberLight,
    font: { color: '#7B4529', size: 10 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };

  quebecRevisionSheet.getRange('A13:G13').values = [
    [
      'Asset class',
      'Projects',
      'Cost chains',
      'Median authorized cost revision',
      'Schedule chains',
      'Median authorized schedule change (months)',
      'Use status',
    ],
  ];
  header(quebecRevisionSheet.getRange('A13:G13'));
  const byAsset = quebecRevisions.descriptive_statistics.by_asset_class;
  quebecRevisionSheet.getRange(`A14:G${13 + byAsset.length}`).values = byAsset.map(
    (item) => {
      const assetCoverage = quebecRevisions.asset_class_coverage.find(
        (coverageItem) => coverageItem.asset_class === item.asset_class,
      );
      return [
        labelize(item.asset_class),
        assetCoverage?.project_count ?? 0,
        assetCoverage?.cost_reconciled_count ?? 0,
        item.authorized_cost_variance_fraction.median,
        assetCoverage?.schedule_reconciled_count ?? 0,
        item.authorized_schedule_change_months.median,
        'RESEARCH CANDIDATE',
      ];
    },
  );
  const assetLastRow = 13 + byAsset.length;
  quebecRevisionSheet.getRange(`D14:D${assetLastRow}`).format.numberFormat =
    '0.0%';
  quebecRevisionSheet.getRange(`F14:F${assetLastRow}`).format.numberFormat =
    '0.0';
  quebecRevisionSheet.getRange(`G14:G${assetLastRow}`).format = {
    fill: C.soft,
    font: { bold: true, color: C.muted, size: 8 },
  };
  const assetTable = quebecRevisionSheet.tables.add(
    `A13:G${assetLastRow}`,
    true,
    'QuebecRevisionAssetSummaryTable',
  );
  assetTable.style = 'TableStyleMedium2';

  const dashboardSource = currentSourceRegistry.sources.find(
    (item) => item.source_id === 'QUEBEC_PQI_PROJECT_DASHBOARD',
  );
  const dictionarySource = currentSourceRegistry.sources.find(
    (item) => item.source_id === 'QUEBEC_PQI_DATA_DICTIONARY',
  );
  quebecRevisionSheet.getRange('I13:R13').merge();
  quebecRevisionSheet.getRange('I13').values = [['Source contract and reproducibility']];
  sectionHeader(quebecRevisionSheet.getRange('I13:R13'));
  quebecRevisionSheet.getRange('I14:R20').merge();
  quebecRevisionSheet.getRange('I14').values = [
    [
      `Dashboard: ${dashboardSource?.canonical_url ?? 'QUEBEC_PQI_PROJECT_DASHBOARD'}\nDashboard CSV: ${dashboardSource?.retrieval_url ?? ''}\nField dictionary: ${dictionarySource?.retrieval_url ?? dictionarySource?.canonical_url ?? 'QUEBEC_PQI_DATA_DICTIONARY'}\nDashboard hash: ${quebecRevisions.source_files.QUEBEC_PQI_PROJECT_DASHBOARD.content_hash}\nDictionary hash: ${quebecRevisions.source_files.QUEBEC_PQI_DATA_DICTIONARY.content_hash}\nContract: no_projet is stable through the lifecycle; cout_total is current authorized cost; suivi_modifications contains authorized lifecycle changes and effective dates. Parser evidence status: ${quebecRevisions.evidence_status}.`,
    ],
  ];
  quebecRevisionSheet.getRange('I14:R20').format = {
    fill: C.soft,
    font: { name: 'Aptos Mono', color: C.muted, size: 8 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: C.line },
  };

  quebecRevisionSheet.getRange('A24:R24').values = [
    [
      'Project ID',
      'Project name',
      'Asset class',
      'Stage',
      'Region',
      'Municipality',
      'Cost events',
      'Cost chain',
      'Baseline authorized cost (CAD)',
      'Current authorized cost (CAD)',
      'Authorized variance (CAD)',
      'Authorized variance (%)',
      'Schedule events',
      'Schedule chain',
      'Baseline completion',
      'Current completion',
      'Schedule change (months)',
      'Quality flags',
    ],
  ];
  header(quebecRevisionSheet.getRange('A24:R24'));
  const firstProjectRow = 25;
  const lastProjectRow = firstProjectRow + quebecRevisionRows.length - 1;
  quebecRevisionSheet.getRange(`A${firstProjectRow}:R${lastProjectRow}`).values =
    quebecRevisionRows.map((row) => [
      row.project_id,
      row.project_name,
      labelize(row.asset_class),
      row.stage_source_text,
      row.region,
      row.municipality,
      numberOrNull(row.cost_revision_event_count),
      yesNo(row.cost_revision_chain_reconciles),
      numberOrNull(row.baseline_authorized_cost_cad),
      numberOrNull(row.current_authorized_cost_cad),
      numberOrNull(row.authorized_cost_variance_cad),
      numberOrNull(row.authorized_cost_variance_percent),
      numberOrNull(row.schedule_revision_event_count),
      yesNo(row.schedule_revision_chain_reconciles),
      monthOrNull(row.baseline_completion_month),
      monthOrNull(row.current_completion_month),
      numberOrNull(row.authorized_schedule_change_months),
      row.quality_flags,
    ]);
  quebecRevisionSheet.getRange(`I${firstProjectRow}:K${lastProjectRow}`).format.numberFormat =
    '$#,##0';
  quebecRevisionSheet.getRange(`L${firstProjectRow}:L${lastProjectRow}`).format.numberFormat =
    '0.0%';
  quebecRevisionSheet.getRange(`O${firstProjectRow}:P${lastProjectRow}`).format.numberFormat =
    'mmm yyyy';
  quebecRevisionSheet.getRange(`Q${firstProjectRow}:Q${lastProjectRow}`).format.numberFormat =
    '0';
  quebecRevisionSheet.getRange(`H${firstProjectRow}:H${lastProjectRow}`).conditionalFormats.add(
    'containsText',
    {
      text: 'NO',
      format: { fill: C.amberLight, font: { color: '#8A4826' } },
    },
  );
  quebecRevisionSheet.getRange(`N${firstProjectRow}:N${lastProjectRow}`).conditionalFormats.add(
    'containsText',
    {
      text: 'NO',
      format: { fill: C.amberLight, font: { color: '#8A4826' } },
    },
  );
  quebecRevisionSheet.getRange(`R${firstProjectRow}:R${lastProjectRow}`).format.font = {
    name: 'Aptos Mono',
    color: C.muted,
    size: 8,
  };
  const projectTable = quebecRevisionSheet.tables.add(
    `A24:R${lastProjectRow}`,
    true,
    'QuebecAuthorizedRevisionProjectsTable',
  );
  projectTable.style = 'TableStyleMedium2';
  quebecRevisionSheet.freezePanes.freezeRows(24);
  quebecRevisionSheet.freezePanes.freezeColumns(2);
  setWidths(
    quebecRevisionSheet,
    {
      A: 16,
      B: 50,
      C: 31,
      D: 24,
      E: 24,
      F: 24,
      G: 13,
      H: 13,
      I: 22,
      J: 22,
      K: 20,
      L: 18,
      M: 15,
      N: 15,
      O: 20,
      P: 20,
      Q: 18,
      R: 48,
    },
    lastProjectRow,
  );
}

function buildQuebecVintages() {
  titleBand(
    quebecVintageSheet,
    'Quebec archive milestones and selection diagnostics',
    '69 official CSV resources · 10 threshold-aware milestones · incomplete panel · exit causes unknown',
    'O',
  );

  const boundary = quebecLongitudinal.publication_boundary;
  quebecVintageSheet.getRange('A5:D5').values = [
    ['Archive coverage', 'Count / status', 'Panel diagnostic', 'Count / status'],
  ];
  header(quebecVintageSheet.getRange('A5:D5'));
  quebecVintageSheet.getRange('A6:D10').values = [
    [
      'Selected milestones',
      quebecLongitudinal.vintage_count,
      'Official CSV resources',
      quebecVintageContract.catalog_csv_resource_count,
    ],
    [
      'Unique stable project IDs',
      quebecLongitudinal.unique_project_count,
      'Snapshot-project observations',
      quebecLongitudinal.snapshot_observation_count,
    ],
    [
      'Present in latest snapshot',
      quebecLongitudinal.present_in_latest_project_count,
      'Absent from latest snapshot',
      quebecLongitudinal.absent_from_latest_project_count,
    ],
    [
      'Interval disappearance',
      quebecLongitudinal.project_with_interval_disappearance_count,
      'Milestone reentry',
      quebecLongitudinal.project_with_milestone_reentry_count,
    ],
    [
      'Complete panel authorized',
      boundary.complete_longitudinal_panel_authorized ? 'YES' : 'NO',
      'Independent parser review complete',
      quebecParserReview.publication_boundary.independent_parser_review_complete
        ? 'YES'
        : 'NO',
    ],
  ];
  quebecVintageSheet.getRange('A6:A10').format.font = {
    bold: true,
    color: C.ink,
  };
  quebecVintageSheet.getRange('C6:C10').format.font = {
    bold: true,
    color: C.ink,
  };
  quebecVintageSheet.getRange('B10:D10').format = {
    fill: C.amberLight,
    font: { bold: true, color: '#8A4826' },
    borders: { preset: 'inside', style: 'thin', color: '#E1B48E' },
  };

  quebecVintageSheet.getRange('F5:O5').merge();
  quebecVintageSheet.getRange('F5').values = [['Interpretation boundary']];
  sectionHeader(quebecVintageSheet.getRange('F5:O5'), C.amber);
  quebecVintageSheet.getRange('F6:O10').merge();
  quebecVintageSheet.getRange('F6').values = [
    [
      `${boundary.reason} A disappearance may reflect completion, cancellation, renaming, merger, threshold scope or another dashboard change. It is not an observed exit outcome. The ${quebecParserReview.sample_project_count}-project review packet is prepared, but reviewer fields remain blank and the parser is not authorized for decision use.`,
    ],
  ];
  quebecVintageSheet.getRange('F6:O10').format = {
    fill: C.amberLight,
    font: { color: '#7B4529', size: 10 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };

  quebecVintageSheet.getRange('A13:H13').values = [
    [
      'Snapshot date',
      'Threshold regime',
      'Projects',
      'Raw rows',
      'Duplicates collapsed',
      'Selection reasons',
      'Resource ID',
      'Content hash',
    ],
  ];
  header(quebecVintageSheet.getRange('A13:H13'));
  const vintageLastRow = 13 + quebecLongitudinal.vintages.length;
  quebecVintageSheet.getRange(`A14:H${vintageLastRow}`).values =
    quebecLongitudinal.vintages.map((vintage) => {
      const contractVintage = quebecVintageContract.selected_vintages.find(
        (item) => item.snapshot_date === vintage.snapshot_date,
      );
      return [
        vintage.snapshot_date,
        vintage.threshold_regime === 'cad_50m_and_over'
          ? 'CAD 50M+'
          : 'CAD 20M+',
        vintage.project_count,
        vintage.raw_row_count,
        vintage.publisher_duplicate_rows_collapsed,
        contractVintage?.selection_reasons.join(' | ') ?? '',
        vintage.resource_id,
        vintage.content_hash,
      ];
    });
  quebecVintageSheet.getRange(`G14:H${vintageLastRow}`).format.font = {
    name: 'Aptos Mono',
    color: C.muted,
    size: 8,
  };
  const vintageTable = quebecVintageSheet.tables.add(
    `A13:H${vintageLastRow}`,
    true,
    'QuebecMilestoneVintagesTable',
  );
  vintageTable.style = 'TableStyleMedium2';

  const transition = quebecLongitudinal.threshold_transition;
  quebecVintageSheet.getRange('J13:O13').merge();
  quebecVintageSheet.getRange('J13').values = [['November 2020 threshold transition']];
  sectionHeader(quebecVintageSheet.getRange('J13:O13'));
  quebecVintageSheet.getRange('J14:O18').values = [
    ['Last pre-threshold snapshot', transition.last_pre_threshold_snapshot, '', 'First post-threshold snapshot', transition.first_post_threshold_snapshot, ''],
    ['Pre-threshold projects', transition.last_pre_threshold_project_count, '', 'Post-threshold projects', transition.first_post_threshold_project_count, ''],
    ['Continuing IDs', transition.continuing_project_count, '', 'Newly observed IDs', transition.newly_observed_project_count, ''],
    ['No longer observed IDs', transition.no_longer_observed_project_count, '', 'Pure threshold cohort?', 'NO', ''],
    ['Interpretation', transition.interpretation, '', '', '', ''],
  ];
  quebecVintageSheet.getRange('J14:J18').format.font = { bold: true, color: C.ink };
  quebecVintageSheet.getRange('M14:M17').format.font = { bold: true, color: C.ink };
  quebecVintageSheet.getRange('J18:O18').merge();
  quebecVintageSheet.getRange('J18').values = [
    [`Interpretation — ${transition.interpretation}`],
  ];
  quebecVintageSheet.getRange('J18:O18').format = {
    fill: C.soft,
    font: { color: C.muted, size: 9 },
    wrapText: true,
  };

  quebecVintageSheet.getRange('J20:O20').merge();
  quebecVintageSheet.getRange('J20').values = [['Parser review state']];
  sectionHeader(quebecVintageSheet.getRange('J20:O20'), C.amber);
  quebecVintageSheet.getRange('J21:O24').values = [
    ['Package status', quebecParserReview.review_status, '', 'Selected projects', quebecParserReview.sample_project_count, ''],
    ['Sampling fraction', quebecParserReview.sampling_fraction, '', 'Source projects', quebecParserReview.source_project_count, ''],
    ['Independent review complete', 'NO', '', 'Parser decision-use authorized', 'NO', ''],
    ['Review output hash', quebecParserReview.review_output.content_hash, '', '', '', ''],
  ];
  quebecVintageSheet.getRange('J21:J24').format.font = { bold: true, color: C.ink };
  quebecVintageSheet.getRange('M21:M23').format.font = { bold: true, color: C.ink };
  quebecVintageSheet.getRange('K22').format.numberFormat = '0.0%';
  quebecVintageSheet.getRange('K23:N23').format = {
    fill: C.amberLight,
    font: { bold: true, color: '#8A4826' },
  };
  quebecVintageSheet.getRange('K24:O24').merge();
  quebecVintageSheet.getRange('K24').format.font = {
    name: 'Aptos Mono',
    color: C.muted,
    size: 8,
  };

  quebecVintageSheet.getRange('A27:O27').values = [
    [
      'Project ID',
      'Latest project name',
      'Asset class',
      'First observed',
      'Last observed',
      'Milestones',
      'In latest',
      'Pre-threshold',
      'Post-threshold',
      'Disappearances',
      'Reentries',
      'Cost pairs changed',
      'Completion pairs changed',
      'Presence pattern',
      'Quality flags',
    ],
  ];
  header(quebecVintageSheet.getRange('A27:O27'));
  const firstLifecycleRow = 28;
  const lastLifecycleRow = firstLifecycleRow + quebecLifecycleRows.length - 1;
  quebecVintageSheet.getRange(`A${firstLifecycleRow}:O${lastLifecycleRow}`).values =
    quebecLifecycleRows.map((row) => [
      row.project_id,
      row.latest_project_name,
      labelize(row.latest_asset_class),
      row.first_observed_snapshot,
      row.last_observed_snapshot,
      numberOrNull(row.observed_milestone_count),
      yesNo(row.present_in_latest_snapshot),
      yesNo(row.observed_pre_threshold),
      yesNo(row.observed_post_threshold),
      numberOrNull(row.interval_disappearance_count),
      numberOrNull(row.milestone_reentry_count),
      numberOrNull(row.authorized_cost_change_pair_count),
      numberOrNull(row.completion_month_change_pair_count),
      row.presence_pattern,
      row.quality_flags,
    ]);
  quebecVintageSheet.getRange(`G${firstLifecycleRow}:G${lastLifecycleRow}`).conditionalFormats.add(
    'containsText',
    {
      text: 'NO',
      format: { fill: C.amberLight, font: { color: '#8A4826' } },
    },
  );
  quebecVintageSheet.getRange(`N${firstLifecycleRow}:O${lastLifecycleRow}`).format.font = {
    name: 'Aptos Mono',
    color: C.muted,
    size: 8,
  };
  const lifecycleTable = quebecVintageSheet.tables.add(
    `A27:O${lastLifecycleRow}`,
    true,
    'QuebecMilestoneProjectLifecyclesTable',
  );
  lifecycleTable.style = 'TableStyleMedium2';
  quebecVintageSheet.freezePanes.freezeRows(27);
  quebecVintageSheet.freezePanes.freezeColumns(2);
  setWidths(
    quebecVintageSheet,
    {
      A: 16,
      B: 48,
      C: 31,
      D: 16,
      E: 16,
      F: 12,
      G: 12,
      H: 14,
      I: 15,
      J: 16,
      K: 12,
      L: 17,
      M: 22,
      N: 18,
      O: 48,
    },
    lastLifecycleRow,
  );
}

function buildSources() {
  titleBand(
    sources,
    'Current research source register',
    `All ${currentSourceRegistry.sources.length} registry sources · public release membership shown separately`,
    'J',
  );
  sources.getRange('A4:J4').values = [
    [
      'Source ID',
      'Title',
      'Publisher',
      'Domain',
      'Geography',
      'As-of date',
      'Registry status',
      'Evidence status',
      `In release ${release.manifest.version}`,
      'Canonical URL',
    ],
  ];
  header(sources.getRange('A4:J4'));
  const releaseSourceIds = new Set(
    release.sources.map((source) => source.source_id),
  );
  const sourceLastRow = 4 + currentSourceRegistry.sources.length;
  sources.getRange(`A5:J${sourceLastRow}`).values =
    currentSourceRegistry.sources.map((item) => [
      item.source_id,
      item.title,
      item.publisher,
      labelize(item.domain),
      item.geography,
      new Date(`${item.as_of_date}T00:00:00Z`),
      item.status,
      item.evidence_status,
      releaseSourceIds.has(item.source_id) ? 'YES' : 'NO',
      item.canonical_url,
    ]);
  sources.getRange(`F5:F${sourceLastRow}`).format.numberFormat = 'yyyy-mm-dd';
  sources.getRange(`I5:I${sourceLastRow}`).conditionalFormats.add(
    'containsText',
    {
      text: 'YES',
      format: {
        fill: C.tealLight,
        font: { color: C.tealDark, bold: true },
      },
    },
  );
  sources.getRange(`I5:I${sourceLastRow}`).conditionalFormats.add(
    'containsText',
    {
      text: 'NO',
      format: {
        fill: C.soft,
        font: { color: C.muted, bold: true },
      },
    },
  );
  const table = sources.tables.add(
    `A4:J${sourceLastRow}`,
    true,
    'SourceRegisterTable',
  );
  table.style = 'TableStyleMedium2';
  sources.freezePanes.freezeRows(4);
  sources.freezePanes.freezeColumns(1);
  setWidths(
    sources,
    {
      A: 31,
      B: 48,
      C: 26,
      D: 28,
      E: 42,
      F: 14,
      G: 16,
      H: 17,
      I: 18,
      J: 48,
    },
    sourceLastRow,
  );
}

function buildReleaseChecks() {
  titleBand(
    checks,
    'Workbook identity and reconciliation',
    `Workbook ${workbookBuildVersion} · public release basis ${release.manifest.version}`,
    'D',
  );
  checks.getRange('A5:B13').values = [
    ['Public release basis', release.manifest.version],
    ['Release ID', release.manifest.release_id],
    ['Schema version', release.manifest.schema_version],
    ['Model version', release.manifest.model_version],
    ['Engine version', release.manifest.engine_version],
    ['Parameter set ID', release.manifest.parameter_set_id],
    ['Code commit', release.manifest.code_commit],
    ['Input manifest hash', release.manifest.input_manifest_hash],
    ['Dirty worktree at build', release.manifest.dirty_worktree],
  ];
  checks.getRange('A5:A13').format.font = { bold: true };
  checks.getRange('B11:B12').format.font = {
    name: 'Aptos Mono',
    size: 9,
    color: C.muted,
  };
  checks.getRange('A15:C15').values = [['Check', 'Result', 'Expected']];
  header(checks.getRange('A15:C15'));
  const checkLabels = [
    ['Component shares sum to 100%', 'PASS'],
    ['Annual profile sums to 100%', 'PASS'],
    ['Timeline capex equals scenario total', 'PASS'],
    ['Dashboard core count matches project register', 'PASS'],
    ['Dashboard transfer proxy matches central case', 'PASS'],
    ['All pressure rows are scenario-labelled', 'PASS'],
    ['Release was built from a clean worktree', 'PASS'],
    ['Suppressed labour values remain flagged', 'PASS'],
    ['Canada labour coverage reconciles to release', 'PASS'],
    ['Workforce stock coverage reconciles to release', 'PASS'],
    ['Cross-vintage diagnostic formulas reconcile', 'PASS'],
    ['Material-screen rows reconcile to release', 'PASS'],
    ['Project-exposure rows reconcile to release', 'PASS'],
    ['Power evidence reconciles and transmission remains unknown', 'PASS'],
    ['Cost-baseline gate rows reconcile to the model artifact', 'PASS'],
    ['Public cost projection remains unauthorized', 'PASS'],
    ['Default project-cost result fails closed with blank outputs', 'PASS'],
    ['Provincial project exposure remains unauthorized', 'PASS'],
    ['Provincial BCPI projections remain unauthorized', 'PASS'],
    ['Provincial power profile remains unauthorized', 'PASS'],
    ['Weekly digest cannot change the model automatically', 'PASS'],
    ['AI-attributable effect remains unauthorized and null', 'PASS'],
    ['Regional investment-control panel reconciles to artifact', 'PASS'],
    ['CanadaBuys procurement intake reconciles and remains non-authorizing', 'PASS'],
    ['Edmonton permit proxy reconciles and remains non-authorizing', 'PASS'],
    ['Audited outcome references reconcile and remain non-authorizing', 'PASS'],
    ['Quebec authorized-revision chains reconcile and remain non-authorizing', 'PASS'],
    ['Quebec milestone panel and parser-review package reconcile and remain non-authorizing', 'PASS'],
  ];
  checks.getRange('A16:C43').values = checkLabels.map(([label, expected]) => [
    label,
    null,
    expected,
  ]);
  checks.getRange('B16').formulas = [
    ['=IF(ABS(\'Assumptions\'!B19-1)<0.000001,"PASS","FAIL")'],
  ];
  checks.getRange('B17').formulas = [
    ['=IF(ABS(SUM(\'Scenario Timeline\'!B5:B14)-1)<0.000001,"PASS","FAIL")'],
  ];
  checks.getRange('B18').formulas = [
    ['=IF(ABS(\'Scenario Timeline\'!C15-\'Assumptions\'!B5)<1,"PASS","FAIL")'],
  ];
  checks.getRange('B19').formulas = [
    [
      `=IF(Dashboard!D6=COUNTIF('AI Projects'!$M$5:$M$${4 + release.baseline.projects.length},"core_data_centre"),"PASS","FAIL")`,
    ],
  ];
  checks.getRange('B20').formulas = [
    ['=IF(ABS(Dashboard!J6*1000-\'Assumptions\'!K24)<0.1,"PASS","FAIL")'],
  ];
  checks.getRange('B21').formulas = [
    [
      `=IF(COUNTIF('Pressure Results'!$J$5:$J$${4 + release.scenario.trade_pressure_order.length + release.scenario.public_delivery_pressure_order.length},"scenario")=ROWS('Pressure Results'!$J$5:$J$${4 + release.scenario.trade_pressure_order.length + release.scenario.public_delivery_pressure_order.length}),"PASS","FAIL")`,
    ],
  ];
  checks.getRange('B22').formulas = [['=IF(B13=FALSE,"PASS","FAIL")']];
  checks.getRange('B23').formulas = [
    [
      `=IF(COUNTIF('Labour Availability'!$O$5:$O$${4 + labourRows.length},"FAIL")=0,"PASS","FAIL")`,
    ],
  ];
  const canadaCoverageEnd =
    4 + release.baseline.labour_availability_canada.coverage.length;
  const canadaObservationStart = canadaCoverageEnd + 5;
  const canadaObservationEnd =
    canadaObservationStart +
    release.baseline.labour_availability_canada.observations.length -
    1;
  checks.getRange('B24').formulas = [
    [
      `=IF(AND(COUNTIF('Labour Canada'!$I$5:$I$${canadaCoverageEnd},"FAIL")=0,COUNTIF('Labour Canada'!$Q$${canadaObservationStart}:$Q$${canadaObservationEnd},"FAIL")=0),"PASS","FAIL")`,
    ],
  ];
  const workforceCoverageEnd =
    4 + release.baseline.labour_workforce_stock_canada.coverage.length;
  const workforceObservationStart = workforceCoverageEnd + 5;
  const workforceObservationEnd =
    workforceObservationStart +
    release.baseline.labour_workforce_stock_canada.observations.length -
    1;
  checks.getRange('B25').formulas = [
    [
      `=IF(AND(COUNTIF('Workforce Stock'!$J$5:$J$${workforceCoverageEnd},"FAIL")=0,COUNTIF('Workforce Stock'!$S$${workforceObservationStart}:$S$${workforceObservationEnd},"FAIL")=0),"PASS","FAIL")`,
    ],
  ];
  const diagnosticWarningRow =
    4 +
    labourPressure.trade_diagnostics.filter(
      (item) => item.geography_id === 'PR_48',
    ).length +
    2;
  const diagnosticObservationStart = diagnosticWarningRow + 3;
  const diagnosticObservationEnd =
    diagnosticObservationStart +
    labourPressure.occupation_diagnostics.length -
    1;
  checks.getRange('B26').formulas = [
    [
      `=IF(COUNTIF('Labour Diagnostic'!$N$${diagnosticObservationStart}:$N$${diagnosticObservationEnd},"FAIL")=0,"PASS","FAIL")`,
    ],
  ];
  checks.getRange('B27').formulas = [
    [
      `=IF(ROWS('Material Screen'!$A$5:$A$${4 + materialRows.length})=${release.material_cost_screen.observation_count},"PASS","FAIL")`,
    ],
  ];
  checks.getRange('B28').formulas = [
    [
      `=IF(AND(ROWS('Project Exposure'!$A$15:$A$${14 + projectExposureRows.length})=${release.public_project_exposure.screened_project_count},SUM('Project Exposure'!$B$5:$B$${4 + release.public_project_exposure.asset_class_summaries.length})=${release.public_project_exposure.screened_project_count}),"PASS","FAIL")`,
    ],
  ];
  checks.getRange('B29').formulas = [
    [
      `=IF(AND('Power Evidence'!B10="PASS",'Power Evidence'!B9="UNKNOWN"),"PASS","FAIL")`,
    ],
  ];
  checks.getRange('B30').formulas = [
    [
      '=IF(AND(ROWS(\'Cost Baseline\'!$A$11:$A$50)=40,COUNTIF(\'Cost Baseline\'!$F$11:$F$50,"gate_passed")=1),"PASS","FAIL")',
    ],
  ];
  checks.getRange('B31').formulas = [
    ['=IF(\'Cost Baseline\'!B6="NO","PASS","FAIL")'],
  ];
  checks.getRange('B32').formulas = [
    [
      '=IF(AND(LEFT(\'Project Cost Check\'!B26,8)="WITHHELD",\'Project Cost Check\'!B29="",\'Project Cost Check\'!B30=""),"PASS","FAIL")',
    ],
  ];
  checks.getRange('B33').formulas = [
    ['=IF(\'Canada Expansion\'!B8="NO","PASS","FAIL")'],
  ];
  checks.getRange('B34').formulas = [
    ['=IF(\'Canada Expansion\'!B12="NO","PASS","FAIL")'],
  ];
  checks.getRange('B35').formulas = [
    ['=IF(\'Canada Expansion\'!B16="NO","PASS","FAIL")'],
  ];
  checks.getRange('B36').formulas = [
    ['=IF(\'Canada Expansion\'!B20="NO","PASS","FAIL")'],
  ];
  checks.getRange('B37').formulas = [
    [
      '=IF(AND(\'Attribution Gate\'!B9="NO",\'Attribution Gate\'!B10="",\'Attribution Gate\'!B11="",\'Attribution Gate\'!B12=""),"PASS","FAIL")',
    ],
  ];
  const investmentControlLastRow = 10 + investmentControlRows.length;
  checks.getRange('B38').formulas = [
    [
      `=IF(AND(ROWS('Investment Controls'!$A$11:$A$${investmentControlLastRow})=${investmentControlReport.observation_count},COUNTIF('Investment Controls'!$M$11:$M$${investmentControlLastRow},"observed")=${investmentControlReport.observation_count},COUNTIF('Investment Controls'!$N$11:$N$${investmentControlLastRow},"inferred")=${investmentControlReport.observation_count}),"PASS","FAIL")`,
    ],
  ];
  const procurementIntakeLastRow = 10 + procurementOutcomeRows.length;
  checks.getRange('B39').formulas = [
    [
      `=IF(AND(ROWS('Procurement Intake'!$A$11:$A$${procurementIntakeLastRow})=${procurementOutcomeReport.construction_linkage_count},'Procurement Intake'!A6=${procurementOutcomeReport.construction_linkage_count},'Procurement Intake'!U6=0,COUNTIF('Procurement Intake'!$R$11:$R$${procurementIntakeLastRow},"missing_required_fields")=${procurementOutcomeReport.construction_linkage_count},COUNTIF('Procurement Intake'!$S$11:$S$${procurementIntakeLastRow},"missing_required_fields")=${procurementOutcomeReport.construction_linkage_count},COUNTIF('Procurement Intake'!$T$11:$T$${procurementIntakeLastRow},"missing_compliant_bidder_count")=${procurementOutcomeReport.construction_linkage_count}),"PASS","FAIL")`,
    ],
  ];
  const permitCandidateLastRow =
    13 +
    permitProxyRows.filter(
      (row) => row.candidate_status === 'data_centre_candidate',
    ).length;
  checks.getRange('B40').formulas = [
    [
      `=IF(AND('Permit Proxy'!A6=${permitProxyReport.broad_screen_row_count},'Permit Proxy'!C6=${permitProxyReport.data_centre_candidate_count},'Permit Proxy'!G6=${permitProxyReport.explicit_ai_reference_count},'Permit Proxy'!I6=${permitProxyReport.data_centre_candidate_occupancy_date_available_count},ROWS('Permit Proxy'!$A$14:$A$${permitCandidateLastRow})=${permitProxyReport.data_centre_candidate_count},COUNTIF('Permit Proxy'!$J$14:$J$${permitCandidateLastRow},"observed")=0),"PASS","FAIL")`,
    ],
  ];
  checks.getRange('B41').formulas = [
    [
      `=IF(AND('Audited Outcomes'!B6=${auditedOutcomes.coverage_summary.named_completed_project_count},'Audited Outcomes'!B9=0,'Audited Outcomes'!B11="NO",COUNTIF('Audited Outcomes'!$K$20:$K$${19 + auditedOutcomes.cases.length},"PASS")=${auditedOutcomes.cases.length},COUNTIF('Audited Outcomes'!$N$14:$O$${13 + auditedOutcomes.cases.length},"YES")=0),"PASS","FAIL")`,
    ],
  ];
  const quebecProjectLastRow = 24 + quebecRevisionRows.length;
  checks.getRange('B42').formulas = [
    [
      `=IF(AND('Quebec Revisions'!B6=${quebecRevisions.coverage_summary.source_project_count},'Quebec Revisions'!D6=${quebecRevisions.coverage_summary.stable_lifecycle_project_id_count},'Quebec Revisions'!D7=${quebecRevisions.coverage_summary.cost_revision_chain_reconciled_project_count},'Quebec Revisions'!D8=${quebecRevisions.coverage_summary.schedule_revision_chain_reconciled_project_count},'Quebec Revisions'!B10="NO",'Quebec Revisions'!D10="NO",ROWS('Quebec Revisions'!$A$25:$A$${quebecProjectLastRow})=${quebecRevisionRows.length},COUNTIF('Quebec Revisions'!$H$25:$H$${quebecProjectLastRow},"YES")=${quebecRevisions.coverage_summary.cost_revision_chain_reconciled_project_count},COUNTIF('Quebec Revisions'!$N$25:$N$${quebecProjectLastRow},"YES")=${quebecRevisions.coverage_summary.schedule_revision_chain_reconciled_project_count}),"PASS","FAIL")`,
    ],
  ];
  const quebecLifecycleLastRow = 27 + quebecLifecycleRows.length;
  checks.getRange('B43').formulas = [
    [
      `=IF(AND('Quebec Vintages'!B6=${quebecLongitudinal.vintage_count},'Quebec Vintages'!D6=${quebecVintageContract.catalog_csv_resource_count},'Quebec Vintages'!B7=${quebecLongitudinal.unique_project_count},'Quebec Vintages'!D7=${quebecLongitudinal.snapshot_observation_count},'Quebec Vintages'!B8=${quebecLongitudinal.present_in_latest_project_count},'Quebec Vintages'!D8=${quebecLongitudinal.absent_from_latest_project_count},'Quebec Vintages'!B10="NO",'Quebec Vintages'!D10="NO",ROWS('Quebec Vintages'!$A$28:$A$${quebecLifecycleLastRow})=${quebecLifecycleRows.length},'Quebec Vintages'!N22=${quebecParserReview.source_project_count},'Quebec Vintages'!N21=${quebecParserReview.sample_project_count}),"PASS","FAIL")`,
    ],
  ];
  checks.getRange('B16:B43').conditionalFormats.add('containsText', {
    text: 'PASS',
    format: { fill: C.tealLight, font: { color: C.tealDark, bold: true } },
  });
  checks.getRange('B16:B43').conditionalFormats.add('containsText', {
    text: 'FAIL',
    format: { fill: '#FDE8E5', font: { color: '#A33D32', bold: true } },
  });
  checks.getRange('A45:D47').merge();
  checks.getRange('A45').values = [
    [
      'A public release is blocked if any check returns FAIL, if the workbook and website manifests differ, if assumptions/scenarios are presented as observations, if an AI-attributable value appears before the identification gate passes, or if a cost output appears while a required validation or independent-review gate is withheld.',
    ],
  ];
  noteBlock(checks.getRange('A45:D47'));
  setWidths(checks, { A: 59, B: 61, C: 15, D: 18 }, 51);
}

function buildDashboard() {
  titleBand(
    dashboard,
    'Alberta pilot dashboard',
    `Observed pipeline + $50B counterfactual diagnostic · workbook ${workbookBuildVersion}`,
    'L',
  );
  card(
    dashboard,
    'A5:C5',
    'A6:C7',
    'Known reported core capex',
    `='AI Projects'!C${4 + release.baseline.projects.length + 1}`,
  );
  dashboard.getRange('A6').formulas = [
    [
      `=SUMIF('AI Projects'!$M$5:$M$${4 + release.baseline.projects.length},"core_data_centre",'AI Projects'!$C$5:$C$${4 + release.baseline.projects.length})/1000000000`,
    ],
  ];
  dashboard.getRange('A6').format.numberFormat = '$0.00"B"';
  card(dashboard, 'D5:F5', 'D6:F7', 'Core facility records', '');
  dashboard.getRange('D6').formulas = [
    [
      `=COUNTIF('AI Projects'!$M$5:$M$${4 + release.baseline.projects.length},"core_data_centre")`,
    ],
  ];
  dashboard.getRange('D6').format.numberFormat = '0';
  card(dashboard, 'G5:I5', 'G6:I7', 'Central trade pressure', '');
  dashboard.getRange('G6').formulas = [["=MAX('Pressure Results'!$F$5:$F$8)"]];
  dashboard.getRange('G6').format.numberFormat = '0.00';
  card(dashboard, 'J5:L5', 'J6:L7', 'Transfer planning proxy', '');
  dashboard.getRange('J6').formulas = [["='Assumptions'!K24/1000"]];
  dashboard.getRange('J6').format.numberFormat = '0.00" GW"';

  dashboard.getRange('A9:B9').values = [['Trade', 'Central pressure']];
  header(dashboard.getRange('A9:B9'));
  release.scenario.trade_pressure_order.forEach((_, index) => {
    const row = 10 + index;
    dashboard.getRange(`A${row}`).formulas = [
      [`='Pressure Results'!B${5 + index}`],
    ];
    dashboard.getRange(`B${row}`).formulas = [
      [`='Pressure Results'!F${5 + index}`],
    ];
  });
  dashboard.getRange(
    `B10:B${9 + release.scenario.trade_pressure_order.length}`,
  ).format.numberFormat = '0.00';
  const tradeChart = dashboard.charts.add(
    'bar',
    dashboard.getRange(
      `A9:B${9 + release.scenario.trade_pressure_order.length}`,
    ),
  );
  tradeChart.title =
    'Which trades are pinched first? (diagnostic pressure score)';
  tradeChart.hasLegend = false;
  tradeChart.xAxis = { axisType: 'textAxis', textStyle: { fontSize: 9 } };
  tradeChart.yAxis = { numberFormatCode: '0.00', min: 0 };
  tradeChart.setPosition('D9', 'L22');

  const albertaLabourRows = labourPressure.trade_diagnostics
    .filter(
      (item) =>
        item.geography_id === 'PR_48' &&
        item.vacancies_per_1_000_2021_employed !== null,
    )
    .sort(
      (a, b) =>
        b.vacancies_per_1_000_2021_employed -
        a.vacancies_per_1_000_2021_employed,
    );
  dashboard.getRange('A16:B16').values = [['Recruitment screen', 'Per 1,000']];
  header(dashboard.getRange('A16:B16'));
  albertaLabourRows.forEach((_, index) => {
    const dashboardRow = 17 + index;
    const diagnosticRow = 5 + index;
    dashboard.getRange(`A${dashboardRow}`).formulas = [
      [`='Labour Diagnostic'!A${diagnosticRow}`],
    ];
    dashboard.getRange(`B${dashboardRow}`).formulas = [
      [`='Labour Diagnostic'!D${diagnosticRow}`],
    ];
  });
  dashboard.getRange(
    `B17:B${16 + albertaLabourRows.length}`,
  ).format.numberFormat = '0.00';
  const recruitmentNoteStart = 18 + albertaLabourRows.length;
  const recruitmentNoteEnd = Math.min(23, recruitmentNoteStart + 2);
  dashboard.getRange(`A${recruitmentNoteStart}:B${recruitmentNoteEnd}`).merge();
  dashboard.getRange(`A${recruitmentNoteStart}`).values = [
    ['Cross-vintage screening metric only; incomplete trades are excluded.'],
  ];
  noteBlock(
    dashboard.getRange(`A${recruitmentNoteStart}:B${recruitmentNoteEnd}`),
  );

  dashboard.getRange('A25:B25').values = [['Year', 'Total capex (CAD bn)']];
  header(dashboard.getRange('A25:B25'));
  scenarioDefinition.annual_profile.forEach((_, index) => {
    const row = 26 + index;
    dashboard.getRange(`A${row}`).formulas = [
      [`='Scenario Timeline'!A${5 + index}`],
    ];
    dashboard.getRange(`B${row}`).formulas = [
      [`='Scenario Timeline'!C${5 + index}/1000000000`],
    ];
  });
  dashboard.getRange('B26:B35').format.numberFormat = '$0.0';
  const flowChart = dashboard.charts.add('line', dashboard.getRange('A25:B35'));
  flowChart.title = 'Counterfactual annual capex flow (CAD bn)';
  flowChart.hasLegend = false;
  flowChart.xAxis = { axisType: 'textAxis', textStyle: { fontSize: 9 } };
  flowChart.yAxis = { numberFormatCode: '$0.0', min: 0 };
  flowChart.setPosition('D25', 'L39');

  dashboard.getRange('A41:C42').merge();
  dashboard.getRange('A41').values = [
    ['Four- to five-year project cost outlook'],
  ];
  dashboard.getRange('A41:C42').format = {
    fill: C.amber,
    font: { bold: true, color: C.white, size: 11 },
    wrapText: true,
    verticalAlignment: 'center',
    horizontalAlignment: 'center',
  };
  dashboard.getRange('D41:L42').merge();
  dashboard.getRange('D41').formulas = [["='Project Cost Check'!B26"]];
  dashboard.getRange('D41:L42').format = {
    fill: C.amberLight,
    font: { bold: true, color: '#8A4826', size: 12 },
    wrapText: true,
    verticalAlignment: 'center',
    horizontalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };

  dashboard.getRange('A44:L47').merge();
  dashboard.getRange('A44').values = [
    [
      'WITHHELD COST OUTPUTS + UNCALIBRATED STRUCTURAL DIAGNOSTIC: only 1 of 40 reference-class horizon checks passes, and no public project-cost projection is authorized. Four- and five-year Alberta health and school results remain blank. Pressure scores are mechanisms, not percentages or delay estimates. Additional transmission for the $50B case and every AI-attributable cost or schedule increment remain unknown.',
    ],
  ];
  dashboard.getRange('A44:L47').format = {
    fill: C.amberLight,
    font: { color: '#7B4529', size: 10 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#E1B48E' },
  };
  dashboard.getRange('A48:L48').merge();
  dashboard.getRange('A48').values = [
    [`Release hash: ${release.manifest.input_manifest_hash}`],
  ];
  dashboard.getRange('A48').format = {
    font: { name: 'Aptos Mono', size: 8, color: C.muted },
    horizontalAlignment: 'left',
  };
  dashboard.freezePanes.freezeRows(4);
  setWidths(
    dashboard,
    {
      A: 18,
      B: 18,
      C: 4,
      D: 15,
      E: 15,
      F: 15,
      G: 15,
      H: 15,
      I: 15,
      J: 15,
      K: 15,
      L: 15,
    },
    48,
  );
}

function titleBand(sheet, title, subtitle, endColumn) {
  sheet.getRange(`A1:${endColumn}2`).merge();
  sheet.getRange('A1').values = [[title]];
  sheet.getRange(`A1:${endColumn}2`).format = {
    fill: C.navy,
    font: { name: 'Aptos Display', size: 22, bold: true, color: C.white },
    verticalAlignment: 'center',
    horizontalAlignment: 'left',
  };
  sheet.getRange(`A3:${endColumn}3`).merge();
  sheet.getRange('A3').values = [[subtitle]];
  sheet.getRange(`A3:${endColumn}3`).format = {
    fill: C.navy2,
    font: { size: 10, color: '#B7D9D2' },
    verticalAlignment: 'center',
  };
  sheet.getRange('A1').format.rowHeight = 28;
  sheet.getRange('A2').format.rowHeight = 28;
  sheet.getRange('A3').format.rowHeight = 21;
}

function header(range) {
  range.format = {
    fill: C.tealDark,
    font: { bold: true, color: C.white, size: 10 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'inside', style: 'thin', color: '#79A9A0' },
  };
  range.format.rowHeight = 28;
}

function sectionHeader(range, fill = C.tealDark) {
  range.format = {
    fill,
    font: { bold: true, color: C.white, size: 11 },
    verticalAlignment: 'center',
  };
}

function noteBlock(range) {
  range.format = {
    fill: C.soft,
    font: { color: C.muted, size: 10 },
    wrapText: true,
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: C.line },
  };
}

function inputStyle(range) {
  range.format = {
    fill: '#EAF3F8',
    font: { color: C.blueInput },
    borders: { preset: 'outside', style: 'thin', color: '#B7CDD9' },
  };
}

function card(sheet, labelRange, valueRange, label, formula) {
  sheet.getRange(labelRange).merge();
  sheet.getRange(labelRange.split(':')[0]).values = [[label]];
  sheet.getRange(labelRange).format = {
    fill: C.tealLight,
    font: { bold: true, color: C.tealDark, size: 9 },
    horizontalAlignment: 'center',
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#B9CEC7' },
  };
  sheet.getRange(valueRange).merge();
  if (formula) sheet.getRange(valueRange.split(':')[0]).formulas = [[formula]];
  sheet.getRange(valueRange).format = {
    fill: C.white,
    font: { bold: true, color: C.ink, size: 21 },
    horizontalAlignment: 'center',
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: '#B9CEC7' },
  };
}

function setWidths(sheet, widths, maxRow) {
  for (const [column, width] of Object.entries(widths))
    sheet.getRange(`${column}1:${column}${maxRow}`).format.columnWidth = width;
  sheet.getRange(`A1:${Object.keys(widths).at(-1)}${maxRow}`).format.wrapText =
    true;
}

function labelize(value) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function provinceLabel(geographyId) {
  return (
    {
      PR_24: 'Quebec',
      PR_35: 'Ontario',
      PR_48: 'Alberta',
      PR_59: 'British Columbia',
    }[geographyId] ?? geographyId
  );
}

function tradeLabel(nodeId) {
  return (
    {
      trade_concrete: 'Concrete',
      trade_electricians: 'Electricians',
      trade_hvac: 'HVAC',
      trade_power_line: 'Power line',
    }[nodeId] ?? labelize(nodeId.replace('trade_', ''))
  );
}

function numberOrNull(value) {
  return value === '' ? null : Number(value);
}

function dateOrNull(value) {
  return value === '' ? null : new Date(`${value}T00:00:00Z`);
}

function monthOrNull(value) {
  return value === '' ? null : new Date(`${value}-01T00:00:00Z`);
}

function yesNo(value) {
  return String(value).toLowerCase() === 'true' ? 'YES' : 'NO';
}

function powerSourceUrl(sourceId) {
  if (sourceId.includes('AESO_DATA_CENTRE_UPDATE_2025_09')) {
    return 'https://www.aeso.ca/assets/Uploads/grid/Data-Centre/AESO-Data-Centre-Update-September-2025.pdf';
  }
  if (sourceId.includes('AESO_INTERIM_LARGE_LOAD_2025_06')) {
    return 'https://www.aeso.ca/aeso/newsroom/aeso-announces-interim-approach-to-large-load-connections/';
  }
  return 'https://www.aeso.ca/grid/connecting-to-the-grid/large-load-projects/';
}

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((headerName, index) => [headerName, values[index] ?? '']),
    );
  });
}

function parseCsvLine(line) {
  const output = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      output.push(value);
      value = '';
    } else {
      value += character;
    }
  }
  output.push(value);
  return output;
}
