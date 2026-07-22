# ATLAS Data Source Gaps and Dashboard Coverage Review

**Audit date:** 2026-07-22  
**Purpose:** Identify missing, incomplete, duplicated or unapproved inputs and define what each dashboard surface actually needs. This is architecture review, not implementation authorization.

## Gap severity model

- **Blocker:** current UI claim cannot be produced truthfully or globally.
- **Critical:** required for a credible core domain.
- **Material:** domain can launch narrowly but must disclose coverage.
- **Enrichment:** useful after the core contract is stable.

## Missing provider/data capabilities

| Gap | Severity | Why current inventory is insufficient | Candidate direction (research required) |
|---|---|---|---|
| Global cyclone coverage | Critical | NHC/CPHC covers Atlantic and East/Central Pacific, not every WMO basin | Ingest products from each WMO RSMC/TCWC; preserve basin authority and cross-basin handoffs |
| Population/exposure | Blocker for risk metrics | No population raster, settlements, infrastructure or vulnerability baseline | Evaluate WorldPop, GHSL, World Bank and national statistics with dataset-level licenses |
| Administrative boundaries/geocoding | Critical | `countryCode`/region cannot be reliably derived from point feeds alone | Select versioned Natural Earth/UN SALB/geoBoundaries/GeoNames strategy with boundary-date semantics |
| Authoritative flood warnings | Critical | GDACS is a major-event aggregator, not complete local warning coverage | Copernicus GloFAS plus national hydrometeorological agencies; distinguish model forecast from warning |
| Confirmed wildfire incidents/perimeters | Critical | FIRMS is thermal detections, not confirmed fires/perimeters | Add national incident/perimeter authorities (e.g. NASA/USFS/agency products) by jurisdiction |
| Drought, heat and water stress | Critical for climate/health | NCEI alone does not provide a unified operational stress layer | NOAA/WMO/Copernicus and national drought/heat products; define baselines |
| Air quality | Critical for Planet Health | OpenAQ exists only in runtime registry, omitted from master provider inventory and disabled | Restore as explicit source; propagate each upstream license and sensor quality |
| Emissions/greenhouse gases | Material | EIA energy statistics are not a global emissions observation system | Research EDGAR, UNFCCC, Global Carbon Project, NOAA GML and Copernicus products |
| Global health surveillance | Critical | WHO DON is editorial and CDC is U.S.-centric/dataset-fragmented | Select WHO structured datasets, regional bodies, national agencies and reporting-delay semantics |
| Food security/humanitarian | Material | No source for famine/food stress/displacement | Research WFP, FAO, IPC, UNHCR, IOM; licensing and sensitive-population safeguards |
| Conflict/security | Blocker for current menu/metric | No approved provider; official sources cannot provide complete neutral incident coverage | Product decision first; then ACLED/UCDP/UN/OCHA procurement and methodology review |
| Sanctions/geopolitical policy | Material | No official consolidated normalized source | UN, EU, OFAC and national lists; entity resolution and legal-operation review |
| General official government alerts | Critical for “global” claim | No jurisdictional allow-list or CAP aggregation strategy | Country-by-country registry; CAP where official; authority/jurisdiction fields mandatory |
| Market entitlements | Blocker for Market Overview | Candidates do not establish exchange/benchmark display and redistribution rights | Procurement-led instrument/venue entitlement matrix; direct benchmark licensing where needed |
| Global aviation | Material | OpenSky is license-blocked; FAA unspecified; AWC is weather, not schedules/status | Decide product: state vectors vs schedules vs delays vs airspace notices; procure each separately |
| Global AIS | Blocker for Ships | No provider, contract or rights | Enterprise procurement with explicit caching, derived-data, display and export rights |
| Satellite ownership/catalog/decay | Material | CelesTrak GP supplies elements, not full authoritative catalog semantics or SLA | Evaluate Space-Track agreement and licensed space-domain-awareness sources |
| Source language/translation | Critical for global news | Company/agency feeds are English-heavy | Add language metadata, first-party local feeds, translation provenance and confidence |
| Historical point-in-time snapshots | Blocker for analytics | Live feeds overwrite/revise and have short windows | Immutable raw landing + revision ledger + lawful retention rules |
| Data-quality ground truth | Blocker for confidence | No calibration labels or source agreement corpus | Domain-specific adjudication sets and analyst review workflows |

## Dashboard and menu review

“Current” reflects repository behavior, not design intent.

### Monitor

