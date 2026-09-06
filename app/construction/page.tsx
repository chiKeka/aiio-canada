import { loadConstructionSnapshot } from '@/lib/construction-snapshot';
import { ConstructionWorkspace } from '@/components/construction-workspace';
import { AlbertaOverview } from '@/components/alberta-overview';
import { ResearchShell, PageIntro, SiteFooter } from '@/components/site-shell';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function ConstructionPage() {
  const { data, revision } = await loadConstructionSnapshot();
  return (
    <ResearchShell>
      <PageIntro
        eyebrow="Alberta construction intelligence"
        title="Construction demand & capacity"
        description="Explore the Alberta pipeline, workforce, construction prices and procurement pressures behind the presentation. Review delivery implications and mitigations, then explore conditional demand in the scenario model."
      />
      <ConstructionWorkspace
        evidenceAsOf={data.manifest.asOf}
        overview={
          <AlbertaOverview
            data={data}
            revision={`${revision}:${new Date().toISOString().slice(0, 10)}`}
          />
        }
      />
      <SiteFooter />
    </ResearchShell>
  );
}
