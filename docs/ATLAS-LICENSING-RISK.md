# ATLAS Licensing Risk Review

**Audit date:** 2026-07-23
**Purpose:** Engineering risk classification for public display, commercial operation, caching, transformation, redistribution and AI use. This is not legal advice. “Safe” means low engineering/legal concern subject to the linked terms and exact dataset; counsel remains the approval authority.

## Decision vocabulary

- **Green:** generally suitable for public/commercial factual use with attribution and disclaimers; verify dataset exceptions.
- **Amber:** usable only with specific conditions, dataset checks, paid plan, agreement or limited display.
- **Red:** do not activate for commercial ATLAS without written license/counsel approval.
- **Black:** listed use directly conflicts with known terms or there is no provider/contract.

## Required machine-enforced rights

Every dataset version must carry independent flags and evidence for:

`publicDisplay`, `commercialUse`, `cache`, `rawRetention`, `transform`, `derivedMetrics`, `redistribute`, `apiExport`, `widgetExport`, `textExcerpt`, `mediaMirror`, `vectorIndex`, `llmPromptUse`, `modelTraining`, `allowedRegions`, `maxRetention`, `requiredAttribution`, `termsUrl`, `termsVersion`, `verifiedAt`, `counselDecision`, `contractId`.

Default is **deny** for any missing flag. Provider-level assumptions must never override dataset/item-level restrictions.

## Provider legal matrix

