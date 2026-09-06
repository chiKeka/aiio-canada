export type Trade = 'Civil' | 'Electrical' | 'Mechanical';
export const trades: Trade[] = ['Civil', 'Electrical', 'Mechanical'];
export type Project = {
  id: string;
  name: string;
  region: string;
  stage: string;
  cost: number | null;
  start: number | null;
  end: number | null;
  source: string;
  asOf: string;
};
export type Selection = { included: boolean; cost: number; online: number };
export type Options = {
  years: number;
  duration: number;
  cohortYears: number;
  growth: number;
  inflation: number;
  constructionShare: number;
  publicShare: number;
  hoursFactor: number;
  annualHours: number;
  shares: number[];
  labour: number[];
  wages: number[];
  capacity: (number | null)[];
};
export const defaults: Options = {
  years: 5,
  duration: 24,
  cohortYears: 4,
  growth: 0,
  inflation: 0.025,
  constructionShare: 0.5,
  publicShare: 0.7,
  hoursFactor: 1,
  annualHours: 1840,
  shares: [0.2, 0.45, 0.35],
  labour: [0.35, 0.25, 0.3],
  wages: [85, 105, 100],
  capacity: [null, null, null],
};
export const formulas = [
  [
    'F01',
    'Quantity estimate',
    'Paid hours = quantity × paid hours/unit × incremental conditions',
    'Authorized item rates required; normal handling allowances are already included.',
  ],
  [
    'F02',
    'Preliminary cost estimate',
    'Trade hours = scoped construction cost × package share × labour fraction ÷ loaded hourly cost × conditions',
    'Active route in this workspace. Shares and loaded rates are editable analyst assumptions.',
  ],
  [
    'F03',
    'Quarterly FTE',
    'Average FTE = quarterly paid hours ÷ (annual paid hours / 4)',
    'Average equivalent workforce, not peak workers or permanent operating jobs.',
  ],
  [
    'F04',
    'Recurring capital',
    'Annual cash = sum of active cohort commitments × annual cohort weight',
    'Published cash envelopes include named projects. They are not added again. Pre-horizon cohorts are initialized.',
  ],
  [
    'F05',
    'Conditional pressure',
    'Ratio = (background hours + DC hours) ÷ total available hours',
    'Capacity is unknown until entered. Background here covers the public envelope only; private work is omitted.',
  ],
  [
    'F06',
    'Conditional gap',
    'Unmet hours = max(0, total demand − total capacity)',
    'Demand screening only; this is not a calculated project delay.',
  ],
  [
    'F07',
    'Procurement',
    'Schedule exposure = max(0, lead weeks − weeks until required)',
    'Product-specific scenario; confirm order-release basis, logistics and package float.',
  ],
  [
    'F08',
    'Exposed-cost delay',
    'Additional escalation = uncommitted cost × ((1 + annual rate)^(delay months / 12) − 1)',
    'User-entered delay illustration. No shortage-to-delay or scarcity-price coefficient is inferred.',
  ],
  [
    'F09',
    'Efficiency loss',
    'Required hours multiplier = 1 / (1 − efficiency loss)',
    'Do not stack overlapping overtime, weather and normal estimating allowances.',
  ],
  [
    'F10',
    'Monthly package allocation',
    'Month hours = package hours × overlapping fraction of the package window',
    'Assumed uniform windows as fractions of field duration: civil 0–50%, electrical 25–100%, mechanical 30–100%. These overlap and include late commissioning effort; they are not observed schedules.',
  ],
];
const month = (year: number, offset = 0) => year * 12 + offset;
export function publicAnnual(year: number, o: Options) {
  const budget: Record<number, number> = {
    2026: 10687e6,
    2027: 9998e6,
    2028: 8349e6,
  };
  // FY April–March amounts: retain each published nominal vintage. Tail grows in real terms plus explicit price inflation.
  return (
    budget[year] ??
    (year < 2026
      ? budget[2026]
      : budget[2028] * ((1 + o.growth) * (1 + o.inflation)) ** (year - 2028))
  );
}
export function escalation(cost: number, annual: number, months: number) {
  if (
    ![cost, annual, months].every(Number.isFinite) ||
    cost < 0 ||
    annual <= -1 ||
    months < 0
  )
    throw new Error('Invalid escalation inputs');
  return cost * ((1 + annual) ** (months / 12) - 1);
}
export function calculate(
  projects: Project[],
  selected: Record<string, Selection>,
  o: Options,
) {
  const numeric = [
    o.years,
    o.duration,
    o.cohortYears,
    o.growth,
    o.inflation,
    o.constructionShare,
    o.publicShare,
    o.hoursFactor,
    o.annualHours,
    ...o.shares,
    ...o.labour,
    ...o.wages,
  ];
  if (
    !numeric.every(Number.isFinite) ||
    ![3, 5, 10].includes(o.years) ||
    o.duration < 1 ||
    ![4, 5].includes(o.cohortYears) ||
    o.annualHours <= 0 ||
    o.hoursFactor <= 0 ||
    o.wages.some((x) => x <= 0) ||
    o.growth <= -1 ||
    o.inflation <= -1 ||
    [o.constructionShare, o.publicShare, ...o.shares, ...o.labour].some(
      (x) => x < 0 || x > 1,
    ) ||
    Math.abs(o.shares.reduce((a, b) => a + b, 0) - 1) > 0.00001 ||
    o.capacity.some((x) => x !== null && (!Number.isFinite(x) || x < 0))
  )
    throw new Error(
      'Check shares (must total 100%), positive wages, durations and capacity.',
    );
  const phases = projects
    .filter((p) => selected[p.id]?.included)
    .map((p) => {
      const s = selected[p.id];
      if (
        !Number.isFinite(s.cost) ||
        s.cost <= 0 ||
        !Number.isInteger(s.online) ||
        s.online < 2020 ||
        s.online > 2050
      )
        throw new Error(
          'Included phases need positive cost and an online year between 2020 and 2050.',
        );
      const reportedEnd = p.end === s.online;
      let end = month(s.online, 6);
      let start = p.start !== null ? month(p.start) : end - o.duration;
      let basis =
        p.start !== null
          ? reportedEnd
            ? 'Reported years; Jan start / July finish convention'
            : 'Reported start year; assumed online year, Jan start / July finish convention'
          : 'Inferred from July online midpoint and assumed duration';
      if (end <= start) throw new Error('A phase must finish after its start.');
      if (p.stage !== 'Under Construction' && start < month(2026, 8)) {
        const duration = end - start;
        start = month(2026, 8);
        end = start + duration;
        basis += '; infeasible past proposal start shifted to September 2026';
      }
      const hours = trades.map(
        (_, i) =>
          ((s.cost * o.constructionShare * o.shares[i] * o.labour[i]) /
            o.wages[i]) *
          o.hoursFactor,
      );
      return {
        ...p,
        scenarioCost: s.cost,
        startMonth: start,
        endMonth: end,
        basis,
        hours,
      };
    });
  // A constant-duration cohort model calibrated exactly to each FY cash envelope.
  // Initialize D−1 prior commitments; new commitments solve the remaining envelope.
  const cohorts: { year: number; commitment: number }[] = [];
  for (let y = 2026 - o.cohortYears + 1; y < 2026; y++)
    cohorts.push({ year: y, commitment: publicAnnual(2026, o) });
  for (let y = 2026; y <= 2027 + o.years; y++) {
    const active = cohorts
      .filter((c) => c.year > y - o.cohortYears)
      .reduce((s, c) => s + c.commitment / o.cohortYears, 0);
    cohorts.push({
      year: y,
      commitment: (publicAnnual(y, o) - active) * o.cohortYears,
    });
  }
  const invalidCohorts = cohorts.some((c) => c.commitment < 0);
  const rows = [];
  let totalHours = 0;
  const windows: [number, number][] = [
    [0, 0.5],
    [0.25, 1],
    [0.3, 1],
  ];
  for (let y = 2027; y < 2027 + o.years; y++)
    for (let q = 0; q < 4; q++)
      for (let i = 0; i < 3; i++) {
        let dc = 0,
          background = 0;
        for (let m = month(y, q * 3); m < month(y, q * 3 + 3); m++) {
          const fy = Math.floor(m / 12) - (m % 12 < 3 ? 1 : 0);
          background +=
            (((publicAnnual(fy, o) / 12) *
              o.publicShare *
              o.shares[i] *
              o.labour[i]) /
              o.wages[i]) *
            o.hoursFactor;
          for (const p of phases) {
            const a =
                p.startMonth + (p.endMonth - p.startMonth) * windows[i][0],
              b = p.startMonth + (p.endMonth - p.startMonth) * windows[i][1];
            dc +=
              (p.hours[i] * Math.max(0, Math.min(m + 1, b) - Math.max(m, a))) /
              (b - a);
          }
        }
        totalHours += dc;
        const cap =
          o.capacity[i] === null ? null : (o.capacity[i]! * o.annualHours) / 4;
        rows.push({
          quarter: `${y} Q${q + 1}`,
          trade: trades[i],
          dcHours: dc,
          publicHours: background,
          dcFte: dc / (o.annualHours / 4),
          capacityHours: cap,
          ratio: cap === null || cap === 0 ? null : (dc + background) / cap,
          gap: cap === null ? null : Math.max(0, dc + background - cap),
        });
      }
  return {
    version: 'construction-0.1',
    options: o,
    phases,
    rows,
    cohorts,
    invalidCohorts,
    totalHours,
    jobYears: totalHours / o.annualHours,
    outsideWindowHours:
      phases.reduce((s, p) => s + p.hours.reduce((a, b) => a + b, 0), 0) -
      totalHours,
    scope:
      'Conditional Alberta public-envelope + selected DC scenario; other private construction omitted; no causal forecast',
  };
}
