import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const threadId = '01a0579f-936b-77b3-93e5-be6035628b16';
const outputDir = path.join(projectRoot, 'outputs', threadId);
const previewDir = path.join(scriptDir, 'previews');

const release = JSON.parse(await fs.readFile(path.join(projectRoot, 'public', 'data', 'latest.json'), 'utf8'));
const outputPath = path.join(outputDir, `AIIO_Alberta_Pilot_${release.manifest.version}.xlsx`);
const bcpiRows = parseCsv(await fs.readFile(path.join(projectRoot, 'data', 'processed', 'bcpi_alberta.csv'), 'utf8'));
const labourRows = parseCsv(await fs.readFile(path.join(projectRoot, 'data', 'processed', 'labour_availability_alberta.csv'), 'utf8'));
const scenarioDefinition = JSON.parse(await fs.readFile(path.join(projectRoot, 'data', 'scenarios', 'alberta_50b_counterfactual_v0.2.json'), 'utf8'));
const powerDefinition = JSON.parse(await fs.readFile(path.join(projectRoot, 'data', 'scenarios', 'alberta_power_overlay_v0.1.json'), 'utf8'));

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

for (const sheet of [readme, dashboard, assumptions, timeline, pressure, sensitivity, powerOverlay, projects, bcpi, labour, sources, checks]) {
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

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const inspectDashboard = await workbook.inspect({
  kind: 'table',
  range: 'Dashboard!A1:L44',
  include: 'values,formulas',
  tableMaxRows: 44,
  tableMaxCols: 12,
});
console.log(inspectDashboard.ndjson);

const inspectChecks = await workbook.inspect({
  kind: 'table',
  range: 'Release Checks!A1:D27',
  include: 'values,formulas',
  tableMaxRows: 27,
  tableMaxCols: 4,
});
console.log(inspectChecks.ndjson);

const errors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 300 },
  summary: 'final formula error scan',
});
console.log(errors.ndjson);

