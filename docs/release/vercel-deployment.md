# GitHub and Vercel deployment

AIIO Canada uses a private GitHub repository as the source of record and a
Vercel preview deployment as the first public-web release gate. The application
is a standard Next.js project; Vercel does not require secrets or environment
variables for the current public-data prototype.

## Deployment contract

- Runtime: Node.js 22 or newer.
- Framework preset: Next.js.
- Root directory: repository root.
- Install command: `npm install`.
- Build command: `npm run build`.
- Output directory: managed by Next.js and Vercel.
- Environment variables: none for the current research-prototype release.

The canonical Next.js commands are `npm run dev`, `npm run build`, and
`npm run start`. The alternative Sites build remains available through the
matching `*:sites` scripts. Both targets consume the same application and
published data files.

## Release sequence

1. Run the source, model, accessibility, and publication checks locally.
2. Commit the reviewed source changes.
3. Build the versioned release manifest and workbook from that clean source
   commit.
4. Commit the generated publication artifacts separately. The manifest's
   `code_commit` remains the reviewed source commit that produced them.
5. Push both commits to the private GitHub repository.
6. Import the repository into Vercel and create a preview deployment.
7. Verify the Vercel build result and inspect the preview in a browser before
   promoting it to production.

This two-commit sequence preserves reproducibility: the publication commit can
contain files generated from the exact source commit recorded in the manifest
without creating a self-referential commit hash.

## Public-release boundary

The website must continue to label scenario results as uncalibrated structural
diagnostics. A successful web deployment does not promote scenario-only or
assumed values to observations, forecasts, probabilities, or project-specific
delay estimates.
