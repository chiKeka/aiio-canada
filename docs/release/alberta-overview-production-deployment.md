# Alberta overview production deployment

Deployed 6 September 2026 to the existing `chikekas-projects/aiio-canada` production project.

- Production: https://aiio-canada.vercel.app
- Alberta overview: https://aiio-canada.vercel.app/construction
- Deployment: https://aiio-canada-ccxk3q4oa-chikekas-projects.vercel.app
- Deployment details: https://vercel.com/chikekas-projects/aiio-canada/SWraGvmoNvgtLjwvTuYayfbJhGqE
- Uploaded application file hashes: `alberta-overview-deployment-files.json` (360 files, plus deployment ignore configuration).

Vercel completed production installation, automatic construction evidence publication, compilation, TypeScript validation, page generation and deployment, then assigned the existing production alias. The build lists `/construction`, `/api/construction/revision` and `/api/briefing` as dynamic routes. The packaged evidence represents the existing 19-record register; this deployment did not acquire new source observations. No post-deployment browser/runtime smoke test is claimed.

The package preserves the current application, adds the Alberta overview, shared briefing data, source-cadence status and revision polling, and includes the PPTX template and atomic evidence bundle. Alternate Sites build configuration and local research caches were excluded from this Vercel package.

This was an explicitly authorized direct Vercel deployment from local files. No Git commit, push or merge was performed. The updated GitHub source-refresh workflow is therefore not activated by this deployment; it still requires a reviewed merge to the repository's default branch. Future Git-triggered deployments must include these application changes to retain them.
