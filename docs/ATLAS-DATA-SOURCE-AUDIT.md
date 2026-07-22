# ATLAS Data Source Master — Engineering Audit

**Role:** ATLAS Chief Data Architect  
**Audit date:** 2026-07-22  
**Scope:** `docs/ATLAS-DATA-SOURCE-MASTER.md`, current source registry, `AtlasEvent`, dashboard surfaces, and first-party provider documentation/terms  
**Method:** line-by-line specification review; exact endpoint probes where possible; first-party documentation and terms review; repository-to-document reconciliation. HTTP success is evidence of reachability only—not SLA, license, fitness, or authority.

## A. Executive summary

The master is a strong planning document but is **not yet safe to operate as the highest-level production source of truth without an auditable source registry and legal approvals**. It correctly distinguishes active from planned sources, emphasizes provenance, and avoids fabricated values. However, it mixes providers, datasets, editorial feeds, candidate vendors, and non-sources at one abstraction level. Several endpoint claims are wrong or stale; several “official” labels describe an aggregator rather than the data owner; and the current `AtlasEvent` is unsuitable as the universal record for observations, time series, trajectories, forecasts, polygons, publications, entities, and relationships.

Critical audit findings:

1. **Three listed feeds are operationally wrong/degraded:** NVIDIA AI feed returns 404; Microsoft AI feed returns 410; JPL RSS returns 403 to an ordinary server client despite being configured Active. Google’s AI URL redirects to a valid official feed.
2. **FRED is materially more restricted than the master implies:** current terms prohibit API use for AI training and for storing/caching/archiving FRED content, and third-party series need permission beyond personal use. FRED is unsuitable for the proposed persistent ATLAS data/AI architecture unless series-specific and contractual approval is obtained.
3. **IMF endpoint strategy is stale:** the master points at DataMapper. DataMapper v2 remains usable for its subset, but the legacy IMF portal was retired in November 2025 and the new IMF Data Portal/SDMX API is the system of record. The source must be redesigned per dataset.
4. **OpenSky must remain Disabled:** any operational REST use requires prior written agreement; commercial entities require a written license. OAuth2 client credentials is technically correct.
5. **Open-Meteo is technically Active but commercially conditional:** the free host is non-commercial only; commercial production requires a paid customer endpoint/API key or compliant self-hosting. Data are CC BY 4.0 with attribution.
6. **“Official RSS architecture” is not a provider and cannot be Active.** It is an ingestion policy/capability.
7. **Provider duplication is substantial but often legitimate:** NOAA/NWS/NHC/SWPC/NCEI/NDBC/AWC and NASA/JPL/CNEOS/FIRMS/NeoWs are organizational hierarchies, not duplicate sources. Consolidate credentials, policies, adapters and provenance, but preserve product-level source IDs.
8. **Scaling to 100 sources is feasible after refactoring; 500 is difficult; 1,000 is unsafe with the current registry/model.** A typed data platform, source contracts, schema registry, provenance ledger, observation/time-series store, geospatial store, relationship graph, and source control plane are prerequisites.
9. **Computed metrics are not production-ready.** Disaster Pressure and Cyber Threat are the most defensible first metrics. “Earth Mood,” “Fear,” and “Greed” are ambiguous or brand-confusable and should be renamed or withheld until validated.
10. **Production readiness:** current five integrations are a prototype-quality active subset. USGS is the strongest. NHC carries an experimental-feed disclaimer, JPL has an access failure, Open-Meteo has commercial conditions, and the platform has no durable source-contract/legal control plane.

## B. Strengths

- Clear Active/Planned/Disabled/Research distinction and explicit prohibition on fabricated fallback data.
- Good preference for first-party government/agency sources and original links.
- Sensible recognition that RSS availability does not grant republication rights.
- Correct distinction between events and future observations/time series in principle.
- Good warnings around market entitlements, AIS, OpenSky, Open-Meteo, WHO, ESA, and company content.
- Versioning, stale labels, tombstones, input citations, confidence, and reproducibility are correctly identified as requirements.
- Roadmap delays composite intelligence until domain data exists.

## C. Weaknesses

- No evidence field: `verifiedAt`, verifier, HTTP result, schema version/hash, terms version/hash, counsel decision, contract ID, and allowed uses are absent.
- “Official owner,” “publisher,” “operator,” “aggregator,” and “data originator” are conflated.
- Uptime is mostly guessed qualitatively; most free public endpoints publish no SLA.
- Candidate URLs are mixed with approved endpoints; several are known broken.
- Source IDs are inconsistent in granularity (`eia-oil` and `eia-v2`; `nasa-open-api` and `nasa-neows`).
- GraphQL is not used by any selected source and should not appear as an expected capability. REST/file/RSS/Atom/CAP/SDMX/WMS/WFS dominate.
- Refresh and cache are conflated. Poll cadence, freshness SLO, cache TTL, retention and backfill cadence need separate fields.
- `AtlasEvent.metadata` is an escape hatch, not a sustainable schema strategy.
- Geographic “global” is sometimes technically true but operationally misleading due to sensor, language, basin or national coverage bias.

