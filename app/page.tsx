import { ExecutiveCockpit } from '@/components/executive-cockpit';
import sourceFreshness from '@/public/data/source-freshness.json';
import practicalRoute from '@/data/model-runs/practical_evidence_route_current.json';
import attributionReadiness from '@/data/model-runs/ai_attribution_identification_readiness_v0.1.json';

export default function Home() {
  return <ExecutiveCockpit readiness={{
    proxyPlanning: practicalRoute.proxy_planning_validation,
    currentSources: sourceFreshness.current_count,
    totalSources: sourceFreshness.source_count,
    trackedProjects: practicalRoute.tracks.prospective_public_project_tracking.project_count,
    representedRegions: practicalRoute.tracks.prospective_public_project_tracking.province_count,
    targetRegions: 5,
    passedIdentificationChecks: attributionReadiness.readiness_checks.filter((check) => check.status === 'pass').length,
    totalIdentificationChecks: attributionReadiness.readiness_checks.length,
  }} />;
}
