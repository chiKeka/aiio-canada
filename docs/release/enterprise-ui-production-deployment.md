# Enterprise UI production deployment

Deployed September 5, 2026 (America/Edmonton; September 6 UTC) using the
explicitly authorized Vercel CLI production workflow.

- Project: chikekas-projects/aiio-canada
- Production domain: https://aiio-canada.vercel.app
- Deployment URL: https://aiio-canada-bm3jqemyv-chikekas-projects.vercel.app
- Deployment details: https://vercel.com/chikekas-projects/aiio-canada/HAMMxE7qoC5cuakPASiLGpqjjzMK
- Source basis: local reviewed application changes over commit
  868b3f6b16906ad2d4eb8c10dd9e5bffde1c6c7d; no Git push or commit was made.
- Exact uploaded application file hashes: enterprise-ui-deployment-files.json.

The shared enterprise UI now covers all executive and research screens. The
published evidence and model authorization boundaries remain unchanged.

A staged application package includes 331 source/data/public files, excluding
local research caches and unrelated research work. The first attempt failed
because the alternate Sites configuration lacked its companion hosting file;
removing that unused alternate build configuration from the Vercel package
resolved the failure. The workspace's Sites configuration was not modified.

Vercel's production build passed compilation, TypeScript, page generation and
output deployment, then assigned the existing production alias. Local validation
before upload passed 27 responsive/accessibility cases, a nine-route accessibility
audit, the executive workflow including PDF and integrity snapshot checks, lint,
TypeScript and 14 planning tests. No post-deployment browser smoke test or runtime
log audit is claimed by this receipt.

This direct deployment contains local changes not yet committed to GitHub. A
future Git-triggered deployment must include these changes to retain the design.