| Menu/surface | Current status | Required + missing sources | Widgets/charts/timeline/map | AI/alerts/reports |
|---|---|---|---|---|
| Global Overview | Active subset: USGS/NHC/JPL/CNEOS and coordinate weather; computed cards unavailable | Required: all domain indices and health status. Missing wildfire, flood, volcano, tsunami, climate, health, cyber, licensed market, exposure | Metric strip, global map, latest event timeline, source-health/staleness, domain small multiples | Grounded cited summary only; multi-domain alerts; daily/weekly executive report |
| World Map | Partial; earthquake live, weather-on-click, other layer buttons pending | All geospatial event/observation providers; boundary/geocoding/exposure baselines | Layer catalog, time scrubber, clustering, polygons/tracks/rasters, legend and coverage mask | Location-based analysis, geofenced alerts, map snapshot/export with license controls |
| Event Timeline | Data hub emits active subset; dedicated page is a shell | All event sources plus durable revisions and corrections | Faceted timeline, source/coverage filters, event lifecycle, comparison and provenance | Event correlation explanation, saved alert rules, incident chronology report |
| Breaking News | Active only JPL/CNEOS; JPL access is currently degraded | Exact allow-listed first-party feeds; multilingual official feeds | Search, topic/agency filters, source health, duplicate clusters, publication timeline | Summaries with citations; topic alerts; briefing export, no article mirroring |

### Categories

| Menu | Current status | Required + missing sources | Expected widgets and charts | Timeline and map | AI, alerts and reports |
|---|---|---|---|---|---|
| Earthquake | Card active; page shell | USGS core; regional seismic authorities optional for local completeness | 24h count, strongest, magnitude/depth histograms, aftershock sequence, source revisions | Points/ShakeMap layers; chronological revisions | Impact context, threshold/geofence alerts, event report |
| Volcano | Planned | GVP plus national observatories for real-time alert levels | Active/reporting volcanoes, alert-level changes, SO2/thermal enrichment | Volcano points, ash polygons where official, report timeline | Evidence-linked activity summary; aviation/region alerts; volcano dossier |
| Weather & Climate | Weather coordinate lookup active; climate absent | Open-Meteo commercial plan, NOAA/NCEI, drought/heat/air quality, baselines | Current/forecast panels, anomaly charts, seasonal percentiles, source/model comparison | Weather grids/alerts, climate anomaly rasters, station history | Forecast explanation, official-warning alerts, climate trend report |
| Disasters | Cyclone active subset | tsunami.gov, GDACS, FIRMS + incident clustering, GVP, global cyclone RSMCs, exposure | Hazard counts by severity/region, affected exposure, active/closed state | Multi-hazard polygons/tracks/rasters and unified timeline | Situation summaries, escalation alerts, incident/region reports |
| Conflict | Research; no source | Approved incident provider, humanitarian sources, boundaries, displacement and sanctions | Incident counts/types, civilian impact only where responsibly sourced, coverage/bias indicators | Sensitive map aggregation, delay/precision controls, event chronology | High-risk domain: analyst-in-loop summaries/alerts/reports; no predictive targeting |
| Economy & Markets | Page shell and integration-pending table | Licensed markets; IMF new portal/SDMX, World Bank, ECB, EIA; direct owners instead of FRED where possible | Asset cards, OHLC/returns/volatility, macro releases, revisions, yield/FX/commodity charts | Usually country/market heat maps; release timeline | Market stress explanation, licensed alerts, non-advisory reports |
| AI & Technology | Page shell; JPL/CNEOS technology-adjacent items | Correct official feeds for seven vendors; research/release/security datasets | Announcement/release radar, vendor/topic counts with bias warning, vulnerability links | Mostly timeline/network graph; map only for facilities/incidents if lawful | Cited briefings, release/security alerts, technology report |
| Cybersecurity | Planned | CVE, NVD, CISA KEV, CERT; later vendor advisories and exploited-threat sources | KEV additions, CVSS/EPSS if licensed/selected, affected product graph, remediation deadlines | Timeline and organization/product graph; geography generally inappropriate | Prioritization explanation, KEV/vendor alerts, vulnerability report |
| Aviation (Flights) | Disabled/research | Licensed OpenSky or alternative; AWC; selected FAA/SWIM; airport/schedule provider if required | Live state count, delays/status only from entitled source, METAR/TAF/SIGMET | Aircraft trajectories, hazards, airspace polygons; high-volume time window | Disruption summaries, hazard/geofence alerts, operations report; not flight planning |
| Marine (Ships) | Research | Licensed AIS, NDBC/NWS, port/weather/wave providers | Vessel/port counts, marine conditions, warning cards | Vessel trajectories, warning polygons, buoy stations | Disruption/condition analysis, geofence/weather alerts, maritime report |
| Space & Satellites | News active subset; data planned/research | SWPC, NeoWs, NASA/ESA mission sources, licensed orbital elements/catalog | Kp/solar-wind charts, close approaches, mission events, satellite status | Orbits/ground tracks only from valid epochs; space-weather maps/timeline | Space-weather/approach summaries and alerts; no impact sensationalism |
| Energy | Page/panel pending | EIA v2; global energy/utility/outage and emissions sources missing | Production/stocks/prices, generation mix, demand, revisions | Country/grid/asset layers where licensed; release/outage timeline | Energy stress analysis, threshold alerts, outlook report |
| Health & Disease | Planned/research | WHO exact API, CDC datasets, regional/national sources, population baseline | Outbreak cards, incidence/prevalence with denominators, reporting-delay charts | Area/point maps with privacy aggregation; report/revision timeline | Cautious evidence summaries, official-alert notifications, public-health report; no diagnosis |