| Provider | Public website | Commercial use | Attribution | Key/agreement | Cache/retain | Redistribute/API | Mirror content | AI/ML | Decision |
|---|---|---|---|---|---|---|---|---|---|
| USGS Earthquake | Generally safe | Generally safe for U.S. government data | Credit USGS; no endorsement | None | Generally permitted; preserve corrections | Generally permitted for government-produced data; inspect product exceptions | Third-party media/products may differ | Dataset-specific; government status is not blanket training permission | **Green** |
| Smithsonian GVP | Safe with citation | Database generally reusable; verify contributed assets | Required GVP/database citation | None | Database use generally possible | Verify database/download terms and reference sources | Do not mirror contributed images/text without rights | Separate approval assessment | **Amber-Green** |
| tsunami.gov | Safe as secondary display | Generally safe | NOAA/NWS + center; warnings/disclaimer | None | Retain lifecycle messages for audit; stale labels | Factual government messages generally reusable | Avoid mirroring unrelated site media | Not a training source by default | **Green with safety controls** |
| GDACS | Safe with disclaimer | Reuse generally allowed under EC policy/CC BY where stated | “GDACS”/EC JRC and change indication | None | Cache/history allowed only under exact terms/product | Attribution must follow into exports | Item/resource licenses may differ | Derived analytics allowed only if input terms permit | **Amber-Green** |
| NASA FIRMS | Safe as detections | Generally usable subject to underlying product/data policy | NASA FIRMS + MODIS/VIIRS dataset citation | Free MAP_KEY | Cache/retain per product policy; do not evade quota | Verify each science product and bulk redistribution | Imagery has separate rules | Training rights not assumed | **Amber** |
| NOAA/NHC | Safe as secondary display | Generally safe | NOAA/NHC; experimental and safety disclaimer | None | Cache advisories/revisions; label stale | Generally reusable government product; linked GIS layers may carry metadata | No logo/endorsement | Not default training corpus | **Green with high safety risk** |
| Open-Meteo | Free host only non-commercial; paid host public/commercial | Commercial plan or compliant self-host required | CC BY 4.0; visible “Weather data by Open-Meteo.com,” link, changes | Paid API key for hosted commercial use | Data CC BY permits reuse; SaaS access terms/plan apply | Data redistribution allowed under CC BY with attribution; do not resell service access | N/A | Data/model-source licenses and plan must be checked for training | **Red on free host for commercial; Amber paid** |
| NOAA/NCEI | Usually safe | Usually safe for government-produced datasets | Cite NOAA/NCEI + dataset/version | API-dependent | Dataset-specific | Dataset-specific third-party exceptions | Media not implied | Dataset-specific | **Amber-Green** |
| NASA/JPL/CNEOS news | Linking safe | Factual metadata generally low risk; article/media reuse restricted | NASA/JPL/CNEOS; Caltech/third-party notices | None | Cache metadata/minimal excerpt only | Do not redistribute full content | Do not mirror images/articles by default | No training assumption | **Amber** |
| ReliefWeb API v2 | Linking and API metadata display allowed | Partner-provided reports may be copyrighted | ReliefWeb / UN OCHA plus named original source | Pre-approved appname required | Cache metadata and bounded API description; 1,000 calls/day | Do not republish full partner reports | No attachments/media | No AI use approved in Phase 2 | **Amber; configuration required** |
| NASA Open APIs/NeoWs | Dataset-specific | Dataset-specific, generally factual data usable | NASA/JPL + endpoint-specific | API key | Endpoint-specific | Endpoint-specific | APOD/media often third-party; never blanket mirror | Endpoint-specific/no assumption | **Amber** |
| ESA news | Linking safe | Commercial republication not automatic | ESA and item attribution | None | Metadata and bounded feed excerpt only | No full-text redistribution | Do not mirror media | No training without permission | **Amber for Phase 2 metadata/link display** |
| NOAA SWPC | Generally safe | Generally safe | NOAA/SWPC + product/satellite; experimental labels | None | Cache observations/advisories with product revision | Usually government data; verify linked partner products | Product images may differ | Dataset-specific | **Amber-Green** |
| CelesTrak | Public display subject to policy | Commercial/redistribution status not sufficiently documented in master | CelesTrak and upstream data | No key; strict responsible-use policy | At least two-hour cache; one download/update | Written clarification recommended before bulk redistribution/API | N/A | No training assumption | **Red-Amber / Research** |
| OpenAI/Google/NVIDIA/Hugging Face/Microsoft company feeds | Linking and headlines usually lower risk | Full-content commercial reuse not granted by RSS | Publisher/author + canonical link | None | Metadata and short excerpt only | Do not redistribute articles | No images/full text by default | Do not train/index full content without permission; vector indexing is a rights use | **Amber** |
| Anthropic/Meta pages | Page linking safe | Automated scraping/reuse unapproved | Publisher + link | No machine contract | Do not cache scraped content | No | No | No | **Red / Research** |
| CISA KEV | Generally safe | Generally safe government data | Cite CISA; no endorsement | None | Cache revisions | Generally suitable; keep source notice | N/A | No blanket training assumption | **Green** |
| NIST NVD | Safe if notice shown | Generally safe public-domain NIST enrichment | Required prominent notice: product uses NVD API but is not endorsed/certified | Optional key + API terms | Cache local repository consistent with best practices/terms | Preserve notice and provenance | N/A | Separate determination | **Green-Amber** |
| CVE List | Safe under CVE terms | Usually usable subject to CVE terms/marks and CNA content | CVE Program/CNA provenance | GitHub/platform terms | Local mirror technically intended, but follow repository license/terms | Preserve record provenance/marks | N/A | Separate determination | **Amber-Green** |
| CERT/CC | Linking safe | Repository/content license controls | CERT/CC/CMU | None/GitHub | Only as repository license permits | Do not republish narrative outside license | No | Separate permission | **Amber** |
| Alternative.me Fear & Greed | Public display only with exact branding/attribution | Terms and production fit require review | Required prominent Alternative.me attribution | Keyless | Daily cache likely, exact terms control | Do not relabel or redistribute as ATLAS/global | No | Do not use to train ATLAS metric | **Red / unsuitable product fit** |
| Twelve Data | Public display only on entitled business plan | Business/enterprise plan + exchange approvals | Contract/exchange-specific | API key, subscription, possibly exchange agreements | Contract-specific | Redistribution/external display require appropriate tier/addenda | N/A | Derived analytics/non-display and model use require explicit contract | **Red until enterprise contract** |
| CoinGecko | Keyless public intended for testing/non-commercial | Paid production plan/terms required | Plan/provider attribution | Demo/Pro key for production | Plan-specific | Plan-specific; no blanket resale | N/A | Contract-specific | **Red-Amber until contract** |
| EIA | Generally safe | Generally safe government statistics | Cite U.S. EIA; no endorsement | Free API key + terms agreement | Generally permitted; preserve revisions | Generally permissible subject to reuse policy | Charts/media may differ | Dataset-specific | **Green-Amber** |
| IMF | Public data display allowed under special data terms | Potential commercial reuse should be referred to IMF copyright contact; third-party data differs | “Source: IMF, Database Name, link”; disclose material transformation | Public API; terms bind access | Reasonable storage of eligible statistical data subject to terms | Data distribution allowed with pass-through terms; standalone sale disclosure | IMF prose/content all-rights-reserved | IMF expressly forbids LLM training without permission | **Amber-Red for commercial/AI** |
| World Bank | Dataset catalog often CC BY 4.0 with additions | Dataset terms may allow commercial use; general API terms create ambiguity for commercial API use | World Bank + dataset, pass-through acknowledgment | None | Dataset-specific | Dataset-specific; API/general terms require reconciliation | No blanket media rights | No training assumption | **Amber; counsel reconcile terms** |
| FRED | Personal/noncommercial access possible | Third-party series need owner permission; commercial rights not granted blanket | Required FRED notice + underlying source | API key + terms | **API terms prohibit storing/caching/archiving FRED content** | Third-party content cannot be commercially redistributed without permission | No | **FRED API/content cannot be used for AI/ML training** | **Black for proposed persistent/AI architecture; replace with original owners** |
| ECB | Generally safe under ECB reuse policy | Often permitted with attribution; third-party series exceptions | ECB + series/source | None | Dataset-specific | Dataset-specific | ECB marks/media separate | No training assumption | **Amber-Green** |
| OpenSky | Public/live operational use requires agreement | Commercial entities require written license regardless of purpose | Required citation/attribution | OAuth2; **prior written operational agreement**; commercial license | Contract-specific | Contract-specific; do not expose raw bulk data | N/A | Contract-specific | **Red; keep Disabled** |
| FAA | Unknown until exact product | Unknown | Product-specific | SWIM/public-product agreement TBD | Unknown | Unknown | Unknown | Unknown | **Black/Research** |
| AviationWeather.gov | Safe as secondary display | Generally government-data use | NOAA/NWS/AWC; operational disclaimer | None | Cache within product validity; do not serve stale as current | Generally reusable, product metadata controls | No blanket imagery | No training assumption | **Green with safety controls** |
| NOAA NDBC/NWS marine | Safe as secondary display | Generally safe | NOAA/NDBC/NWS; User-Agent and disclaimers | None | Cache by cadence; preserve provisional flags | Generally reusable with source attribution | Linked partner assets may differ | Dataset-specific | **Green-Amber** |
| AIS | No provider chosen | Enterprise license mandatory | Contract-specific | Paid agreement | Typically tightly restricted | Typically restricted/no raw redistribution | N/A | Contract-specific | **Black until procurement** |
| WHO DON | Linking safe | WHO content copyright; commercial/republication permission not assumed | WHO, title/date/link; logo prohibited | API contract unclear | Metadata/minimal excerpt until approved | No full-text mirroring; API reuse must be confirmed | No images/full text | Separate permission; health data governance | **Red-Amber / Research** |
| CDC/Socrata | Dataset-specific, often safe | Government works generally usable, third-party/privacy exceptions | CDC + dataset | Optional app token | Dataset/privacy/suppression-specific | Dataset-specific | Media/logos restricted | Dataset-specific | **Amber per dataset** |
| OpenAQ | Public use with upstream license compliance | Per-source license field decides commercial use | OpenAQ + original owner/license | X-API-Key | Per-source license/terms | Per-source redistribution flags must be enforced | N/A | Per-source license | **Amber-Red until license-aware pipeline** |