const previewRanges = {
  'Read Me': 'A1:H36',
  Dashboard: 'A1:L44',
  Assumptions: 'A1:K38',
  'Scenario Timeline': 'A1:H17',
  'Pressure Results': 'A1:L20',
  Sensitivity: 'A1:M18',
  'Power Overlay': 'A1:J36',
  'AI Projects': 'A1:Q18',
  'BCPI Data': 'A1:I24',
  'Labour Availability': 'A1:O32',
  Sources: 'A1:H15',
  'Release Checks': 'A1:D27',
};
for (const [sheetName, range] of Object.entries(previewRanges)) {
  const preview = await workbook.render({ sheetName, range, scale: 1, format: 'png' });
  await fs.writeFile(
    path.join(previewDir, `${sheetName.replaceAll(' ', '_').toLowerCase()}.png`),
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(JSON.stringify({ outputPath, previewDir }));

function buildReadMe() {
  titleBand(readme, 'AI Infrastructure Impact Observatory Canada', `Alberta pilot workbook · Release ${release.manifest.version}`, 'H');
  readme.getRange('A5:H5').merge();
  readme.getRange('A5').values = [['Purpose']];
  sectionHeader(readme.getRange('A5:H5'));
  readme.getRange('A6:H8').merge();
  readme.getRange('A6').values = [[
    'This workbook is an auditable publication component of AIIO Canada. It reproduces selected release outputs and exposes scenario assumptions with formulas. The evidence registry, analytical code and immutable release manifest remain the system of record.',
  ]];
  noteBlock(readme.getRange('A6:H8'));

  readme.getRange('A10:B10').values = [['Evidence status', 'Meaning']];
  header(readme.getRange('A10:B10'));
  readme.getRange('A11:B14').values = [
    ['Observed', 'Directly reported by an identified public source.'],
    ['Inferred', 'Derived through a disclosed transformation or classification.'],
    ['Assumed', 'Selected parameter with rationale and sensitivity range.'],
    ['Scenario', 'Counterfactual input or output; not a forecast.'],
  ];
  readme.getRange('A11:A14').format.font = { bold: true };
  readme.getRange('A11:B14').format.borders = { preset: 'inside', style: 'thin', color: C.line };

  readme.getRange('A17:H17').merge();
  readme.getRange('A17').values = [['How to use this workbook']];
  sectionHeader(readme.getRange('A17:H17'));
  readme.getRange('A18:H28').values = [
    ['1', 'Dashboard', 'Read key observed and scenario outputs with their status labels.', '', '', '', '', ''],
    ['2', 'Assumptions', 'Edit blue-font scenario inputs only; formula cells remain black.', '', '', '', '', ''],
    ['3', 'Scenario Timeline', 'Inspect the annual capex decomposition and formula lineage.', '', '', '', '', ''],
    ['4', 'Pressure Results', 'Review the graph engine low/central/high pressure outputs.', '', '', '', '', ''],
    ['5', 'Sensitivity', 'Inspect denominator, absorption, capture, retention and joint stress tests.', '', '', '', '', ''],
    ['6', 'Power Overlay', 'Review the independent MW-based commissioning and transfer proxy.', '', '', '', '', ''],
    ['7', 'AI Projects', 'Inspect public project fields and the inferred AI classification.', '', '', '', '', ''],
    ['8', 'BCPI Data', 'Review the recent Calgary and Edmonton price-index observations.', '', '', '', '', ''],
    ['9', 'Labour Availability', 'Inspect Alberta vacancies, offered wages, quality flags and suppressed cells.', '', '', '', '', ''],
    ['10', 'Sources', 'Open authoritative public URLs and check source vintages.', '', '', '', '', ''],
    ['11', 'Release Checks', 'Confirm formula reconciliations and manifest identity.', '', '', '', '', ''],
  ];
  readme.getRange('A18:A28').format.font = { bold: true, color: C.tealDark };
  readme.getRange('B18:B28').format.font = { bold: true };
  readme.getRange('C18:H28').merge(true);
  readme.getRange('A30:H30').merge();
  readme.getRange('A30').values = [['Interpretation boundary']];
  sectionHeader(readme.getRange('A30:H30'), C.amber);
  readme.getRange('A31:H35').merge();
  readme.getRange('A31').values = [[
    'UNCALIBRATED STRUCTURAL DIAGNOSTIC. Pressure scores are not findings, forecasts, probabilities or percentages: 0.24 does not mean a 24% delay. The graph excludes 54% of scenario capex. Power values come from an independent MW-based overlay and are not an AESO needs assessment.',
  ]];
  readme.getRange('A31:H35').format = { fill: C.amberLight, font: { color: '#7B4529' }, wrapText: true, verticalAlignment: 'center' };
  setWidths(readme, { A: 12, B: 30, C: 26, D: 16, E: 16, F: 16, G: 16, H: 16 }, 36);
}

function buildAssumptions() {
  titleBand(assumptions, 'Scenario assumptions', 'Editable inputs are blue. CAD pressure and MW power remain separate.', 'K');
  assumptions.getRange('A5:B10').values = [
    ['Total AI infrastructure capex (CAD)', scenarioDefinition.investment_total_cad],
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
  assumptions.dataValidations.add({ range: 'B5', rule: { type: 'decimal', operator: 'greaterThanOrEqual', formula1: 0 } });
  assumptions.dataValidations.add({ range: 'B6:B7', rule: { type: 'whole', operator: 'between', formula1: 2026, formula2: 2050 } });

  assumptions.getRange('A12:C12').values = [['Capex component', 'Share', 'Evidence status']];
  header(assumptions.getRange('A12:C12'));
  const components = Object.entries(scenarioDefinition.components);
  assumptions.getRange(`A13:C${12 + components.length}`).values = components.map(([name, value]) => [labelize(name), value, 'scenario']);
  inputStyle(assumptions.getRange('B13:B18'));
  assumptions.getRange('B13:B18').format.numberFormat = '0.0%';
  assumptions.getRange('A19:C19').values = [['Component share check', null, 'must equal 100%']];
  assumptions.getRange('B19').formulas = [['=SUM(B13:B18)']];
  assumptions.getRange('B19').format.numberFormat = '0.0%';
  assumptions.getRange('A19:C19').format = { fill: C.soft, font: { bold: true, color: C.ink }, borders: { preset: 'doubleBottom', style: 'thin', color: C.teal } };

  assumptions.getRange('A22:K22').values = [[
    'Power case', 'Case status', 'IT load at full build (MW)', 'Energy PUE', 'Peak-to-IT factor', 'Load factor', 'Grid share', 'Peak coincidence', 'Planning margin', 'Facility peak (MW)', 'Transfer proxy (MW)',
  ]];
  header(assumptions.getRange('A22:K22'));
  const powerCases = ['low', 'central', 'high'];
  assumptions.getRange('A23:I25').values = powerCases.map((caseName) => {
    const p = powerDefinition.cases[caseName];
    return [caseName, 'scenario', p.it_load_mw_at_full_buildout, p.energy_pue, p.peak_to_it_factor, p.load_factor, p.grid_supply_share, p.peak_coincidence, p.planning_margin];
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

  assumptions.getRange('A28:D28').values = [['Pressure shock denominator', 'CAD', 'Evidence status', 'Purpose']];
  header(assumptions.getRange('A28:D28'));
  const denominators = Object.entries(scenarioDefinition.normalization_denominators_cad);
  assumptions.getRange('A29:D31').values = denominators.map(([name, value]) => [labelize(name), value, 'assumed', 'Converts annual local capex to a dimensionless shock']);
  inputStyle(assumptions.getRange('B29:B31'));
  assumptions.getRange('B29:B31').format.numberFormat = '$#,##0';

  assumptions.getRange('A34:K37').merge();
  assumptions.getRange('A34').values = [[`${scenarioDefinition.normalization_note} ${scenarioDefinition.capture_note} ${scenarioDefinition.exclusion_note} ${powerDefinition.assumption_note}`]];
  noteBlock(assumptions.getRange('A34:K37'));
  assumptions.freezePanes.freezeRows(4);
  setWidths(assumptions, { A: 31, B: 16, C: 20, D: 13, E: 15, F: 13, G: 13, H: 15, I: 14, J: 18, K: 19 }, 38);
}

function buildScenarioTimeline() {
  titleBand(timeline, 'Alberta $50B scenario timeline', 'Formula-driven annual decomposition · 2027–2036 counterfactual diagnostic', 'H');
  timeline.getRange('A4:H4').values = [[
    'Year', 'Annual profile', 'Total capex (CAD)', 'Local civil (CAD)', 'Local electrical & mechanical (CAD)', 'Local grid construction (CAD)', 'Excluded from graph (CAD)', 'Evidence status',
  ]];
  header(timeline.getRange('A4:H4'));
  const years = scenarioDefinition.annual_profile.length;
  timeline.getRange(`B5:B${4 + years}`).values = scenarioDefinition.annual_profile.map((value) => [value]);
  inputStyle(timeline.getRange(`B5:B${4 + years}`));
  for (let index = 0; index < years; index += 1) {
    const row = 5 + index;
    timeline.getRange(`A${row}`).formulas = [[index === 0 ? "='Assumptions'!B6" : `=A${row - 1}+1`]];
    timeline.getRange(`C${row}`).formulas = [[`='Assumptions'!$B$5*B${row}`]];
    timeline.getRange(`D${row}`).formulas = [[`=C${row}*('Assumptions'!$B$13+'Assumptions'!$B$14)*'Assumptions'!$B$10`]];
    timeline.getRange(`E${row}`).formulas = [[`=C${row}*'Assumptions'!$B$15*'Assumptions'!$B$10`]];
    timeline.getRange(`F${row}`).formulas = [[`=C${row}*'Assumptions'!$B$16*'Assumptions'!$B$10`]];
    timeline.getRange(`G${row}`).formulas = [[`=C${row}*('Assumptions'!$B$17+'Assumptions'!$B$18)`]];
    timeline.getRange(`H${row}`).values = [['scenario']];
  }
  const totalRow = 5 + years;
  timeline.getRange(`A${totalRow}:H${totalRow}`).values = [['Total / check', null, null, null, null, null, null, 'scenario']];
  for (const col of ['B', 'C', 'D', 'E', 'F', 'G']) timeline.getRange(`${col}${totalRow}`).formulas = [[`=SUM(${col}5:${col}${totalRow - 1})`]];
  timeline.getRange(`A${totalRow}:H${totalRow}`).format = { fill: C.soft, font: { bold: true, color: C.ink }, borders: { preset: 'doubleBottom', style: 'thin', color: C.teal } };
  timeline.getRange(`B5:B${totalRow}`).format.numberFormat = '0.0%';
  timeline.getRange(`C5:G${totalRow}`).format.numberFormat = '$#,##0';
  timeline.freezePanes.freezeRows(4);
  setWidths(timeline, { A: 12, B: 15, C: 22, D: 22, E: 30, F: 25, G: 23, H: 18 }, 17);
}

function buildPressureResults() {
  titleBand(pressure, 'Graph pressure results', 'Uncalibrated structural cases from the immutable scenario release', 'L');
  pressure.getRange('A4:L4').values = [[
    'Node ID', 'Label', 'Node type', 'Low', 'Low peak year', 'Central', 'Central peak year', 'High', 'High peak year', 'Evidence status', 'Model ID', 'Interpretation',
  ]];
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
  pressure.getRange(`F5:F${4 + rows.length}`).conditionalFormats.add('dataBar', { color: C.teal, gradient: true });
  pressure.getRange(`J5:J${4 + rows.length}`).format = { fill: C.amberLight, font: { color: '#8A4826' } };
  pressure.freezePanes.freezeRows(4);
  setWidths(pressure, { A: 37, B: 35, C: 15, D: 10, E: 13, F: 10, G: 15, H: 10, I: 13, J: 18, K: 23, L: 48 }, 20);
}

function buildSensitivity() {
  titleBand(sensitivity, 'Scenario sensitivity', 'One-at-a-time and joint structural diagnostics · not probability bounds', 'M');
  sensitivity.getRange('A4:M4').values = [[
    'Sensitivity ID', 'Label', 'Weight case', 'Retention case', 'Denominator multiplier', 'Absorption adjustment', 'Local capture', 'Top resource', 'Resource score', 'Peak year', 'Top public outcome', 'Outcome score', 'Peak year',
  ]];
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
  sensitivity.getRange(`I5:I${4 + rows.length}`).conditionalFormats.add('dataBar', { color: C.teal, gradient: true });
  sensitivity.freezePanes.freezeRows(4);
  setWidths(sensitivity, { A: 27, B: 32, C: 14, D: 16, E: 20, F: 20, G: 15, H: 28, I: 15, J: 12, K: 36, L: 15, M: 12 }, 18);
}

function buildPowerOverlay() {
  titleBand(powerOverlay, 'Independent Alberta power overlay', 'MW-based commissioning scenario · separate from the CAD pressure graph', 'J');
  powerOverlay.getRange('A4:J4').values = [[
    'Case', 'Calendar year', 'Commissioned share', 'Cumulative share', 'IT load (MW)', 'Grid-coincident demand (MW)', 'Planning transfer proxy (MW)', 'Full-build facility peak (MW)', 'Full-build annual energy (GWh)', 'Evidence status',
  ]];
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
  powerOverlay.getRange(`E5:I${4 + rows.length}`).format.numberFormat = '#,##0.0';
  powerOverlay.getRange(`J5:J${4 + rows.length}`).format = { fill: C.amberLight, font: { color: '#8A4826' } };
  const table = powerOverlay.tables.add(`A4:J${4 + rows.length}`, true, 'PowerOverlayTable');
  table.style = 'TableStyleMedium2';
  powerOverlay.freezePanes.freezeRows(4);
  setWidths(powerOverlay, { A: 12, B: 14, C: 18, D: 18, E: 18, F: 28, G: 29, H: 28, I: 30, J: 18 }, 34);
}

function buildProjects() {
  titleBand(projects, 'Alberta AI-relevant project register', 'Observed project fields with inferred relevance classification', 'Q');
  const headers = ['Project ID', 'Name', 'Reported cost (CAD)', 'Municipality', 'Start year', 'End year', 'Stage', 'Developer', 'Project URL', 'Longitude', 'Latitude', 'Location precision', 'AI relevance', 'Source status', 'Classification status', 'As-of date', 'Register source URL'];
  projects.getRange('A4:Q4').values = [headers];
  header(projects.getRange('A4:Q4'));
  const rows = release.baseline.projects;
  projects.getRange(`A5:Q${4 + rows.length}`).values = rows.map((item) => [
    item.project_id, item.name, item.estimated_cost_cad, item.municipality, item.start_year, item.end_year, item.stage, item.developer, item.project_website, item.longitude, item.latitude, item.location_precision, item.ai_relevance, item.source_evidence_status, item.classification_evidence_status, new Date(`${item.as_of_date}T00:00:00Z`), 'https://www.majorprojects.alberta.ca/',
  ]);
  projects.getRange(`C5:C${4 + rows.length}`).format.numberFormat = '$#,##0';
  projects.getRange(`J5:K${4 + rows.length}`).format.numberFormat = '0.0000';
  projects.getRange(`P5:P${4 + rows.length}`).format.numberFormat = 'yyyy-mm-dd';
  const table = projects.tables.add(`A4:Q${4 + rows.length}`, true, 'AIProjectsTable');
  table.style = 'TableStyleMedium2';
  projects.freezePanes.freezeRows(4);
  projects.freezePanes.freezeColumns(2);
  setWidths(projects, { A: 15, B: 39, C: 20, D: 22, E: 12, F: 12, G: 19, H: 31, I: 36, J: 13, K: 13, L: 17, M: 21, N: 15, O: 20, P: 14, Q: 36 }, 30);
}

function buildBcpi() {
  titleBand(bcpi, 'Alberta construction-price evidence', 'Recent Calgary and Edmonton observations from Statistics Canada table 18-10-0289-01', 'I');
  const selected = bcpiRows
    .filter((row) => ['BCPI_NON_RESIDENTIAL_BUILDINGS_622_DIVISION_COMPOSITE', 'BCPI_SCHOOL_DIVISION_COMPOSITE'].includes(row.indicator_id))
    .sort((a, b) => `${a.indicator_id}|${a.geography_id}|${a.period_end}`.localeCompare(`${b.indicator_id}|${b.geography_id}|${b.period_end}`));
  const recent = [];
  for (const key of new Set(selected.map((row) => `${row.indicator_id}|${row.geography_id}`))) {
    recent.push(...selected.filter((row) => `${row.indicator_id}|${row.geography_id}` === key).slice(-12));
  }
  bcpi.getRange('A4:I4').values = [['Observation ID', 'Indicator ID', 'Geography ID', 'Period end', 'Value', 'Unit', 'Evidence status', 'Source ID', 'Source URL']];
  header(bcpi.getRange('A4:I4'));
  bcpi.getRange(`A5:I${4 + recent.length}`).values = recent.map((row) => [row.observation_id, row.indicator_id, row.geography_id, new Date(`${row.period_end}T00:00:00Z`), Number(row.value), row.unit, row.evidence_status, row.source_id, 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810028901']);
  bcpi.getRange(`D5:D${4 + recent.length}`).format.numberFormat = 'yyyy-mm-dd';
  bcpi.getRange(`E5:E${4 + recent.length}`).format.numberFormat = '0.0';
  const table = bcpi.tables.add(`A4:I${4 + recent.length}`, true, 'BCPIEvidenceTable');
  table.style = 'TableStyleMedium2';
  bcpi.freezePanes.freezeRows(4);
  bcpi.freezePanes.freezeColumns(2);
  setWidths(bcpi, { A: 29, B: 48, C: 16, D: 14, E: 12, F: 22, G: 17, H: 28, I: 45 }, 24);
}

function buildLabour() {
  titleBand(labour, 'Alberta trade labour evidence', 'Statistics Canada table 14-10-0444-01 · missing and suppressed values remain blank', 'O');
  const headers = ['Observation ID', 'NOC', 'Occupation', 'Model trade node', 'Statistic', 'Value', 'Unit', 'Period start', 'Period end', 'Evidence status', 'Source ID', 'Transformation ID', 'Quality flags', 'Source URL', 'Missingness check'];
  labour.getRange('A4:O4').values = [headers];
  header(labour.getRange('A4:O4'));
  const ordered = [...labourRows].sort((a, b) => {
    const periodOrder = b.period_end.localeCompare(a.period_end);
    return periodOrder || `${a.trade_node_id}|${a.noc_code}|${a.statistic}`.localeCompare(`${b.trade_node_id}|${b.noc_code}|${b.statistic}`);
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
    row.value !== '' || row.quality_flags.includes('value_missing_or_suppressed') ? 'PASS' : 'FAIL',
  ]);
  labour.getRange(`F5:F${4 + ordered.length}`).format.numberFormat = '0.00';
  labour.getRange(`H5:I${4 + ordered.length}`).format.numberFormat = 'yyyy-mm-dd';
  labour.getRange(`O5:O${4 + ordered.length}`).conditionalFormats.add('containsText', { text: 'PASS', format: { fill: C.tealLight, font: { color: C.tealDark, bold: true } } });
  labour.getRange(`O5:O${4 + ordered.length}`).conditionalFormats.add('containsText', { text: 'FAIL', format: { fill: '#FDE8E5', font: { color: '#A33D32', bold: true } } });
  const table = labour.tables.add(`A4:O${4 + ordered.length}`, true, 'LabourAvailabilityTable');
  table.style = 'TableStyleMedium2';
  labour.freezePanes.freezeRows(4);
  labour.freezePanes.freezeColumns(3);
  setWidths(labour, { A: 29, B: 10, C: 46, D: 24, E: 31, F: 13, G: 13, H: 14, I: 14, J: 17, K: 28, L: 31, M: 38, N: 45, O: 18 }, 26);
}

function buildSources() {
  titleBand(sources, 'Public source register', `Authoritative and candidate sources included in release ${release.manifest.version}`, 'H');
  sources.getRange('A4:H4').values = [['Source ID', 'Title', 'Publisher', 'Domain', 'Geography', 'As-of date', 'Status', 'Canonical URL']];
  header(sources.getRange('A4:H4'));
  sources.getRange(`A5:H${4 + release.sources.length}`).values = release.sources.map((item) => [item.source_id, item.title, item.publisher, labelize(item.domain), item.geography, new Date(`${item.as_of_date}T00:00:00Z`), item.status, item.canonical_url]);
  sources.getRange(`F5:F${4 + release.sources.length}`).format.numberFormat = 'yyyy-mm-dd';
  const table = sources.tables.add(`A4:H${4 + release.sources.length}`, true, 'SourceRegisterTable');
  table.style = 'TableStyleMedium2';
  sources.freezePanes.freezeRows(4);
  sources.freezePanes.freezeColumns(1);
  setWidths(sources, { A: 29, B: 47, C: 25, D: 28, E: 34, F: 14, G: 13, H: 48 }, 16);
}

function buildReleaseChecks() {
  titleBand(checks, 'Release identity and reconciliation', 'Workbook results must reconcile to the same immutable public release', 'D');
  checks.getRange('A5:B13').values = [
    ['Release version', release.manifest.version],
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
  checks.getRange('B11:B12').format.font = { name: 'Aptos Mono', size: 9, color: C.muted };
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
  ];
  checks.getRange('A16:C23').values = checkLabels.map(([label, expected]) => [label, null, expected]);
  checks.getRange('B16').formulas = [['=IF(ABS(\'Assumptions\'!B19-1)<0.000001,"PASS","FAIL")']];
  checks.getRange('B17').formulas = [['=IF(ABS(SUM(\'Scenario Timeline\'!B5:B14)-1)<0.000001,"PASS","FAIL")']];
  checks.getRange('B18').formulas = [['=IF(ABS(\'Scenario Timeline\'!C15-\'Assumptions\'!B5)<1,"PASS","FAIL")']];
  checks.getRange('B19').formulas = [[`=IF(Dashboard!D6=COUNTIF('AI Projects'!$M$5:$M$${4 + release.baseline.projects.length},"core_data_centre"),"PASS","FAIL")`]];
  checks.getRange('B20').formulas = [['=IF(ABS(Dashboard!J6*1000-\'Assumptions\'!K24)<0.1,"PASS","FAIL")']];
  checks.getRange('B21').formulas = [[`=IF(COUNTIF('Pressure Results'!$J$5:$J$${4 + release.scenario.trade_pressure_order.length + release.scenario.public_delivery_pressure_order.length},"scenario")=ROWS('Pressure Results'!$J$5:$J$${4 + release.scenario.trade_pressure_order.length + release.scenario.public_delivery_pressure_order.length}),"PASS","FAIL")`]];
  checks.getRange('B22').formulas = [['=IF(B13=FALSE,"PASS","FAIL")']];
  checks.getRange('B23').formulas = [[`=IF(COUNTIF('Labour Availability'!$O$5:$O$${4 + labourRows.length},"FAIL")=0,"PASS","FAIL")`]];
  checks.getRange('B16:B23').conditionalFormats.add('containsText', { text: 'PASS', format: { fill: C.tealLight, font: { color: C.tealDark, bold: true } } });
  checks.getRange('B16:B23').conditionalFormats.add('containsText', { text: 'FAIL', format: { fill: '#FDE8E5', font: { color: '#A33D32', bold: true } } });
  checks.getRange('A26:D27').merge();
  checks.getRange('A26').values = [['A public release is blocked if any check returns FAIL, if the workbook and website manifests differ, or if assumptions/scenarios are presented as observations.']];
  noteBlock(checks.getRange('A26:D27'));
  setWidths(checks, { A: 42, B: 61, C: 15, D: 18 }, 27);
}

function buildDashboard() {
  titleBand(dashboard, 'Alberta pilot dashboard', `Observed pipeline + $50B counterfactual diagnostic · Release ${release.manifest.version}`, 'L');
  card(dashboard, 'A5:C5', 'A6:C7', 'Known reported core capex', `='AI Projects'!C${4 + release.baseline.projects.length + 1}`);
  dashboard.getRange('A6').formulas = [[`=SUMIF('AI Projects'!$M$5:$M$${4 + release.baseline.projects.length},"core_data_centre",'AI Projects'!$C$5:$C$${4 + release.baseline.projects.length})/1000000000`]];
  dashboard.getRange('A6').format.numberFormat = '$0.00"B"';
  card(dashboard, 'D5:F5', 'D6:F7', 'Core facility records', '');
  dashboard.getRange('D6').formulas = [[`=COUNTIF('AI Projects'!$M$5:$M$${4 + release.baseline.projects.length},"core_data_centre")`]];
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
    dashboard.getRange(`A${row}`).formulas = [[`='Pressure Results'!B${5 + index}`]];
    dashboard.getRange(`B${row}`).formulas = [[`='Pressure Results'!F${5 + index}`]];
  });
  dashboard.getRange(`B10:B${9 + release.scenario.trade_pressure_order.length}`).format.numberFormat = '0.00';
  const tradeChart = dashboard.charts.add('bar', dashboard.getRange(`A9:B${9 + release.scenario.trade_pressure_order.length}`));
  tradeChart.title = 'Which trades are pinched first? (diagnostic pressure score)';
  tradeChart.hasLegend = false;
  tradeChart.xAxis = { axisType: 'textAxis', textStyle: { fontSize: 9 } };
  tradeChart.yAxis = { numberFormatCode: '0.00', min: 0 };
  tradeChart.setPosition('D9', 'L22');

  dashboard.getRange('A25:B25').values = [['Year', 'Total capex (CAD bn)']];
  header(dashboard.getRange('A25:B25'));
  scenarioDefinition.annual_profile.forEach((_, index) => {
    const row = 26 + index;
    dashboard.getRange(`A${row}`).formulas = [[`='Scenario Timeline'!A${5 + index}`]];
    dashboard.getRange(`B${row}`).formulas = [[`='Scenario Timeline'!C${5 + index}/1000000000`]];
  });
  dashboard.getRange('B26:B35').format.numberFormat = '$0.0';
  const flowChart = dashboard.charts.add('line', dashboard.getRange('A25:B35'));
  flowChart.title = 'Counterfactual annual capex flow (CAD bn)';
  flowChart.hasLegend = false;
  flowChart.xAxis = { axisType: 'textAxis', textStyle: { fontSize: 9 } };
  flowChart.yAxis = { numberFormatCode: '$0.0', min: 0 };
  flowChart.setPosition('D25', 'L39');

  dashboard.getRange('A41:L43').merge();
  dashboard.getRange('A41').values = [[
    'UNCALIBRATED STRUCTURAL DIAGNOSTIC: project capex is an observed announcement pipeline with inferred classification. Pressure scores are not findings, percentages or delay estimates; 54% of scenario capex is excluded. Power is an independent MW overlay, not grid availability or an AESO needs assessment.',
  ]];
  dashboard.getRange('A41:L43').format = { fill: C.amberLight, font: { color: '#7B4529', size: 10 }, wrapText: true, verticalAlignment: 'center', borders: { preset: 'outside', style: 'thin', color: '#E1B48E' } };
  dashboard.getRange('A44:L44').merge();
  dashboard.getRange('A44').values = [[`Release hash: ${release.manifest.input_manifest_hash}`]];
  dashboard.getRange('A44').format = { font: { name: 'Aptos Mono', size: 8, color: C.muted }, horizontalAlignment: 'left' };
  dashboard.freezePanes.freezeRows(4);
  setWidths(dashboard, { A: 18, B: 18, C: 4, D: 15, E: 15, F: 15, G: 15, H: 15, I: 15, J: 15, K: 15, L: 15 }, 44);
}

function titleBand(sheet, title, subtitle, endColumn) {
  sheet.getRange(`A1:${endColumn}2`).merge();
  sheet.getRange('A1').values = [[title]];
  sheet.getRange(`A1:${endColumn}2`).format = { fill: C.navy, font: { name: 'Aptos Display', size: 22, bold: true, color: C.white }, verticalAlignment: 'center', horizontalAlignment: 'left' };
  sheet.getRange(`A3:${endColumn}3`).merge();
  sheet.getRange('A3').values = [[subtitle]];
  sheet.getRange(`A3:${endColumn}3`).format = { fill: C.navy2, font: { size: 10, color: '#B7D9D2' }, verticalAlignment: 'center' };
  sheet.getRange('A1').format.rowHeight = 28;
  sheet.getRange('A2').format.rowHeight = 28;
  sheet.getRange('A3').format.rowHeight = 21;
}

function header(range) {
  range.format = { fill: C.tealDark, font: { bold: true, color: C.white, size: 10 }, wrapText: true, verticalAlignment: 'center', borders: { preset: 'inside', style: 'thin', color: '#79A9A0' } };
  range.format.rowHeight = 28;
}

function sectionHeader(range, fill = C.tealDark) {
  range.format = { fill, font: { bold: true, color: C.white, size: 11 }, verticalAlignment: 'center' };
}

function noteBlock(range) {
  range.format = { fill: C.soft, font: { color: C.muted, size: 10 }, wrapText: true, verticalAlignment: 'center', borders: { preset: 'outside', style: 'thin', color: C.line } };
}

function inputStyle(range) {
  range.format = { fill: '#EAF3F8', font: { color: C.blueInput }, borders: { preset: 'outside', style: 'thin', color: '#B7CDD9' } };
}

function card(sheet, labelRange, valueRange, label, formula) {
  sheet.getRange(labelRange).merge();
  sheet.getRange(labelRange.split(':')[0]).values = [[label]];
  sheet.getRange(labelRange).format = { fill: C.tealLight, font: { bold: true, color: C.tealDark, size: 9 }, horizontalAlignment: 'center', verticalAlignment: 'center', borders: { preset: 'outside', style: 'thin', color: '#B9CEC7' } };
  sheet.getRange(valueRange).merge();
  if (formula) sheet.getRange(valueRange.split(':')[0]).formulas = [[formula]];
  sheet.getRange(valueRange).format = { fill: C.white, font: { bold: true, color: C.ink, size: 21 }, horizontalAlignment: 'center', verticalAlignment: 'center', borders: { preset: 'outside', style: 'thin', color: '#B9CEC7' } };
}

function setWidths(sheet, widths, maxRow) {
  for (const [column, width] of Object.entries(widths)) sheet.getRange(`${column}1:${column}${maxRow}`).format.columnWidth = width;
  sheet.getRange(`A1:${Object.keys(widths).at(-1)}${maxRow}`).format.wrapText = true;
}

function labelize(value) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((headerName, index) => [headerName, values[index] ?? '']));
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
