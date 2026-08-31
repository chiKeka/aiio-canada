# Grok Canada labour expansion gate

Date: 2026-08-31  
Reviewer: Grok CLI  
Gate: Canada-wide provincial and territorial JVWS labour evidence  
Initial verdict: **HOLD**

The reviewer performed a read-only inspection of the adapter, processed extract,
release builder, website, workbook and tests. It confirmed that the adapter
correctly preserves the 13 provincial and territorial geographies and excludes
Canada totals and other geographies, but held publication until the new evidence
was sealed into one reconciled release.

## Material findings and disposition

| Finding | Severity | Disposition |
|---|---|---|
| Public v0.3 did not yet contain the Canada labour dataset while new website code referenced it | Blocker | v0.4 release remains blocked until a clean source commit, release build, workbook build and manifest verification complete. |
| “All 13” and six-NOC/two-statistic coverage were descriptive claims rather than release invariants | High | Release validation now requires exactly the 13 approved `PR_*` identifiers, matching Statistics Canada DGUIDs and all 12 expected cells per geography. |
| Every null was labelled “Suppressed” even when the status meant confidential or unavailable | High | Public copy now distinguishes `F`, `x`, `..` and generic not-published states; aggregate coverage uses “not published.” |
| Economic-region exclusion and published zero handling were weakly tested | Medium | Tests now include an economic-region DGUID and verify that a published `0.0` remains observed. |
| Workbook coverage reconciliation did not gate observation-level missingness checks | Medium | The Canada release check now requires both coverage reconciliation and zero observation-level failures; observation rows are derived from coverage length. |
| Labour explorer table semantics and empty state needed strengthening | Medium | The table now has a caption, scoped headers, a polite update region and an explicit empty state. |

## Re-review condition

The gate can move from HOLD only when v0.4 is built from a clean commit, all
automated checks pass, the workbook contains no failed reconciliation checks,
publication artifacts include the national CSV, and the website, workbook and
immutable manifest identify the same release.
