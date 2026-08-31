import { ScenarioLab } from '@/components/scenario-lab';
import { PageIntro, SiteFooter, SiteHeader } from '@/components/site-shell';

export default function ScenarioPage() {
  return <main className="min-h-screen bg-[#f5f3ec] text-[#17343d]"><SiteHeader /><PageIntro eyebrow="Scenario laboratory" title="What if $50B lands in Alberta over a decade?" description="Explore the published counterfactual diagnostic while keeping capex, local capture, graph pressure and the independent power overlay distinct. Moving a control creates an interpolation for learning—not a new forecast, finding or research release." /><section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16"><ScenarioLab /></section><SiteFooter /></main>;
}
