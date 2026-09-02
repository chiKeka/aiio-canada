import digest from '@/public/data/latest-digest.json';
import gates from '@/data/governance/program-gates.json';
import surface from '@/public/data/research-surface.json';
import release from '@/public/data/latest.json';

export const dynamic = 'force-dynamic';

export function GET() {
  const digestDate = new Date(`${digest.edition_date}T00:00:00Z`);
  const ageDays = Math.max(0, Math.floor((Date.now() - digestDate.getTime()) / 86_400_000));
  const cadence = ageDays <= 10 ? 'current' : 'stale';
  const integrity = surface.artifact_count > 0 && Boolean(surface.artifact_manifest_sha256);
  const operational = integrity && cadence === 'current';

  return Response.json(
    {
      status: operational ? 'operational' : 'degraded',
      checked_at: new Date().toISOString(),
      application: { service: 'AIIO Canada', environment: process.env.VERCEL_ENV ?? 'local' },
      evidence: {
        digest_edition: digest.edition_date,
        digest_status: digest.status,
        age_days: ageDays,
        cadence,
        artifact_count: surface.artifact_count,
        manifest_sha256: surface.artifact_manifest_sha256,
      },
      release: {
        version: release.manifest.version,
        status: release.manifest.status,
        model_version: release.manifest.model_version,
        forecast_authorized: false,
      },
      governance: {
        deployment: gates.deployment.status,
        independent_review: gates.independent_review,
      },
    },
    {
      status: operational ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
