# Initial source register

This is the human-readable planning register. `data/registry/sources.json` is the
machine-readable authority for implemented and candidate adapters. URLs and
access methods must be revalidated at ingestion time.

| Domain | Candidate authoritative source | Intended variables | Geography/frequency | Adapter priority |
|---|---|---|---|---|
| AI/data-centre projects | Alberta Major Projects | Project, sponsor, value, location, stage, timing | Alberta; updated periodically | P0 |
| Public capital projects | Alberta Major Projects and provincial capital plans | Asset class, budget, location, schedule, stage | Alberta; periodic/annual | P0 |
| Construction prices | Statistics Canada table 18-10-0289-01, Building Construction Price Index | Quarterly non-residential price indices by CMA and building type | Selected CMAs; quarterly | P0 |
| Employment | Statistics Canada Labour Force Survey tables | Employment, unemployment, wages by occupation/industry | Provincial; monthly/annual | P0 |
| Vacancies | Statistics Canada Job Vacancy and Wage Survey tables | Vacancies, offered wages, vacancy rates | Provincial/economic region; quarterly | P0 |
| Trades pipeline | Alberta apprenticeship and industry training statistics | Registrations, completions, certificates by trade | Alberta; annual | P0 |
| Occupational outlook | Alberta occupational outlook | Supply/demand outlook and gap by occupation | Alberta; outlook vintages | P1 |
| Power forecast | Alberta Electric System Operator long-term outlook | Peak demand, energy, load scenarios, generation | Alberta; annual/periodic | P0 |
| Connection pipeline | AESO connection project lists and large-load updates | Queue/project, location, requested capacity, stage | Alberta; periodic | P0 |
| Transmission | AESO capability maps, needs documents and plans | Constraint zones, planned projects, timing, capacity where stated | Alberta; periodic | P1 |
| Energy/regulatory | Alberta Utilities Commission decisions and filings | Approved facilities, costs, conditions, schedules | Alberta; event-based | P1 |
| Industry structure | Statistics Canada supply-use tables | Industry commodity inputs and domestic/import shares | Canada/provinces; annual lag | P1 |
| Materials | Statistics Canada producer price and manufacturing tables | Steel, cement, electrical equipment and selected material proxies | Canada; monthly | P1 |
| Population/building demand | Statistics Canada demographics and provincial forecasts | Population and cohort demand drivers | Provincial/CMA; quarterly/annual | P2 |
| Procurement/schedules | Alberta Purchasing Connection and public tender portals | Tender volume, award timing, bid signals | Alberta/municipal; event-based | P2 |

## Intake rule

Each adapter must capture the source metadata defined in the data dictionary, retain a raw-file hash, emit a schema validation report and document any suppression, revision or licensing limitation. Discovery sources can enter the digest but cannot directly calibrate a material model parameter without promotion through evidence review.

## Implemented labour spine

The pipeline normalizes quarterly rows from Statistics Canada table
14-10-0444-01 for NOC 72200, 72201, 72202, 72203, 72402 and 73100. These map to
the electrician, power-line, HVAC and concrete graph nodes. One Alberta extract
supports the pilot model and a second province-preserving extract covers all 13
provinces and territories. Canada totals and economic regions are excluded from
the provincial extract so they cannot silently substitute for local conditions.
Both extracts retain
the table's quality codes and include both job vacancies and average offered
hourly wages. Missing or suppressed values are represented as missing with an
explicit `value_missing_or_suppressed` flag—not as zero.

Job vacancies describe unmet demand, not the number of workers available.
Offered wages are posted offers, not realized earnings. Neither series directly
calibrates a graph edge or proves that a trade is constrained; they are observed
baseline signals for later calibration.

The full Statistics Canada ZIP is retained as a reproducible local cache because
its uncompressed table exceeds one gigabyte. Git versions the retrieval manifest,
content hash, deterministic adapter and normalized extracts instead of the
large provider file.

## Workforce-stock denominator

An intake test found that Statistics Canada table 14-10-0416-01 stops at broad
NOC groups such as 72 and 73. It is retained for later broad-group benchmarking,
but it is not used as a five-digit trade denominator.

The detailed source is 2021 Census table 98-10-0449-01. A selected-coordinate
Statistics Canada Web Data Service request retrieves employed persons for the six
graph-relevant NOC 2021 unit groups across all 13 provinces and territories. This
avoids downloading the full 1.8 GB cube while retaining the official dimension
metadata, request coordinates and raw responses. The counts describe the May
2–8, 2021 reference week, use the 25% long-form sample and are randomly rounded.

Employment is not spare capacity. Any vacancy-to-employment diagnostic must be
described as a recruitment-pressure signal, retain the Census and JVWS quality
flags, and avoid combining suppressed cells with zero. The two surveys also have
different reference periods and sampling designs. The five-year timing gap
between the 2021 Census stock and current vacancy observations must be shown. A
ratio is therefore an explicit analytical construction rather than a published
Statistics Canada measure, and it cannot be labelled a current vacancy rate.