### Tools and More

| Menu | Current status | Required data | Expected experience | AI/alerts/reports |
|---|---|---|---|---|
| Compare Countries | Pending | Country entity model; World Bank/IMF/ECB/EIA/health/climate series with vintages | Comparable definitions, units, time windows, revisions and missingness; radar/bar/time-series only when methodologically valid | Narrative comparison cites every series; saved comparison alerts/reports |
| Data Explorer | Pending | All typed stores plus rights-filtered query layer | Schema browser, lineage, source/license filters, time/geospatial queries, export eligibility | Query assistant may generate queries, never bypass entitlements; saved queries |
| API & Widgets | Research | Redistribution-safe data products and attribution manifests | Key management, quotas, versioned schemas, legal filters, widget attribution | Usage alerts and integration reports; no export of restricted sources |
| Reports | Pending | Point-in-time snapshots, citations, metric lineage, templates | Daily/domain/incident reports with reproducible “as of” time | Human-approved AI drafts; subscriptions and immutable report provenance |
| About Atlas | Static/pending provenance | Organization/source catalog, methods and status | Coverage, limitations, methodology, terms and correction policy | None required |
| Settings | Shell | User preferences, subscriptions, units, locale, privacy | Source/alert settings and data-use disclosures | Alert configuration and report delivery |

## Metric input gaps

| Metric | Blocking gaps |
|---|---|
| Planet Pulse | No settled definition; missing broad hazards, health, cyber, markets and baseline history |
| Planet Health | Missing global health, air quality, drought/heat, emissions and population exposure |
| Earth Mood/Human Concern | Missing multilingual attention sources, bias correction, comprehension validation and privacy policy |
| Global Risk | Every domain index needs calibrated history and coverage confidence first |
| Fear/Greed | Missing licensed cross-asset breadth and user-validated meaning; brand confusion |
| Attention | Official feeds alone measure publisher attention, not human attention |
| Technology | Marketing-feed bias, missing research/release/adoption/security ground truth |
| Climate Stress | Missing fixed baselines, drought/heat/water/air quality, population exposure and revision handling |
| Disaster Pressure | Missing confirmed wildfire incidents, global cyclone authorities, exposure and deduplication ground truth |
| Cyber Threat | Missing prevalence/exposure estimates, vendor advisories and calibration against incidents |
| Market Stress | Missing lawful real-time/delayed entitlement set and consistent instrument universe |

## Consolidation recommendations

1. Model **organization → service → dataset/product → endpoint**. Do not merge distinct NOAA/NASA products into one source.
2. Share credentials, transport, backoff and legal policy at provider level; keep health, schema, cadence and provenance per endpoint/product.
3. Convert broad placeholders (`NASA Open APIs`, `CDC`, `FAA`, `NOAA marine`, `AIS`) into Research programs until an exact dataset and contract exist.
4. Use a single EIA adapter and one Twelve Data adapter, with child datasets/entitlements.
5. Unify cyber data around a CVE entity with source-specific claims.
6. Remove “Official RSS aggregator” from source inventory; it is a connector type and governance policy.

## Highest-priority gap closure

1. Source/legal/provenance control plane and durable point-in-time history.
2. Observation/time-series/geospatial models.
3. Exposure/boundary/geocoding baselines.
4. Repair active source reliability and commercial rights.
5. Global hazard completeness: tsunami, fire, flood, volcano and non-NHC cyclone basins.
6. Air quality/health/climate inputs.
7. Licensed market data.
8. High-risk commercial/sensitive domains: conflict, AIS and aviation state vectors.