## High-risk corrections to the master

1. FRED must not be described merely as “third-party series need checks.” Its current terms conflict with persistent caching/archiving and AI use. Prefer original publishers.
2. Twelve Data/CoinGecko should be Research/procurement, not implementation-ready Planned, for a public commercial platform.
3. WHO should remain Research until exact API terms and endpoint are approved.
4. Open-Meteo free-host use must be blocked automatically when ATLAS becomes commercial; paid host uses `customer-api.open-meteo.com` and an API key.
5. JPL/CNEOS/NASA company/editorial feeds should store metadata and minimal excerpts, not mirrored articles or imagery.
6. World Bank API general terms and dataset open-data terms should be reconciled by counsel for the exact use pattern.
7. IMF data can be distributed under stated conditions, but commercial reuse should be referred to IMF and LLM training is prohibited without permission.

## Attribution architecture

Every rendered datum, chart, map tile/layer, exported row, widget and AI answer needs an attribution manifest generated from its lineage. Required structure:

- display name and owner;
- dataset/product and version;
- canonical item/dataset URL;
- license/terms URL and version/date;
- required wording and license link;
- modification/derivation disclosure;
- upstream sources and third-party notices;
- no-endorsement/safety disclaimer;
- export and AI-use restrictions.

Attribution cannot be a single footer string because composite charts and metrics contain multiple sources.

## Content storage policy

- Government structured facts: retain as terms permit, preserving revisions and raw hashes.
- RSS/editorial content: store GUID, URL, title, author, timestamps, tags and minimal permitted excerpt; fetch-on-click from publisher; no default image/full-text mirror.
- Market/AIS/aviation tracks: contract-specific encrypted storage, retention and export control.
- Health/conflict: minimize precision and personal/sensitive data; document suppression.
- Vector search: indexing text is a copy/processing use. Only index sources with explicit permission; otherwise index ATLAS-authored summaries and factual metadata.
- LLM prompts: passing third-party content to a model is a use/disclosure. Require explicit `llmPromptUse` rights and provider/data-processing approval.

## Approval gates

No source moves to Active without:

1. exact product/dataset and endpoints;
2. first-party docs and current terms snapshots;
3. verified access/auth/rate plan;
4. written allowed-use matrix;
5. attribution fixture tested in UI/export/report;
6. retention/cache/export enforcement tests;
7. counsel/procurement decision for Amber/Red sources;
8. owner and annual review date;
9. termination plan for license expiry;
10. evidence that derived metrics and AI uses are permitted.