## D. Incorrect assumptions and verification findings

### Provider verification matrix

Scores: reliability 1–5 (5 strongest); implementation/maintenance difficulty L/M/H; risk L/M/H/Critical. “Uptime” means published commitment where known; otherwise “no public SLA.”

| Provider / classification | Purpose; owner | Official website / documentation | Official API / RSS; protocols | Authentication and rate limits | Coverage, history, latency, uptime | Cache / refresh | Atlas mapping | Scores; priority |
|---|---|---|---|---|---|---|---|---|
| USGS Earthquake — **ACTIVE** | Earthquakes; U.S. Geological Survey | [USGS Earthquakes](https://earthquake.usgs.gov/); [GeoJSON](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php), [FDSN](https://earthquake.usgs.gov/fdsnws/event/1/) | REST/file; GeoJSON/JSON, CSV, KML, QuakeML/XML; Atom also available; no GraphQL | None; responsible use, no published SLA quota | Worldwide with magnitude completeness variance; catalog history; feed updates ~60 s; no public SLA | cache 60 s; poll 60 s | Natural `earthquake`; detail products need product/geometry extensions | R5; I-L/M-M/R-L; **P0** |
| Smithsonian GVP — **PLANNED** | Volcano reports/catalog; Smithsonian GVP | [GVP](https://volcano.si.edu/), [terms](https://volcano.si.edu/gvp_termsofuse.cfm) | Weekly RSS `https://volcano.si.edu/news/WeeklyVolcanoRSS.xml` verified 200; database/webservices/downloads; XML/structured downloads | None; no published rate | Global volcano/eruption catalog ~12,000 years; weekly report latency; no SLA | 6 h / 6 h | `volcano`; report, eruption, volcano entity and references require extensions | R4; I-M/M-M/R-M; **P1** |
| tsunami.gov — **PLANNED** | Tsunami messages; NOAA/NWS NTWC/PTWC | [subscriptions/CAP](https://www.tsunami.gov/php/content/productRetrieval.php) | Atom and CAP XML endpoints verified; signed CAP-TSU; no JSON/GeoJSON/GraphQL | None; no published quota | Defined warning-center service regions, not every national authority; recent feed; minutes; no SLA | 60 s / 60 s | `tsunami` category missing; polygons/areas and CAP lifecycle need extension | R5; I-M/M-M/R-H safety; **P0** |
| GDACS — **PLANNED** | Global major multi-hazard alert aggregation; UN/EC JRC | [GDACS](https://www.gdacs.org/), [API guide](https://www.gdacs.org/Documents/2025/GDACS_API_quickstart_v1.pdf) | REST GeoJSON/JSON; GeoRSS/XML; KML; feed verified | None; free; no formal public SLA/quota stated in guide | Global major hazards; queryable history; minutes-hours/model-dependent | 15 min / 15 min | Multiple categories; event/episode/polygon/source-chain requires extension | R4; I-M/M-M/R-M; **P0** bridge, not sole authority |
| NASA FIRMS — **PLANNED** | Thermal anomalies; NASA EOSDIS/LANCE FIRMS | [API](https://firms.modaps.eosdis.nasa.gov/api/) | REST-like downloads; CSV, SHP, KML; WMS/WFS; no RSS/GraphQL | Free MAP_KEY; 5,000 transactions/10 min | Global MODIS/VIIRS; NRT generally under hours, not confirmed fires; archive available | 10 min / 10–15 min | Does **not** naturally map one detection to one event; observation + clustering model required | R4; I-H/M-H/R-H; **P0** after observation model |
| NOAA/NHC — **ACTIVE, CONDITIONAL** | Tropical cyclone advisories; NOAA/NWS NHC/CPHC | [RSS](https://www.nhc.noaa.gov/aboutrss.shtml), [GIS](https://www.nhc.noaa.gov/gis/rss.php) | RSS/XML linking SHP/KML/GeoTIFF; feeds verified; no GraphQL | None; experimental service | Atlantic/East/Central Pacific only; live plus best-track archives; advisory cadence; no SLA and explicit delivery warning | 5 min / 5 min | `cyclone`; tracks, cones, forecast times, watches require first-class geometry/version model | R4; I-M/M-H/R-H safety; **P0** |
| Open-Meteo — **ACTIVE, COMMERCIAL-BLOCKED on free host** | Weather model aggregation; OpenMeteo GmbH | [docs](https://open-meteo.com/en/docs), [terms](https://open-meteo.com/en/terms) | REST; JSON, CSV/XLSX; no RSS/GraphQL | Free host keyless: 600/min, 5,000/h, 10,000/day, 300,000/month, non-commercial. Commercial customer endpoint uses API key; paid target 99.9% uptime | Global model grids; forecast/history products; minutes-hours model latency | 15 min / 15 min | Routine values are observations/forecasts, not events; current weather snapshot is separate legacy model | R4 paid/R3 free; I-M/M-M/R-H commercial; **P0 conditional** |
| NOAA/NCEI — **PLANNED** | Climate archive; NOAA NCEI | [Access Data Service](https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation) | REST; JSON/CSV; dataset-specific services | No token for ADS; CDO uses token; limits vary | Dataset-dependent global/station coverage and deep history; hours-months latency; no blanket SLA | 6–24 h / dataset cadence | Needs observation/series/dataset model; `climate` category absent | R5; I-H/M-H/R-M; **P1** |
| JPL News — **ACTIVE but DEGRADED** | NASA/JPL publications; NASA/JPL/Caltech | [JPL RSS page](https://www.jpl.nasa.gov/rss/) | RSS URL returns 403 to ordinary server client in audit; XML expected | None advertised; effective anti-bot/access control | Global mission editorial content; archive; editorial latency; no SLA | 15–60 min / 30 min | `space` or `technology`; publication subtype/language/rights needed | R2 operationally; I-M/M-H/R-H; **P0 repair or disable** |
| NASA Open APIs — **PLANNED, TOO BROAD** | Multiple NASA datasets; NASA | [api.nasa.gov](https://api.nasa.gov/) | REST JSON per product; no single RSS/GeoJSON contract | API key; default 1,000/h; DEMO_KEY 30/h/IP and 50/day/IP | Dataset-specific; no blanket latency/history/SLA | Per product / never one global cadence | Must be split into dataset source IDs and typed models | R4; I-H/M-H/R-M; **P1 per endpoint** |
| ESA News — **RESEARCH** | ESA publications; European Space Agency | [ESA activities feed page](https://www.esa.int/rssfeed/Our_Activities) | RSS/XML, but master does not record exact final endpoint | None; no rate/SLA | Global ESA missions; editorial feed/archive | 30–60 min | `space` publication; content rights fields needed | R3; I-M/M-M/R-H copyright; **P1 after exact feed/license** |
| CNEOS News — **ACTIVE** | NEO publications; NASA/JPL CNEOS | [CNEOS](https://cneos.jpl.nasa.gov/) | RSS `https://cneos.jpl.nasa.gov/feed/news.xml` verified 200 | None | Global editorial content; feed window; no SLA | 30 min / 30 min | `space` publication; natural with minor publication fields | R4; I-L/M-M/R-L/M; **P0** |
| NeoWs — **PLANNED** | Close approaches; NASA/JPL | [Open APIs/NeoWs](https://api.nasa.gov/) | REST JSON | NASA key; same default quota | Global NEO catalog/approaches; date/browse history; hours; no SLA | 6 h / 6 h | Close approach can be `space`, but object entity and multiple approaches require graph/entity model | R4; I-M/M-M/R-M; **P1** |
| NOAA SWPC — **PLANNED** | Space weather; NOAA/NWS SWPC | [data service](https://services.swpc.noaa.gov/) | JSON/text file products; REST-like static service; no GraphQL | None; no published quota/SLA | Near-Earth space weather; seconds-days; archives elsewhere | 1–5 min / product cadence | Measurements need time-series; watches/warnings can be `space`; source satellite/provenance needed | R4; I-H/M-H/R-H scientific; **P1** |
| CelesTrak GP — **RESEARCH** | Orbital elements; CelesTrak, derived from SSN | [GP docs](https://celestrak.org/NORAD/documentation/gp-data-formats.php), [policy](https://celestrak.org/usage-policy.php) | Query endpoint; OMM JSON/XML/CSV/KVN/TLE | None; one download per update, GP updates 2 h; bandwidth enforcement | Broad Earth orbit groups, not authoritative live position; current/limited history; no SLA | >=2 h / 2 h | Not an event. Needs satellite entity, ephemeris/orbit observation and derived-position provenance | R3; I-H/M-H/R-H; **P2** |
| OpenAI News — **PLANNED** | First-party company news; OpenAI | [News](https://openai.com/news/) | Official RSS `https://openai.com/news/rss.xml` verified 200 XML | None; no SLA/rate | Global editorial feed/archive | 30–60 min | `technology` publication; content/rights fields needed | R4; I-L/M-M/R-M copyright; **P1** |
| Anthropic News — **RESEARCH** | First-party company news; Anthropic | [News](https://www.anthropic.com/news) | No approved official machine feed documented | None to read | Editorial page; no API SLA/history contract | N/A | HTML scraping is unsuitable; manual/partner feed only | R1; I-H/M-H/R-H; **P2** |
| Google AI Blog — **PLANNED** | First-party AI news; Google | [AI topic](https://blog.google/innovation-and-ai/technology/ai/) | Listed URL redirects to valid official RSS XML | None; no SLA | Global editorial feed/archive | 30–60 min | `technology` publication | R4; I-L/M-M/R-M; **P1** |
| Meta AI News — **RESEARCH** | First-party AI news; Meta | [Meta AI blog](https://ai.meta.com/blog/) | No approved machine feed documented | None to read | Editorial page; no SLA | N/A | No scraper until permission/endpoint | R1; I-H/M-H/R-H; **P2** |
| NVIDIA AI News — **WRONG** | First-party AI news; NVIDIA | [NVIDIA blog](https://blogs.nvidia.com/) | Master `/category/ai/feed/` returns 404. General `/feed/` and `/category/generative-ai/feed/` return 200 RSS, but scope differs | None; no SLA | Editorial | 30–60 min after corrected selection | `technology` publication | R1 as listed/R4 corrected; I-L/M-M/R-M; **P1 repair** |
| Hugging Face Blog — **PLANNED** | First-party/company-community blog; Hugging Face | [blog](https://huggingface.co/blog) | `https://huggingface.co/blog/feed.xml` verified 200 RSS | None; no SLA | Global; archive/feed | 1 h / 1 h | `technology` publication; author and per-artifact license required | R3; I-L/M-M/R-M; **P2** |
| Microsoft AI Blog — **DEPRECATED/WRONG** | First-party AI news; Microsoft | [AI topic](https://news.microsoft.com/source/topics/ai/) | Master `/ai/feed/` returns 410. General `https://blogs.microsoft.com/feed/` returns RSS but is not AI-specific | None; no SLA | Editorial | 30–60 min after replacement | `technology` publication | R1 listed; I-M/M-H/R-M; **P1 repair** |
| CISA KEV — **PLANNED** | Exploited vulnerabilities; U.S. CISA | [catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | JSON/CSV, endpoint verified; REST-like file | None; no published quota/SLA | Global products; full living catalog; additions irregular | 1 h / 1 h | Natural `cyber` change event; catalog snapshot itself is state | R5; I-L/M-M/R-L; **P0/P1** |
| NIST NVD — **PLANNED** | CVE enrichment; NIST | [API 2.0](https://nvd.nist.gov/developers/vulnerabilities) | REST JSON; endpoint verified | Optional API key: 5 requests/30 s public, 50/30 s keyed; incremental no more often than ~2 h recommended | Global CVEs; broad history; enrichment backlog possible; no SLA | 2 h / 2 h | `cyber` publication/modification events plus vulnerability entity/version model | R4; I-H/M-H/R-M; **P1** |
| CVE List — **PLANNED** | Canonical CVE records; CVE Program | [downloads](https://www.cve.org/Downloads) | GitHub releases/repo, CVE JSON 5.x; CVE Services is for CNA workflows, not public read dependency | GitHub access; platform limits | Global CVE corpus/history | 1 h / release cadence | Vulnerability entities and record changes; `cyber` events | R5; I-M/M-M/R-M; **P1** |
| CERT/CC VU — **PLANNED** | Coordinated vulnerability notes; CMU SEI CERT/CC | [VU database](https://www.kb.cert.org/vuls/), [archive](https://github.com/CERTCC/Vulnerability-Data-Archive) | Git repository/files; not a guaranteed RSS/API | GitHub limits | Selective global notes/history; editorial latency | 1–6 h | `cyber` publication plus CVE/vendor relationships | R4; I-M/M-M/R-M/H rights; **P1** |
| Alternative.me Fear & Greed — **UNSUITABLE for ATLAS global metric** | Crypto sentiment; Alternative.me | [API](https://alternative.me/crypto/fear-and-greed-index/) | REST JSON/CSV | Keyless; provider limits not a production SLA | Crypto-only; daily and history | 24 h | If used, `market` observation named explicitly; never “global” | R2; I-L/M-L/R-H product confusion; **P2/no ingest preferred** |
| Twelve Data stocks/FX/gold — **RESEARCH, not PLANNED** | Aggregated market data; Twelve Data and upstream exchanges | [docs](https://twelvedata.com/docs), [terms](https://twelvedata.com/terms) | REST JSON/CSV and WebSocket; no RSS/GraphQL | API key; credits/plan. Business/external display and redistribution need business tier/addenda; non-U.S. approvals possible | Multi-market, plan-specific history/latency; paid Enterprise advertises 99.99% SLA | entitlement-specific | Observations/bars, not events; instrument/venue/delay/license model required | R4 paid; I-H/M-H/R-Critical rights; **P1 procurement gate** |
| CoinGecko — **RESEARCH for production** | Crypto market aggregation; CoinGecko | [docs](https://docs.coingecko.com/) | REST JSON; keyless public endpoint verified | Keyless public is low-volume testing/non-commercial; Demo/Pro keys and plan-specific quotas | Global crypto aggregation; plan history; variable latency; paid SLA plan-specific | 1–5 min | Market observations/instruments; not events by default | R3 public/R4 paid; I-M/M-M/R-H; **P1 contract** |
| EIA oil + EIA v2 — **PLANNED; DUPLICATE source IDs** | Official energy/oil statistics; U.S. EIA | [API v2](https://www.eia.gov/opendata/documentation.php) | REST JSON/XML; bulk files | Free API key mandatory; request throttles and 5,000 JSON-row limit; exact rate tolerance not fixed publicly | U.S.-centric plus international series; long history; hourly to annual; no SLA | cadence + 1 h / cadence | Series observations; `energy` release events. One provider adapter, dataset children | R5; I-M/M-M/R-L/M; **P1** |
| IMF Data — **WRONG/STALE endpoint strategy** | Macro data; IMF | [new data portal](https://data.imf.org/), [terms](https://www.imf.org/en/about/copyright-and-terms) | DataMapper v2 JSON remains for subset; new portal SDMX/API is system of record; old portal retired 2025-11-05 | Public access; dataset/API-specific | Global/member economies; long history; release cadence; no blanket SLA | 24 h / release cadence | Macro series/vintages, not events. Dataset/source IDs mandatory | R3 until migrated; I-H/M-H/R-H; **P1 redesign** |
| World Bank Indicators — **PLANNED, LEGAL REVIEW** | Development indicators; World Bank Group | [API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392), [dataset terms](https://data.worldbank.org/summary-terms-of-use) | REST JSON/XML | None; reasonable use, no explicit SLA | Global economies, long annual/quarterly history; release latency | 24 h / daily | Observations/series; country/entity model | R4; I-M/M-M/R-M/H because API general terms and dataset terms must be reconciled; **P1** |
| FRED — **UNSUITABLE unless narrowly approved** | Macro aggregator; Federal Reserve Bank of St. Louis + upstream owners | [API](https://fred.stlouisfed.org/docs/api/fred/), [terms](https://fred.stlouisfed.org/legal/) | REST JSON/XML | API key; discretionary limits | Broad U.S./selected global history; source cadence; no SLA | **Terms prohibit API caching/archiving**; do not prescribe persistent cache | Current ATLAS architecture conflicts with terms; AI training explicitly prohibited; use direct owners instead | R4 technical/R1 legal fit; I-H/M-H/R-Critical; **Replace/direct-source** |
| ECB Data API — **PLANNED** | Euro-area macro/financial statistics; ECB | [API](https://data.ecb.europa.eu/help/api/overview) | REST-style SDMX JSON/CSV/XML | None; reasonable-use limits/no blanket SLA | Euro area + related series; long history; release cadence | 6–24 h / release cadence | Observation/series/vintage model; release `market` event optional | R5; I-H/M-M/R-M; **P1** |
| OpenSky — **DISABLED** | Aircraft state vectors; OpenSky Network Association | [API](https://openskynetwork.github.io/opensky-api/), [terms](https://opensky-network.org/about/terms-of-use) | REST JSON; OAuth2 client credentials, 30-min bearer tokens | Anonymous 400 credits/day; standard 4,000/day; global state call costs 4; licensed 14,400/hour. Operational use requires written agreement; commercial entity requires written license | Sensor-dependent global, strongest Europe/U.S.; live, REST history <=1 h; research history via Trino; no public SLA | 10–30 s after license | State vectors are observations/trajectories, not events | R3; I-H/M-H/R-Critical; **P2 enterprise license** |
| FAA — **RESEARCH** | U.S. airspace/operational status; FAA | [data portal](https://www.faa.gov/data_research) | No exact supported public endpoint selected; SWIM products can require agreement/credentials | TBD | U.S.; product-specific | TBD | Cannot design adapter/category without product | R1 as specified; I-H/M-H/R-H; **P2** |
| AviationWeather.gov — **PLANNED** | METAR/TAF/SIGMET; NOAA/NWS AWC | [API](https://aviationweather.gov/data/api/) | REST JSON/GeoJSON/XML/CSV; endpoint verified | None; documented request limits and query-window restrictions | Global reports/U.S.-centered hazards; near-real-time; limited API history; no SLA | 1–5 min / product cadence | Reports are observations; SIGMET/AIRMET are `aviation` events with polygon/validity | R5; I-M/M-H/R-H safety; **P1** |
| NOAA marine/NDBC/NWS — **PLANNED, TOO BROAD** | Buoys and marine warnings; NOAA NDBC/NWS | [NDBC guide](https://www.ndbc.noaa.gov/docs/ndbc_web_data_guide.pdf), [weather.gov API](https://www.weather.gov/documentation/services-web-api) | NDBC text, NWS REST JSON-LD/CAP; latest observations verified | None; NWS requires identifying User-Agent; rate not numerically guaranteed | U.S. waters + partner buoys; station-specific history; minutes | 5–15 min | Separate `ndbc-observations` and `nws-marine-alerts`; observation vs `marine` event | R4; I-H/M-H/R-M/H; **P1** |
| Global AIS provider — **RESEARCH** | Vessel positions; no owner/provider selected | No official website/docs/API/RSS selected | Likely REST/WebSocket JSON or NMEA-derived; paid credentials | Contract/enterprise license required | Coverage/history/latency/SLA contract-specific | contract-specific | Trajectories/entities, not events; privacy/security policies needed | R0 until procured; I-H/M-H/R-Critical; **P2** |
| WHO DON — **RESEARCH, not implementation-ready Planned** | Disease outbreak publications; WHO | [DON](https://www.who.int/emergencies/disease-outbreak-news), [copyright](https://www.who.int/about/policies/publishing/copyright) | Sitefinity JSON help exists, but exact stable query/pagination endpoint absent from master; no official RSS recorded | None documented | Global editorial outbreak reports/history; variable latency; no API SLA | 1 h after contract | `health` publication/event; affected geography/case observations and revisions need extensions | R2; I-H/M-H/R-H rights/schema; **P1 research gate** |
| CDC data/RSS — **RESEARCH, TOO BROAD** | U.S. health datasets/notices; CDC | [data portal](https://data.cdc.gov/) | Socrata REST JSON/CSV by dataset; RSS dataset/site-specific | Optional app token for higher limits | Primarily U.S.; dataset-specific history/latency/SLA | dataset cadence | Must choose dataset. Observations + health alerts; privacy/suppression metadata required | R3; I-H/M-H/R-H; **P1 per dataset** |
| OpenAQ v3 — **DISABLED, MISSING FROM MASTER INVENTORY** | Air-quality aggregation; OpenAQ + source owners | [API](https://docs.openaq.org/api), [licenses](https://docs.openaq.org/resources/licenses) | REST JSON | X-API-Key; key-scoped rate limits | Global but station/source uneven; history depends source | 15–60 min | Observations, locations/sensors; per-record source license must flow through | R4; I-H/M-H/R-H licensing; **P1** |

### Protocol audit

- **REST/HTTP JSON:** dominant for USGS FDSN, Open-Meteo, NASA APIs, NVD, market providers, macro APIs, OpenSky, AviationWeather, CDC/Socrata, OpenAQ.
- **GeoJSON:** USGS, GDACS and AviationWeather products; NWS endpoints may expose geometry in JSON-LD/GeoJSON-like structures. GeoJSON support must not be inferred from generic JSON.
- **XML/RSS/Atom/CAP:** NHC, tsunami.gov, GVP, company news, CNEOS, NASA/JPL. RSS is not an API license.
- **CSV:** FIRMS, NCEI, market providers, ECB/SDMX and EIA exports.
- **WMS/WFS/KML/SHP/GeoTIFF:** FIRMS and NHC geospatial products require a binary/geospatial asset pipeline, not `AtlasEvent.metadata` alone.
- **OAuth2:** OpenSky client credentials. Most other keys are query/header API keys, not OAuth.
- **GraphQL:** no approved provider in the master requires GraphQL. Do not build GraphQL-specific ingestion infrastructure for this inventory.

## E. Deprecated providers/endpoints

- Microsoft `https://blogs.microsoft.com/ai/feed/`: **410 Gone**; replace with an explicitly approved Microsoft AI source/feed.
- NVIDIA `https://blogs.nvidia.com/blog/category/ai/feed/`: **404**; select either the general feed or a correct category such as generative AI, with scope documented.
- IMF DataMapper as the general IMF strategy: not fully deprecated, but **insufficient/stale as the platform-wide source** after the legacy portal retirement and new Data Portal migration.
- EIA API v1: deprecated; the master correctly uses v2.
- OpenSky username/password examples in older client/Javadocs: deprecated for REST authentication; use OAuth2 client credentials.

## F. Missing providers

See `ATLAS-DATA-SOURCE-GAPS.md`. The largest gaps are global cyclone authorities outside NHC, authoritative local flood/wildfire incidents, population exposure, administrative boundaries, geocoding, country/entity identifiers, conflict, drought/heat/air quality, emissions, supply-chain/trade, food security, global health surveillance, sanctions, official emergency alerts by jurisdiction, and licensed global aviation/AIS.

## G. Duplicate providers and consolidation

| Apparent duplicate | Finding | Consolidation decision |
|---|---|---|
| NOAA, NWS, NHC, SWPC, NCEI, NDBC, AWC/weather.gov | Organizational hierarchy with different products, schemas, jurisdictions and cadences—not interchangeable duplicates | One `noaa` organization entity and shared policy/HTTP adapter; separate product source IDs, contracts and health checks |
| NASA, JPL, CNEOS, FIRMS, NeoWs | NASA family, but JPL is NASA/Caltech operated and products have distinct contracts | One organization graph; separate `jpl-news`, `cneos-news`, `neows-close-approach`, `firms-detection`; shared NASA key vault only where applicable |
| CISA KEV, CVE, NVD, CERT | Complementary layers: exploitation, canonical record, enrichment, coordination notes | One vulnerability entity keyed by CVE; provenance-preserving claims from each source; no overwriting |
| EIA oil and EIA v2 | True adapter duplication | One `eia-api-v2` provider adapter; dataset IDs for petroleum and other series |
| Twelve Data stock/FX/gold | Same vendor and transport, different entitlements/instruments | One vendor client; separate entitlement/dataset records and caches |
| NASA Open APIs and NeoWs | NeoWs is one NASA Open API product | Make NASA API gateway a credential/provider parent, not an ingestible source; NeoWs remains product source |
| NOAA marine/NDBC/NWS | Observations and alerts are different record types | Split into NDBC observation source and NWS marine-alert source |
| Official RSS/NASA/NOAA/etc. news rows | These duplicate sources already listed and confuse policy with provider | Remove “Official RSS aggregator” as source; maintain an allow-list and reference existing product IDs |
| Fear/Greed external and ATLAS Fear/Greed | Functional/branding duplicate | Do not ingest external composite; calculate only clearly branded ATLAS metrics if validated |

## H. Licensing concerns

Detailed decisions are in `ATLAS-LICENSING-RISK.md`. Highest risks are FRED, OpenSky, market/exchange data, AIS, WHO/ESA/company text, and free-host Open-Meteo commercial use. Legal status must be machine-enforced through allowed-use flags: public display, commercial use, retention, cache, transform, derived metrics, redistribution, API export, AI input, model training, and media mirroring.

## I. Architecture concerns

`AtlasEvent` naturally represents discrete alerts/incidents/publications. It does not naturally represent time series, observations, forecasts, tracks, polygons, rasters, entities, assets, relationships, revisions, claims, license obligations or computed metric lineage. Required bounded contexts:

- `SourceDefinition`, `SourceContract`, `SourceRun`, `RawArtifact`, `ProvenanceClaim`
- `Event`, `EventRevision`, `AlertLifecycle`, `Geometry/Area`
- `Observation`, `Series`, `Forecast`, `Trajectory`, `RasterAsset`
- `Entity` (place, organization, person, instrument, asset, vulnerability, hazard, satellite, aircraft, vessel)
- `Relationship` and `Evidence`
- `MetricDefinition`, `MetricValue`, `MetricInput`, `ModelVersion`, `ConfidenceAssessment`

`AtlasEvent.metadata` may retain provider-specific extras but must not carry core query semantics. Add dedicated `tsunami` and `climate` categories only if categories remain an event facet; satellite is usually an entity/domain, not an event category.

## J. Scalability concerns

- **100 sources:** feasible with a source SDK, queues, per-source rate budgets, schema contracts, durable storage, observability and on-call ownership.
- **500 sources:** requires multi-tenant ingestion control plane, connector templates, regional workers, contract-test automation, data quality SLOs, schema registry, lineage and automated license enforcement.
- **1,000 sources:** requires a platform organization, not a library of fetchers. Current TypeScript constant/union and in-memory-style abstractions will become a bottleneck. Source configuration belongs in a governed registry/database with code-reviewed connector packages.

See `ATLAS-SCALABILITY-REVIEW.md`.

## K. Knowledge Graph readiness

Current readiness is low. Stable source IDs and fingerprints are useful foundations, but there is no canonical entity resolution, relationship model, claim-level provenance, temporal validity, ontology/versioning, or graph storage. Introduce a graph after identifiers/provenance are stable; do not begin with a universal ontology. See `ATLAS-KNOWLEDGE-GRAPH-ROADMAP.md`.

## L. AI analytics readiness

Low. There is insufficient domain coverage, history, baseline/version storage, confidence calibration and lawful AI-use metadata. Vector search may support discovery and retrieval, but it is not a source of truth. “AI memory” should mean governed, time-bounded evidence/analyst state—not opaque model memory. See `ATLAS-METRIC-ARCHITECTURE.md`.

## M. Production readiness

**Overall: Not production-ready as a global intelligence platform.** The active prototype can truthfully show limited source data, but production launch is blocked by JPL access reliability, Open-Meteo commercial terms, NHC coverage/disclaimer, lack of persistent revision history, absence of source/legal contracts in the runtime model, and insufficient typed storage.

## N. Recommended roadmap

The original phase order is not optimal because it prioritizes easy feeds before the data platform needed to operate them safely.

1. **Phase 0 — Governance and contracts:** source ontology, legal allowed-use matrix, source ownership, verification automation, data-quality SLOs, incident/stale policy.
2. **Phase 1 — Core data platform:** queues, raw immutable landing, event revisions, observation/time-series store, geospatial assets, provenance, schema registry, source health and backfill.
3. **Phase 2 — Harden active five:** repair/replace JPL access, commercialize Open-Meteo, validate NHC semantics, preserve USGS revisions, verify CNEOS.
4. **Phase 3 — Authoritative P0 hazards:** tsunami, FIRMS detections + clustering, GDACS with authority labels, GVP, global cyclone basin plan, exposure datasets.
5. **Phase 4 — Domain packs:** cyber, space weather, health, climate, macro, aviation/marine observations; each pack ships with legal/data contracts and domain schema.
6. **Phase 5 — Licensed commercial streams:** market, AIS, OpenSky/aviation, conflict after procurement and entitlement enforcement.
7. **Phase 6 — Knowledge graph and retrieval:** entities/claims/relationships, then vector indexes as derived search infrastructure.
8. **Phase 7 — Computed metrics:** Disaster Pressure and Cyber Threat first; validate enterprise comprehension; other indices later.
9. **Phase 8 — Predictive analytics:** only after point-in-time history, evaluation, calibration, shadow operation and governance.

## O. Highest-priority work

1. Mark JPL operationally degraded; fix source access or disable it.
2. Correct NVIDIA and Microsoft endpoints; migrate IMF strategy; demote WHO, CDC, Twelve Data and CoinGecko to Research/procurement gates.
3. Ban FRED persistence/AI use unless explicitly approved; prefer original series owners.
4. Introduce typed observation/series/forecast/trajectory/geospatial models and claim-level provenance.
5. Create a machine-readable legal rights matrix and prevent export/AI use by default.
6. Build durable event revision/tombstone storage before expanding source count.
7. Add tsunami, FIRMS and GDACS only after the platform changes above.

## P. Documents created

- `docs/ATLAS-DATA-SOURCE-AUDIT.md`
- `docs/ATLAS-DATA-SOURCE-GAPS.md`
- `docs/ATLAS-LICENSING-RISK.md`
- `docs/ATLAS-METRIC-ARCHITECTURE.md`
- `docs/ATLAS-KNOWLEDGE-GRAPH-ROADMAP.md`
- `docs/ATLAS-SCALABILITY-REVIEW.md`

## Q. Files modified

Only the six review documents above. The master was audited but not changed. No application or UI code was modified.

## R. Files requiring future implementation

Future implementation will eventually affect the source registry, type contracts, source fetchers/normalizers, data-hub orchestration, event store, API routes, source-health API, admin source UI, tests/fixtures, credential management, storage migrations, observability, and deployment configuration. No implementation is authorized by this review.

## Verification caveat

This engineering audit is not legal advice and does not convert provider terms into a license. Terms, endpoints and pricing change. Before activation, record a new verification date, exact dataset, response/schema fixture, terms snapshot/hash, counsel/procurement decision, permitted uses, attribution string, rate policy and responsible owner.
