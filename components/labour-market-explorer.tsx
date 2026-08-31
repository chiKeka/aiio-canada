'use client';

import { useMemo, useState } from 'react';

export type NationalLabourObservation = {
  noc_code: string;
  occupation_label: string;
  trade_node_id: string;
  statistic: string;
  value: number | null;
  unit: string;
  geography_id: string;
  geography_label: string;
  period_end: string;
  quality_flags: string[];
};

export type NationalLabourAvailability = {
  period_end: string;
  geography_scope: string;
  warning: string;
  coverage: Array<{
    geography_id: string;
    geography_label: string;
    observed_cells: number;
    not_published_cells: number;
    total_cells: number;
    coverage_percent: number;
  }>;
  observations: NationalLabourObservation[];
};

type OccupationRow = {
  nocCode: string;
  occupation: string;
  tradeNode: string;
  vacancies: NationalLabourObservation | null;
  wage: NationalLabourObservation | null;
};

export function LabourMarketExplorer({ labour }: { labour: NationalLabourAvailability }) {
  const initialGeography = labour.coverage.some((item) => item.geography_id === 'PR_48')
    ? 'PR_48'
    : labour.coverage[0]?.geography_id;
  const [geographyId, setGeographyId] = useState(initialGeography);
  const coverage = labour.coverage.find((item) => item.geography_id === geographyId);
  const occupations = useMemo(() => {
    const groups = new Map<string, OccupationRow>();
    for (const observation of labour.observations) {
      if (observation.geography_id !== geographyId) continue;
      const existing = groups.get(observation.noc_code) ?? {
        nocCode: observation.noc_code,
        occupation: observation.occupation_label,
        tradeNode: observation.trade_node_id,
        vacancies: null,
        wage: null,
      };
      if (observation.statistic === 'Job vacancies') existing.vacancies = observation;
      if (observation.statistic === 'Average offered hourly wage') existing.wage = observation;
      groups.set(observation.noc_code, existing);
    }
    return Array.from(groups.values());
  }, [geographyId, labour.observations]);

  return (
    <section className="border-t border-[#d5ddd8] bg-white">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#28776e]">Common provincial labour evidence</p>
            <h2 className="mt-2 text-2xl font-medium">Provincial trade labour snapshot</h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[#52645f]">
              Statistics Canada table 14-10-0444-01 · quarter ending {labour.period_end}. Select a province or territory to inspect the same occupations without substituting a Canada-wide average.
            </p>
          </div>
          <label className="text-sm font-medium" htmlFor="labour-geography">
            Province or territory
            <select
              className="mt-2 w-full rounded-lg border border-[#aebfb7] bg-[#fbfaf5] px-3 py-2.5 text-sm"
              id="labour-geography"
              onChange={(event) => setGeographyId(event.target.value)}
              value={geographyId}
            >
              {labour.coverage.map((item) => (
                <option key={item.geography_id} value={item.geography_id}>
                  {item.geography_label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {coverage ? (
          <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-[#d2dad5] bg-[#d2dad5] sm:grid-cols-3">
            <CoverageMetric label="Cells reported" value={`${coverage.observed_cells} of ${coverage.total_cells}`} />
            <CoverageMetric label="Coverage" value={`${coverage.coverage_percent.toFixed(1)}%`} />
            <CoverageMetric label="Not published" value={String(coverage.not_published_cells)} />
          </div>
        ) : null}

        <div aria-live="polite" className="mt-6 overflow-x-auto rounded-xl border border-[#d2dad5]">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <caption className="sr-only">Trade labour observations for {coverage?.geography_label ?? 'the selected geography'}</caption>
            <thead className="bg-[#e8eeea] text-xs uppercase tracking-wide text-[#48635d]">
              <tr><th className="px-4 py-3" scope="col">Model trade</th><th className="px-4 py-3" scope="col">Occupation</th><th className="px-4 py-3" scope="col">Vacancies</th><th className="px-4 py-3" scope="col">Offered wage</th><th className="px-4 py-3" scope="col">StatCan quality</th></tr>
            </thead>
            <tbody className="divide-y divide-[#dce3de] bg-[#fbfaf5]">
              {occupations.map((item) => (
                <tr key={item.nocCode}>
                  <td className="px-4 py-3 font-mono text-xs text-[#1f665f]">{item.tradeNode.replace('trade_', '').replaceAll('_', ' ')}</td>
                  <td className="px-4 py-3"><span className="font-medium">{item.occupation}</span><span className="ml-2 font-mono text-xs text-[#566761]">NOC {item.nocCode}</span></td>
                  <td className="px-4 py-3 font-mono">{formatLabourValue(item.vacancies, 'vacancies')}</td>
                  <td className="px-4 py-3 font-mono">{formatLabourValue(item.wage, 'wage')}</td>
                  <td className="px-4 py-3 text-xs text-[#52645f]">Vacancies: {qualityCode(item.vacancies)} · Wage: {qualityCode(item.wage)}</td>
                </tr>
              ))}
              {occupations.length === 0 ? <tr><td className="px-4 py-5 text-[#52645f]" colSpan={5}>No observations are available for this geography.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-xl border border-[#e1b48e] bg-[#fff3e8] p-4 text-sm leading-6 text-[#825a47]">{labour.warning}</div>
      </div>
    </section>
  );
}

function CoverageMetric({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#f3f6f2] p-4"><p className="font-mono text-xl font-semibold text-[#1b625b]">{value}</p><p className="mt-1 text-xs text-[#52645f]">{label}</p></div>;
}

function formatLabourValue(observation: NationalLabourObservation | null, kind: 'vacancies' | 'wage') {
  if (!observation) return 'Not available';
  if (observation.value === null) return missingValueLabel(observation);
  return kind === 'wage' ? `$${observation.value.toFixed(2)}/hr` : Math.round(observation.value).toLocaleString('en-CA');
}

function qualityCode(observation: NationalLabourObservation | null) {
  return observation?.quality_flags.find((flag) => flag.startsWith('status:'))?.replace('status:', '') ?? 'not reported';
}

function missingValueLabel(observation: NationalLabourObservation) {
  const code = qualityCode(observation);
  if (code === 'F') return 'Unreliable (F)';
  if (code.toLowerCase() === 'x') return 'Confidential (x)';
  if (code === '..') return 'Not available (..)';
  return 'Not published';
}
