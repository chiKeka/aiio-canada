# Initial source register

This is the human-readable planning register. The database and machine-readable registry will become authoritative once adapters are implemented. URLs and access methods must be revalidated at ingestion time.

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
