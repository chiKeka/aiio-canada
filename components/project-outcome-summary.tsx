import type { ProjectOutcomes } from '@/lib/project-outcomes';
import { windsongContractContext } from '@/lib/project-outcomes';

export function ProjectOutcomeSummary({
  outcomes,
  schoolContext = false,
}: {
  outcomes: ProjectOutcomes;
  schoolContext?: boolean;
}) {
  return (
    <section
      className="rounded-lg border border-line bg-surface p-5"
      aria-label="Cost allocation and delivery interpretation"
      data-testid="project-outcomes"
    >
      <h2 className="text-lg font-semibold">
        Cost allocation and delivery risk
      </h2>
      <dl className="mt-4 grid gap-5 md:grid-cols-3">
        <div>
          <dt className="font-semibold">Contractor cost pressure</dt>
          <dd>Amount unknown</dd>
          <dd className="mt-2 text-sm text-subtle">
            {outcomes.contractorCostPressure.interpretation}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Taxpayer cost exposure</dt>
          <dd>Amount unknown</dd>
          <dd className="mt-2 text-sm text-subtle">
            {outcomes.taxpayerCostExposure.interpretation}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Delivery risk</dt>
          <dd>
            {outcomes.deliveryRisk.incrementalDelayMonths === null
              ? 'Timing unknown'
              : `${outcomes.deliveryRisk.incrementalDelayMonths} months of conditional incremental delay`}
          </dd>
          <dd className="mt-2 text-sm text-subtle">
            {outcomes.deliveryRisk.interpretation}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-subtle">
        {outcomes.enteredExposurePricing.interpretation}
      </p>
      {schoolContext ? (
        <div
          className="mt-5 space-y-3 border-t border-line pt-4"
          data-testid="windsong-contract-context"
        >
          <h3 className="font-semibold">
            {windsongContractContext.school}: contract context
          </h3>
          <p>
            {windsongContractContext.location}. Six-school DBFM agreement
            executed March 27, 2025.
          </p>
          <p className="text-sm">{windsongContractContext.capitalRisk}</p>
          <p className="text-sm">
            {windsongContractContext.publicExposurePaths}
          </p>
          <p className="text-sm">{windsongContractContext.programme}</p>
          <p className="text-sm">
            Unknown: {windsongContractContext.unknowns.join('; ')}.
          </p>
          <p className="text-sm text-subtle">
            {windsongContractContext.qualification}
          </p>
          <ul className="space-y-2">
            {windsongContractContext.sources.map((source) => (
              <li key={source.url}>
                <a className="text-brand underline" href={source.url}>
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
