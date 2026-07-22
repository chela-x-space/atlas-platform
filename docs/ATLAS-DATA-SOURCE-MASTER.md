# ATLAS Data Source Master

**Document status:** Master specification / single source of truth  
**Applies to:** ATLAS external ingestion, dashboard data provenance, caching, normalization, and future computed intelligence  
**Inventory date:** 2026-07-22  
**Repository baseline:** `apps/web/src/config/data-sources.ts`, dashboard components, app pages, API routes, tests, and data-hub normalizers  
**Rule:** A source is not production-enabled merely because it appears in this document. Only rows marked **Active** are currently connected. Status changes require this document and the runtime registry to be updated together.

## A. Document structure and governance

This document has five operational parts:

1. UI-to-source coverage: every current dashboard card, panel, menu destination, and page list.
2. Completed source inventory: canonical provider, endpoint, terms, operating characteristics, and normalization.
3. ATLAS AI computed metrics: values created by ATLAS, never copied from an outside index.
4. Missing-source and legal register.
5. Phased implementation roadmap and priority.

### Status and priority vocabulary

- **Active:** implemented, enabled by default, and surfaced from the live ATLAS data hub.
- **Planned:** selected and suitable, but not implemented.
- **Disabled:** implementation/registry entry exists or is explicitly held back pending credentials or terms approval.
- **Research:** provider, contract, geographic completeness, or license is not yet approved.
- **P0:** required for the core truthful global dashboard.
- **P1:** high-value expansion after the core event model is stable.
- **P2:** useful enrichment, specialist detail, or costly/complex integration.

### Reliability scale and cache policy

- **High:** authoritative service with a documented machine interface and mature operations.
- **Medium-high:** authoritative but experimental, quota-constrained, or not backed by an uptime commitment.
- **Medium:** useful official publication feed with schema/availability variability.
- **Variable:** community/commercial aggregation, unclear SLA, or incomplete global coverage.
- Cache values below are recommended server-side freshness windows. ATLAS must honor provider cache headers and stricter rate limits. Safety feeds must fail visibly and retain the last-known item with a stale marker; they must never be replaced with fabricated values.

### Canonical normalization contract

Event-like records normalize to `AtlasEvent`: stable source-scoped ID and fingerprint; category/type; title/summary; severity/status; UTC `occurredAt`, `updatedAt`, and `ingestedAt`; source ID/name/item URL; WGS84 longitude/latitude; country/region; tags; attribution; and source-specific metadata. Time-series and scalar observations normalize to an `AtlasObservation`/metric store (future contract) and only become `AtlasEvent` when a threshold, advisory, or state transition is meaningful. Preserve a raw-object reference, original units, provider severity, quality flags, and license metadata. Deduplicate by provider ID first, then source/category/time/location fingerprint. Never silently merge conflicting authoritative records.

## UI-to-source coverage

| Component / page list | Feature | Required sources | Status / priority |
|---|---|---|---|
| `MetricStrip` — Planet Pulse | Cross-domain activity composite | ATLAS-computed from USGS, NHC, FIRMS, GDACS, WHO, CISA, markets, news | Planned / P1 |
| `MetricStrip` — Planet Health | Environmental and population stress composite | ATLAS-computed from NOAA climate, WHO, CDC, World Bank, EIA | Planned / P1 |
| `MetricStrip` — Earth Mood | Human Concern Index presentation | ATLAS-computed from official news attention and event exposure; no social scraping approved | Research / P2 |
| `MetricStrip` — Global Risk | Global Risk Index | ATLAS-computed from disaster, health, cyber, market, climate inputs | Planned / P1 |
| `MetricStrip` — Earthquakes 24H | Count of last-day earthquakes | USGS GeoJSON | Active / P0 |
| `MetricStrip` — Cyclones | Active cyclone advisories | NOAA/NHC RSS GIS feeds | Active / P0 |
| `MetricStrip` — Wildfires | Current fire detections | NASA FIRMS | Planned / P0 |
| `MetricStrip` — Conflict Zones | Conflict map/count | No approved source; requires legal/editorial decision | Research / P2 |
| `MetricStrip` — Market Status | Cross-asset state | Twelve Data, CoinGecko, EIA; ATLAS Market Stress Index | Planned / P1 |
| `AtlasMap` — All Layers | Unified geospatial event map | All enabled geospatial sources | Earthquake Active; remainder incremental / P0 |
| `AtlasMap` — Earthquake | Live quake points | USGS GeoJSON | Active / P0 |
| `AtlasMap` — Weather | Coordinate weather inspection | Open-Meteo Forecast API | Active / P0 |
| `AtlasMap` — Conflict | Conflict incidents | No approved provider | Research / P2 |
| `AtlasMap` — Flights | Aircraft state vectors | OpenSky; FAA NAS status; AviationWeather hazards | Disabled/Planned / P2 |
| `AtlasMap` — Ships | Vessel positions | Licensed terrestrial/satellite AIS; NOAA for marine conditions | Research / P2 |
| `AtlasMap` — More Layers | Flood, wildfire, volcano, tsunami, cyclone, satellite, energy overlays | GDACS, FIRMS, GVP, tsunami.gov, NHC, CelesTrak, EIA | Planned/Research / P1–P2 |
| Global Timeline | Unified chronological event list | Every enabled `AtlasEvent` source | Active for USGS/NHC/JPL/CNEOS / P0 |
| AI Global Summary panel | Cited current narrative and risk facets | ATLAS computed metrics plus traceable source events; optional LLM rendering | Planned / P1 |
| Live Earthquake card/list and `/app/earthquake` | Strongest and recent quakes | USGS GeoJSON/FDSN | Card Active; page shell only / P0 |
| Global Sentiment Index | Human Concern Index gauge | ATLAS-computed, not a third-party sentiment number | Research / P2 |
| Sentiment Trend | Historical Human Concern Index | Stored ATLAS metric snapshots | Research / P2 |
| Market Overview and `/app/markets` lists | Indices, commodities, crypto, currencies | Twelve Data, CoinGecko, EIA; licensed benchmark review | Planned / P1 |
| AI & Technology Radar and `/app/ai` list | Official company/agency announcements | OpenAI, Anthropic, Google AI, Meta AI, NVIDIA, Hugging Face, Microsoft AI, NASA/JPL | JPL Active; company feeds Planned / P1 |
| Disaster Overview | Cyclone, wildfire, flood, volcano counts/map | NHC, FIRMS, GDACS, Smithsonian GVP | Cyclone Active; others Planned / P0–P1 |
| Latest Official News ticker and `/app/news` | Official publication stream | JPL and CNEOS now; NASA, NOAA, USGS, WHO, ESA, government, technology feeds planned | Active subset / P0 |
| World Map menu / `/app/monitor` | Global event monitor | All geospatial event sources | Active subset / P0 |
| Event Timeline menu / `/app/timeline` | Searchable historic event list | All event sources plus persistent event store | Active subset; page shell only / P0 |
| Breaking News menu / `/app/news` | Search/filter official items | Official RSS/Atom/API sources | Active for JPL/CNEOS / P0 |
| Volcano menu/panel | Volcano activity | Smithsonian GVP | Planned / P1 |
| Weather & Climate menu and `/app/weather` | Weather observations/forecast and climate anomalies | Open-Meteo, NOAA NCEI | Weather Active; climate Planned / P0–P1 |
| Disasters menu/panel | Multi-hazard events | GDACS plus hazard owners | Planned / P0 |
| Economy & Markets menu | Macro and asset data | IMF, World Bank, FRED, ECB, market providers | Planned / P1 |
| AI & Technology menu | Official AI/technology updates | Seven company sources below | Planned / P1 |
| Cybersecurity menu | Exploited vulnerabilities and advisories | CISA, NVD, CVE, CERT/CC | Planned / P1 |
| Aviation menu | Flights, airspace and aviation hazards | OpenSky, FAA, AviationWeather | Disabled/Planned / P2 |
| Marine menu | Marine warnings/conditions and ship positions | NOAA/NWS/NDBC, licensed AIS | Planned/Research / P2 |
| Space & Satellites menu | Space weather, NEOs, missions, orbital elements | NASA, ESA, CNEOS/NeoWs, NOAA SWPC, CelesTrak | Planned + JPL/CNEOS news Active / P1 |
| Energy menu | Production, stocks, prices and outlooks | U.S. EIA API v2 | Planned / P1 |
| Health & Disease menu | Outbreaks and public-health notices | WHO, CDC | Planned / P1 |
| Compare Countries | Normalized country indicators | World Bank, IMF | Planned / P2 |
| Data Explorer | Query normalized history | All licensed persisted sources | Planned / P2 |
| API & Widgets | Redistribute ATLAS-normalized data | Only sources whose terms permit redistribution; attribution chain required | Research / P2 |
| Reports | Saved, cited ATLAS intelligence | Normalized events + computed metrics | Planned / P2 |
| Alerts / `/app/alerts` and notifications panel | Threshold/user alerts | All safety-event sources; ATLAS rules | Planned / P1 |
| Settings/About | Configuration/provenance display | Source registry and this specification, not an external feed | Planned / P2 |

## B. Completed source inventory

The endpoint is the production candidate, not permission to enable it. “Free” means a no-cost access path exists; it does not imply unrestricted commercial reuse.

### Earth, weather, climate, and global hazards

| ID / component | Owner; official provider | Documentation; endpoint | Auth / free tier | Commercial, attribution, and legal | Refresh / format / coverage / history | Reliability / cache | Status / priority |
|---|---|---|---|---|---|---|---|
| `usgs-earthquakes` — Earthquake, map, timeline, cards | U.S. Geological Survey; USGS Earthquake Hazards Program | [GeoJSON docs](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php); `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson` (also week/month); [FDSN history](https://earthquake.usgs.gov/fdsnws/event/1/) | None; free | U.S. government data generally public domain; credit “U.S. Geological Survey”; no endorsement; honor third-party material notices | 60 s; GeoJSON FeatureCollection; worldwide; real-time feeds 1 h–30 d, catalog history via FDSN | High; 60 s | **Active / P0** |
| `smithsonian-gvp` — Volcano | Smithsonian Institution; Global Volcanism Program | [Webservices/database](https://volcano.si.edu/); candidate `https://volcano.si.edu/news/WeeklyVolcanoRSS.xml`; [terms](https://volcano.si.edu/gvp_termsofuse.cfm) | None; free | Database is generally U.S. government work; citation is mandatory and some contributed media differs; no implied endorsement | 6 h; RSS/XML plus downloadable database/webservices; global Holocene/Pleistocene volcanoes; eruption record roughly 12,000 years | Medium-high; 6 h | **Planned / P1** |
| `noaa-tsunami` — Tsunami | NOAA/NWS; National and Pacific Tsunami Warning Centers | [Subscriptions and CAP](https://www.tsunami.gov/php/content/productRetrieval.php); `https://www.tsunami.gov/events/xml/PAAQAtom.xml`, `PHEBAtom.xml`, `PAAQCAP.xml`, `PHEBCAP.xml` | None; free | U.S. government information; attribute NOAA/NWS and warning center; warnings are authoritative only for stated service areas; retain disclaimers | 60 s; Atom and CAP XML; U.S./Canada and PTWC international regions; live/recent messages, limited feed history | High for official regions; 60 s | **Planned / P0** |
| `gdacs-flood` — Flood and multi-hazard disaster | United Nations/European Commission; GDACS/EC JRC | [API quick start](https://www.gdacs.org/Documents/2025/GDACS_API_quickstart_v1.pdf); `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=FL`; `https://www.gdacs.org/xml/rss.xml` | None; free | Terms request credit “Global Disaster Alert and Coordination System, GDACS”; much EC content is CC BY 4.0; aggregator/disclaimer, not a replacement for local authorities | 15 min; GeoJSON/JSON, GeoRSS/XML, KML; global major sudden-onset hazards; API supports date ranges | Medium-high; 15 min | **Planned / P0** |
| `nasa-firms` — Wildfire | NASA Earth Science Data and Information System; FIRMS | [Area API](https://firms.modaps.eosdis.nasa.gov/api/area/); `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/world/1` | Free MAP_KEY required | NASA data policy/mission citation applies; active-fire detections are observations, not confirmed fires; review each underlying MODIS/VIIRS product citation before redistribution | 10–15 min; CSV (also WMS/WFS); global; near-real-time and downloadable archives | High, quota constrained; 10 min | **Planned / P0** |
| `noaa-nhc` — Cyclone | NOAA/NWS; National Hurricane Center/CPHC | [RSS](https://www.nhc.noaa.gov/aboutrss.shtml), [GIS RSS](https://www.nhc.noaa.gov/gis/rss.php); `https://www.nhc.noaa.gov/gis-at.xml`, `gis-ep.xml`, `gis-cp.xml` | None; free | U.S. government data; credit NOAA/NHC; GIS feed is experimental, delivery not guaranteed, never sole basis for life-threatening decisions | 5 min; RSS/XML linking XML/SHP/KML/GeoTIFF; Atlantic, E/C Pacific; live advisories and separate archives/best tracks | Medium-high; 5 min | **Active / P0** |
| `open-meteo` — Weather | Open-Meteo; model inputs from named national services | [Forecast API](https://open-meteo.com/en/docs); `https://api.open-meteo.com/v1/forecast`; geocoding `https://geocoding-api.open-meteo.com/v1/search` | Non-commercial open-access tier without key; commercial use requires appropriate paid/customer API under [terms](https://open-meteo.com/en/terms) | Attribution to Open-Meteo and underlying weather providers required; do not assume free hosted API permits commercial production | 15 min; JSON; global point/grid; forecast/current plus separate historical APIs | Medium-high; 15 min | **Active / P0** |
| `noaa-ncei-climate` — Climate | NOAA; National Centers for Environmental Information | [Climate Data Online API](https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation); `https://www.ncei.noaa.gov/access/services/data/v1` | Token not required for Access Data Service; free, subject to limits | U.S. government data generally reusable; cite dataset/NOAA/NCEI; dataset-specific metadata and third-party rights control | Daily/monthly by dataset; JSON/CSV; global coverage varies by collection; deep station, reanalysis, and climate archives | High; 6–24 h | **Planned / P1** |

**Selection and normalization notes**

- **USGS:** Selected because it is the authoritative global operational earthquake feed and explicitly recommends GeoJSON for automated displays. Advantages: stable IDs, coordinates, magnitude, update timestamps, tsunami flag, and detail links. Limitations: events are revised/deleted and smaller-event completeness varies geographically. Normalize each feature to category `earthquake`, preserve magnitude type/status/felt/CDI/MMI and `[longitude, latitude, depth]`; revisions upsert by USGS ID.
- **Smithsonian GVP:** Selected for the best authoritative global volcano/eruption catalog and weekly reporting. Advantages: expert curation and long history. Limitations: weekly cadence is not a real-time warning service and webservice stability must be validated. Normalize reports to `volcano`, distinguish `report` from `eruption`, link volcano number, and never infer alert level from prose alone.
- **NOAA tsunami.gov:** Selected for digitally structured official warning-center products. Advantages: CAP severity/urgency and signed CAP-TSU profile. Limitations: institutional service regions and feed history are bounded; local/national centers remain authoritative outside coverage. Normalize messages to `tsunami`, preserve CAP identifier/references/areas/status, and process cancellations/updates as revisions.
- **GDACS:** Selected as a global cross-border flood/disaster bridge until national sources can be added. Advantages: free GeoJSON, polygons, severity and date filtering. Limitations: model/aggregator alerts are not universal local warnings. Normalize floods to `flood`, other event types to their hazard category, preserve GDACS alert score/event/episode IDs and upstream links.
- **NASA FIRMS:** Selected for global low-latency MODIS/VIIRS thermal anomaly detections. Advantages: global coverage and sensor metadata. Limitations: false positives, cloud gaps, multiple detections per fire, and quota. Cluster detections into evolving `wildfire` events without claiming a confirmed incident; retain confidence, FRP, satellite/instrument, acquisition time and day/night.
- **NOAA/NHC:** Selected as the official tropical-cyclone authority for its basins. Advantages: forecasts, cones, watches, tracks and clear advisory sequence. Limitations: experimental GIS delivery and incomplete global-basin coverage. Normalize advisory summary/track to `cyclone`, stable key ATCF ID + advisory, preserve forecast points and never convert the cone to an impact probability.
- **Open-Meteo:** Selected for simple global model access and the existing implementation. Advantages: keyless development and unified models. Limitations: it is an aggregator, point forecasts are model estimates, and commercial hosted access has separate terms. Normalize current/forecast records as weather observations; create `weather` events only for defined thresholds, retain model, elevation, units and UTC offset.
- **NOAA/NCEI:** Selected for authoritative climate baselines rather than live weather. Advantages: long, quality-controlled archives. Limitations: dataset-specific coverage, latency and missingness. Normalize to climate observations/anomalies, not event headlines; preserve dataset/station IDs, quality flags, baseline period and units. Category `weather` until a dedicated `climate` AtlasEvent category is added.

### Space

| ID / component | Owner; provider | Documentation; endpoint | Auth / free | Commercial / attribution | Refresh / format / coverage / history | Reliability / cache | Status / priority |
|---|---|---|---|---|---|---|---|
| `jpl-news` — NASA/JPL news and Technology Radar | NASA; Jet Propulsion Laboratory | [JPL RSS](https://www.jpl.nasa.gov/rss/); `https://www.jpl.nasa.gov/feeds/news/` | None; free | NASA/JPL credit; NASA images usually reusable with restrictions for logos, endorsement, people, and third-party material; inspect item media rights | 15 min; RSS/XML; global mission news; feed window only, site archive longer | Medium-high; 15 min | **Active / P0** |
| `nasa-open-api` — NASA missions/content | NASA | [Open APIs](https://api.nasa.gov/); example `https://api.nasa.gov/planetary/apod` | API key; `DEMO_KEY` free at low limits, registered key typically 1,000 requests/hour | NASA media/data guidance and endpoint-specific terms; attribution and third-party notices; NASA marks/logos restricted | 1–24 h by dataset; JSON; mission/global; endpoint-specific history | High; 1 h | **Planned / P1** |
| `esa-news` — ESA | European Space Agency | [ESA RSS list](https://www.esa.int/rssfeed/Our_Activities); activity feed URL selected from ESA RSS list | None; free to read | ESA copyright applies; commercial reuse of text/images is not automatically granted; link and excerpt minimally unless permission/license is explicit | 30 min; RSS/XML; ESA missions/global; feed window and web archive | Medium-high; 30 min | **Planned / P1** |
| `cneos-news` — CNEOS news | NASA/JPL; Center for Near Earth Object Studies | [CNEOS](https://cneos.jpl.nasa.gov/); `https://cneos.jpl.nasa.gov/feed/news.xml` | None; free | NASA/JPL attribution and media rules | 30 min; RSS/XML; global NEO news; feed window | Medium-high; 30 min | **Active / P0** |
| `nasa-neows` — Near Earth Objects | NASA/JPL; NeoWs/CNEOS | [NeoWs docs](https://api.nasa.gov/); `https://api.nasa.gov/neo/rest/v1/feed` | NASA API key; free quota | NASA terms; attribution to NASA/JPL; do not describe “potentially hazardous” as predicted impact | 6 h; JSON; solar-system objects with Earth close approaches; browse/history endpoint dependent | High; 6 h | **Planned / P1** |
| `noaa-swpc` — Solar Activity | NOAA/NWS; Space Weather Prediction Center | [Data service](https://services.swpc.noaa.gov/); `https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json`, `.../products/solar-wind/plasma-7-day.json` | None; free | U.S. government data; NOAA/SWPC attribution; products can be experimental and carry product disclaimers | 1–5 min; JSON/text; near-Earth space weather; live 7-day files plus NCEI archives | High; 1–5 min | **Planned / P1** |
| `celestrak-gp` — Satellite layer | CelesTrak; GP data derived from U.S. Space Surveillance Network | [GP query docs](https://celestrak.org/NORAD/documentation/gp-data-formats.php); `https://celestrak.org/NORAD/elements/gp.php?GROUP=ACTIVE&FORMAT=JSON` | None; free access | Follow [usage policy](https://celestrak.org/usage-policy.php), cache at least two hours, download only needed groups; redistribution/licensing and production volume require approval | 2 h; OMM JSON/CSV/XML/TLE; Earth-orbiting catalog subset; current GP, limited public history | Medium-high; 2 h minimum | **Research / P2** |

**Selection and normalization notes**

- **JPL news / CNEOS news:** Selected because they are already implemented official sources. Advantage: low-risk, attributable mission publications. Limitation: editorial feeds are not telemetry and RSS schemas can change. Sanitize HTML, canonicalize URLs, use GUID/link identity, normalize as `space` or `technology`, and never infer hazards from headlines.
- **NASA Open APIs:** Selected for an authenticated, documented gateway to multiple NASA datasets. Advantage: consistent key/quota mechanism. Limitation: each API has a different scientific contract and APOD/media cannot be assumed commercially reusable. Normalize per endpoint; use `space` for mission/astronomy events and keep observations out of the event stream unless thresholded.
- **ESA:** Selected to avoid a NASA-only space perspective. Advantage: official European mission reporting. Limitation: no single open event API and tighter content copyright. Normalize only metadata/excerpts and links as `space`; do not mirror articles or imagery without a license.
- **NeoWs:** Selected for structured close-approach data from NASA/JPL. Advantage: stable object identifiers and approach metadata. Limitation: hazard flags are screening classifications, not forecasts. Normalize each close approach as `space`, with miss distance, relative velocity, diameter uncertainty and hazardous flag preserved.
- **NOAA SWPC:** Selected as the operational U.S. authority for space-weather watches and measurements. Advantage: rapid JSON products. Limitation: directory-style schemas and experimental products. Convert issued alerts/state changes to `space`; store Kp/solar wind/X-ray values as observations with quality/source satellite.
- **CelesTrak:** Selected as a practical documented orbital-elements source. Advantage: OMM support and broad catalog groups. Limitation: no guaranteed SLA, strict responsible-use policy, elements are not live positions, and redistribution needs review. Store elements/epoch as satellite observations, derive display position with SGP4 and label prediction time; category `space`.

### AI and technology official publications

These are publication/news inputs, not vendor model APIs. ATLAS should ingest public announcement metadata and short excerpts; it should not scrape documentation or generate a vendor “activity score” from marketing volume alone.

| ID / component | Owner; official provider | Documentation / endpoint | Auth / free | Commercial / attribution | Refresh / format / coverage / history | Reliability / cache | Status / priority |
|---|---|---|---|---|---|---|---|
| `openai-news` | OpenAI; OpenAI News | [News](https://openai.com/news/); candidate `https://openai.com/news/rss.xml` (validate before implementation) | None; free public reading | OpenAI site terms/copyright; titles, short excerpts and links only; do not use logos as endorsement | 30 min; RSS if validated, otherwise approved site API required; global company news; site archive | Medium; 30 min | **Planned / P1** |
| `anthropic-news` | Anthropic; Anthropic News | [News](https://www.anthropic.com/news); no approved machine endpoint | None to read | Anthropic site terms/copyright; no scraping until written terms/robots review | 1 h if endpoint approved; expected HTML/JSON/RSS; global; site archive | Unknown; 1 h | **Research / P1** |
| `google-ai-blog` | Google; Google AI/DeepMind | [Google AI blog](https://blog.google/technology/ai/); `https://blog.google/technology/ai/rss/` | None; free | Google site content terms; attribute/link, store metadata/excerpt only | 30 min; RSS/XML; global; feed plus archive | Medium-high; 30 min | **Planned / P1** |
| `meta-ai-news` | Meta; Meta AI | [Meta AI news](https://ai.meta.com/blog/); no approved machine endpoint | None to read | Meta site terms/copyright; no scraper until endpoint and reuse terms approved | 1 h; expected RSS/HTML; global; site archive | Unknown; 1 h | **Research / P2** |
| `nvidia-ai-news` | NVIDIA; NVIDIA Blog AI | [AI category](https://blogs.nvidia.com/blog/category/ai/); `https://blogs.nvidia.com/blog/category/ai/feed/` | None; free | NVIDIA copyright/trademark; link/excerpt, do not republish articles/images | 30 min; RSS/XML; global; feed/archive | Medium-high; 30 min | **Planned / P1** |
| `huggingface-blog` | Hugging Face; HF Blog | [Blog](https://huggingface.co/blog); `https://huggingface.co/blog/feed.xml` (validate) | None; free | Post/code/model licenses vary; blog copyright; preserve author and link, never inherit a model license from the blog | 1 h; RSS/XML if validated; global/community; archive | Medium; 1 h | **Planned / P2** |
| `microsoft-ai-blog` | Microsoft; Microsoft AI Blog | [AI blog](https://blogs.microsoft.com/ai/); `https://blogs.microsoft.com/ai/feed/` | None; free | Microsoft copyright/trademark; metadata/excerpt/link only | 30 min; RSS/XML; global; feed/archive | Medium-high; 30 min | **Planned / P1** |

**Selection and normalization notes:** Each vendor was selected because the task explicitly requires first-party AI coverage and these are the canonical corporate publication channels. Advantages are direct provenance and low ambiguity about who made an announcement. Shared limitations are marketing bias, inconsistent taxonomies, feed changes, duplicate cross-posts, and no guarantee that public reading grants commercial republication. Legal review must validate each exact feed and terms on implementation day. Normalize to category `technology`, source GUID/canonical URL, publisher, authors, published/updated times, sanitized plain-text excerpt, tags, and an announcement subtype. Cross-source deduplication may link related stories but must not collapse independently authored announcements. Anthropic and Meta remain Research because no approved stable machine feed is recorded; the candidate OpenAI and Hugging Face feed URLs must be probed and terms-approved before activation.

### Cybersecurity

| ID / component | Owner; provider | Documentation; endpoint | Auth / free | Commercial / attribution | Refresh / format / coverage / history | Reliability / cache | Status / priority |
|---|---|---|---|---|---|---|---|
| `cisa-kev` — CISA | U.S. CISA; Known Exploited Vulnerabilities Catalog | [Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog); `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` | None; free | U.S. government data; cite CISA; notification/privacy/use disclaimer; BOD deadlines apply specifically to covered U.S. federal agencies | 1 h; JSON/CSV; vulnerabilities exploited in the wild globally; full living catalog | High; 1 h | **Planned / P1** |
| `nist-nvd` — NIST NVD | NIST; National Vulnerability Database | [API 2.0](https://nvd.nist.gov/developers/vulnerabilities); `https://services.nvd.nist.gov/rest/json/cves/2.0` | Optional API key; free; 5/30 s public, 50/30 s keyed | Public-domain NIST data; prominently state “uses NVD API but is not endorsed or certified by NVD”; obey API terms/rates | 2 h incremental; JSON; global CVE enrichment; broad historical corpus | High but backlog/outages possible; 2 h | **Planned / P1** |
| `cve-list` — CVE | CVE Program; CVE List | [Downloads](https://www.cve.org/Downloads); `https://github.com/CVEProject/cvelistV5` | None for GitHub; free | CVE Program terms and required marks/attribution; records include CNA-supplied content | 1 h; CVE JSON 5.x/Git; global; full current record history/releases | High; 1 h | **Planned / P1** |
| `cert-vu` — CERT | Carnegie Mellon SEI; CERT/CC Vulnerability Notes | [Database](https://www.kb.cert.org/vuls/); [data archive](https://github.com/CERTCC/Vulnerability-Data-Archive) | None; free access | CMU/CERT copyright and repository license govern; attribute CERT/CC, avoid mirroring prose beyond license | 1 h; repository JSON/Markdown as published; global coordinated disclosures; archive | Medium-high; 1 h | **Planned / P1** |

**Selection and normalization notes**

- **CISA KEV:** Selected because it provides authoritative evidence of exploitation, not merely severity. Advantage: compact remediation-oriented catalog. Limitation: inclusion is curated and not an exhaustive threat feed. Normalize additions/changes to `cyber`, CVE as source item ID, preserve vendor/product/action/due date/ransomware flag; only emit a new event on addition or material revision.
- **NVD:** Selected for CVSS, CWE, CPE and reference enrichment. Advantage: deep structured history. Limitations: analysis lag, optional fields, rate limits, and scores can change. Normalize CVE publications/major modifications to `cyber`; preserve every metric version/vector and distinguish NVD enrichment from CNA assertions.
- **CVE List:** Selected as the canonical CVE record corpus. Advantage: first-party CNA records and complete JSON schema. Limitation: a CVE assignment is not proof of exploitability or impact. Normalize record state, CNA, affected products/versions and dates to `cyber`; correlate by CVE ID without overwriting provenance.
- **CERT/CC:** Selected for coordinated vulnerability notes and mitigation context. Advantage: expert narrative. Limitation: selective rather than comprehensive and text licensing must be respected. Normalize note metadata to `cyber`, link CVEs/vendors, keep only licensed excerpts and canonical links.

### Markets

| ID / component | Owner; provider | Documentation; endpoint | Auth / free | Commercial / attribution/restrictions | Refresh / format / coverage / history | Reliability / cache | Status / priority |
|---|---|---|---|---|---|---|---|
| `fear-greed` — Fear & Greed | No official public cross-market owner selected | CNN index is proprietary and has no approved public API; Alternative.me API is crypto-only: [docs](https://alternative.me/crypto/fear-and-greed-index/) | Alternative.me keyless/free; CNN no approved API | Do not scrape or relabel CNN’s proprietary index; Alternative.me requires attribution and cannot stand for global markets | Daily; JSON/CSV; crypto sentiment only; Alternative.me history available | Variable; 24 h | **Research / P2** |
| `twelve-data-stocks` — Stock/indices | Exchanges own market data; Twelve Data is candidate distributor | [API docs](https://twelvedata.com/docs); `https://api.twelvedata.com/time_series` or `/quote` | API key; limited free plan | Commercial display, delayed/real-time status, exchange entitlements, redistribution and branding depend on paid plan; contract required | 1–15 min depending entitlement; JSON/CSV; multi-exchange; plan-dependent history | Commercial/medium-high; 1–15 min | **Planned / P1** |
| `coingecko` — Crypto | Exchanges/projects own data; CoinGecko is candidate aggregator | [API docs](https://docs.coingecko.com/); `https://api.coingecko.com/api/v3/simple/price` | Demo key/free limits; paid commercial plans | Attribution and plan terms; redistribution/caching and SLA vary by plan | 1–5 min; JSON; global crypto markets; plan-dependent history | Medium-high; 1–5 min | **Planned / P1** |
| `twelve-data-forex` — Forex | Contributing venues; Twelve Data candidate distributor | [Forex docs](https://twelvedata.com/docs); `/exchange_rate`, `/time_series` | API key; limited free | No single official global FX tape; commercial use and redistribution require plan/contract | 5–15 min; JSON/CSV; currency pairs; plan-dependent history | Commercial/medium-high; 5–15 min | **Planned / P1** |
| `eia-oil` — Oil | U.S. EIA; official U.S. energy statistics | [API v2](https://www.eia.gov/opendata/documentation.php); `https://api.eia.gov/v2/petroleum/pri/spt/data/` | API key; free | U.S. government data generally public domain; cite EIA; not an exchange-grade real-time price | Daily/weekly; JSON; major benchmark series with U.S. focus; long history | High; 6–24 h | **Planned / P1** |
| `twelve-data-gold` — Gold | Benchmark/venues own data; Twelve Data candidate distributor | [Commodities docs](https://twelvedata.com/docs); `/time_series?symbol=XAU/USD` | API key; limited free | Gold benchmark licensing and display rights are contract-sensitive; do not claim LBMA benchmark unless licensed | 5–15 min; JSON/CSV; global proxy pairs; plan-dependent history | Commercial/medium-high; 5–15 min | **Planned / P1** |

**Selection and normalization notes:** Fear & Greed remains Research because copying a branded third-party composite would undermine the required ATLAS metric and may violate rights; Alternative.me may only be shown explicitly as “Crypto Fear & Greed by Alternative.me.” Twelve Data is a single candidate for stocks/FX/gold to reduce credential and schema sprawl, but exchange entitlements must be approved before implementation. CoinGecko is selected for broad crypto metadata and accessible development. EIA is selected for legally clear official oil series, with the limitation that it is not intraday trading data. Normalize market ticks/bars to a separate asset observation model: canonical instrument, venue/provider, quote currency, timestamp, OHLCV, delay flag, units and adjustment method. Only threshold/state transitions become category `market` events. Never blend delayed and real-time quotes or call an indicative FX/gold pair an official benchmark.

### Economy

| ID / component | Owner; provider | Documentation; endpoint | Auth / free | Commercial / attribution | Refresh / format / coverage / history | Reliability / cache | Status / priority |
|---|---|---|---|---|---|---|---|
| `imf-data` — IMF | International Monetary Fund | [IMF Data API](https://www.imf.org/external/datamapper/api/help); `https://www.imf.org/external/datamapper/api/v1/` | None; free | IMF data terms apply; attribution and dataset-specific restrictions; do not imply IMF endorsement | Monthly/quarterly/annual; JSON; member economies/global; long macro history varies | High; 24 h | **Planned / P1** |
| `world-bank` — World Bank | World Bank Group | [Indicators API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392); `https://api.worldbank.org/v2/` | None; free | Most datasets under CC BY 4.0 but dataset-specific licenses prevail; attribute World Bank and indicator | Daily cache; JSON/XML; global countries/economies; multi-decade history | High; 24 h | **Planned / P1** |
| `fred` — FRED | Federal Reserve Bank of St. Louis | [API docs](https://fred.stlouisfed.org/docs/api/fred/); `https://api.stlouisfed.org/fred/series/observations` | API key; free | FRED aggregates third-party series; each series has its own copyright/notes; API terms prohibit assuming blanket redistribution rights; cite FRED and source | Daily or source cadence; JSON/XML; strong U.S. plus selected global; long history | High; 6–24 h | **Planned / P1** |
| `ecb-data` — ECB | European Central Bank | [ECB Data API](https://data.ecb.europa.eu/help/api/overview); `https://data-api.ecb.europa.eu/service/data/` | None; free | ECB copyright/reuse policy and attribution; series may contain third-party data | Daily/monthly/quarterly; SDMX-JSON/CSV/XML; euro area and related global series; long history | High; 6–24 h | **Planned / P1** |

**Selection and normalization notes:** These four are selected as authoritative macroeconomic publishers with stable identifiers. Advantages are revisions, metadata and history; limitations are low cadence, release calendars, country-definition changes and series-specific rights. Normalize into a macro observation model using provider series key, ISO country/economy, period, value, unit, seasonal adjustment, scale, vintage/revision timestamp and source notes. Generate category `market` events only for official releases or statistically defined surprises; do not treat missing values as zero. FRED’s underlying-source license must be checked series by series.

### Aviation and marine

| ID / component | Owner; provider | Documentation; endpoint | Auth / free | Commercial / attribution/restrictions | Refresh / format / coverage / history | Reliability / cache | Status / priority |
|---|---|---|---|---|---|---|---|
| `opensky` — Flights | OpenSky Network Association; OpenSky | [API docs](https://openskynetwork.github.io/opensky-api/); `https://opensky-network.org/api/states/all` | OAuth2 client credentials for authenticated use; limited anonymous/free research access | Terms emphasize research/non-commercial use and rate limits; production commercial use requires written fit/permission; attribute OpenSky | 10–30 s; JSON; best in Europe/U.S., variable globally; historical access depends membership | Variable; 10–30 s | **Disabled / P2** |
| `faa-status` — FAA | U.S. Federal Aviation Administration | [FAA data portal](https://www.faa.gov/data_research); selected endpoint pending (NAS status APIs are not a guaranteed general public contract) | TBD; public pages/free | U.S. government data may be reusable but airport/contractor content and operational disclaimers apply; no safety reliance | 1–5 min desired; JSON/XML expected; U.S. NAS; history limited | Unknown until contract; 1 min | **Research / P2** |
| `aviationweather` — AviationWeather | NOAA/NWS Aviation Weather Center | [Data API](https://aviationweather.gov/data/api/); `https://aviationweather.gov/api/data/metar`, `/taf`, `/airsigmet` | None; free with documented limits | U.S. government data; attribute NOAA/NWS/AWC; aviation products are operational but ATLAS is not a flight-planning service | 1–5 min; JSON/GeoJSON/XML/CSV depending product; global reports, U.S.-centered advisories; endpoint-limited history | High; 1–5 min | **Planned / P1** |
| `noaa-marine` — NOAA marine | NOAA/NWS/NDBC | [NDBC web data guide](https://www.ndbc.noaa.gov/docs/ndbc_web_data_guide.pdf); `https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt`; NWS alerts `https://api.weather.gov/alerts/active` | None; free; NWS asks for identifying User-Agent | U.S. government data; attribute NOAA/NDBC/NWS; station data can be missing/provisional; honor weather.gov terms | 5–15 min; text/JSON/CAP; U.S. waters and worldwide buoy partnerships; station archives vary | High in covered regions; 10 min | **Planned / P1** |
| `ais-provider` — AIS ships | Vessel operators/coastal authorities; no approved global provider | Commercial candidates (Spire, Kpler/MarineTraffic, VesselFinder) require procurement; no endpoint selected | Paid credential/license | AIS is safety/security-sensitive and commercially licensed; strict storage, derived-data, display, redistribution, privacy and sanctions terms; attribution contract-specific | 1–15 min; JSON/NMEA-derived; global coverage requires terrestrial + satellite; history paid | Contract-dependent; 1–15 min | **Research / P2** |

**Selection and normalization notes:** OpenSky is already registered but disabled because its terms and OAuth deployment are unresolved; advantage is a strong research network, limitation is uneven coverage and no safety SLA. FAA remains Research until a stable official machine contract is chosen. AviationWeather is selected for official METAR/TAF/SIGMET data and should normalize advisories to `aviation`, while routine reports remain observations. NOAA/NDBC is selected for legally clear marine conditions and alerts; normalize warnings to `marine` and buoy values as observations. Global AIS cannot be obtained responsibly from an unlicensed scrape: procurement must specify permitted caching and redistribution. Aircraft/vessel state records require timestamp, identifier privacy policy, WGS84 position, velocity/course/altitude, source coverage flags and stale detection; they are not events unless an official alert or ATLAS rule fires.

### Health and energy

| ID / component | Owner; provider | Documentation; endpoint | Auth / free | Commercial / attribution | Refresh / format / coverage / history | Reliability / cache | Status / priority |
|---|---|---|---|---|---|---|---|
| `who-emergencies` — WHO | World Health Organization | [Disease Outbreak News API help](https://www.who.int/api/emergencies/diseaseoutbreaknews/sfhelp); stable query endpoint must be validated | None documented; free public access | WHO content is copyrighted; [publishing policy](https://www.who.int/about/policies/publishing/copyright), attribution and logo/no-endorsement rules; API reuse contract must be confirmed | 1 h; Sitefinity JSON expected; global; DON archive on site | Medium until contract validated; 1 h | **Planned / P1** |
| `cdc-media` — CDC | U.S. Centers for Disease Control and Prevention | [CDC data/API portal](https://data.cdc.gov/); Socrata `https://data.cdc.gov/resource/{dataset-id}.json`; official RSS feeds dataset-specific | Optional Socrata app token for higher limits; free | U.S. government content generally public domain, but logos, photos and third-party content differ; cite CDC and dataset, no endorsement | 1–24 h by dataset; JSON/CSV/RSS; mainly U.S., some global notices; dataset-specific history | High; 1 h–24 h | **Planned / P1** |
| `eia-v2` — Energy | U.S. Energy Information Administration | [API v2 docs](https://www.eia.gov/opendata/documentation.php); `https://api.eia.gov/v2/` | API key; free | U.S. government statistics generally public domain; cite U.S. EIA; API is informational, not trading-grade | Hourly/daily/weekly/monthly by series; JSON; U.S.-centric with international series; long history | High; cadence-aligned 1 h–24 h | **Planned / P1** |

**Selection and normalization notes:** WHO is selected as the global outbreak authority, but its Sitefinity contract must be validated before enabling; normalize Disease Outbreak News publications to `health`, retain affected places/pathogen/publication identity, and never infer case counts absent structured values. CDC is selected for authoritative U.S. health datasets and notices; its major limitation is dataset fragmentation, so every dataset needs its own schema/license sub-entry before use. Normalize alerts/releases to `health` and routine surveillance as observations with geography, measure, denominator and revision. EIA is selected as the official, free energy-statistics backbone; its limitation is U.S.-centric and non-real-time coverage. Normalize series observations with fuel, geography, frequency, unit and revision; only material releases/outages become `energy` events.

### Official news source policy and inventory

| News family | Owner/provider and endpoint | Use in ATLAS | Status / priority |
|---|---|---|---|
| Official RSS aggregator | No third-party news aggregator approved. ATLAS directly polls allow-listed first-party RSS/Atom/API endpoints. | Parse XML defensively, sanitize markup, retain canonical link/GUID, publisher and timestamps; never bypass paywalls or republish full text. | **Architecture Active / P0** |
| NASA | NASA/JPL feed `https://www.jpl.nasa.gov/feeds/news/`; NASA agency feeds chosen from [NASA RSS](https://www.nasa.gov/rss-feeds/) | `space`/`technology`; NASA/JPL currently active | **Active subset / P0** |
| NOAA | NHC feeds above; NOAA/NWS feeds and APIs selected per product | Hazard-owner categories, not generic `news`, when structured alerts exist | **Active NHC; Planned rest / P0** |
| USGS | USGS GeoJSON for events; [USGS news feeds](https://www.usgs.gov/news) only after exact feed validation | Prefer event API over news; publications normalize `news` | **Event Active; news Planned / P1** |
| WHO | Disease Outbreak News API/page | Normalize `health`, metadata/excerpt/link only under WHO policy | **Planned / P1** |
| ESA | ESA activity RSS selected from official list | Normalize `space`; do not mirror copyrighted copy/media | **Planned / P1** |
| Government | Allow-list only: CISA KEV/alerts, CDC datasets/RSS, FAA/agency feeds selected above | Preserve agency and jurisdiction; government status does not eliminate third-party rights | **Planned / P1** |
| Technology | First-party AI company sources listed above plus JPL | Normalize `technology`; label corporate announcements, dedupe syndicated copies | **JPL Active; companies Planned/Research / P1** |

**Why this policy:** Direct official sources maximize provenance and minimize headline licensing risk. Advantages are traceability and clear ownership. Limitations are uneven RSS support, editorial bias, schema drift, and gaps in general world news. Legal considerations require storing only necessary metadata and permitted excerpts, honoring robots/terms and media rights, and linking to originals. Normalization follows `AtlasEvent` with category chosen by subject owner (`space`, `health`, `cyber`, etc.), not a blanket `news` category unless the item has no stronger event taxonomy.

## ATLAS AI computed metrics

These metrics are future first-party analytics. They are **not downloaded**, and “AI” does not mean an LLM invents a number. Each result must be reproducible from versioned inputs and a versioned formula/model, provide contributing-source citations, publish uncertainty, and fall back to `not-computed` when coverage is inadequate. Initial releases should use transparent deterministic formulas; learned calibration may follow only after backtesting.

Common method: transform each input to robust 0–100 sub-scores using rolling historical percentiles by region/season; apply freshness and source-health weights; aggregate geographically by exposed population where licensed population data exists; cap correlated sources; compute confidence from coverage, freshness, agreement and model calibration. Store metric version, input snapshot IDs, value, confidence, and explanation factors.

| Metric | Purpose | Required source inputs | Calculation idea | Confidence | Update | Why ATLAS-owned |
|---|---|---|---|---|---|---|
| **Global Risk Index** | One explainable measure of current multi-domain global risk | Disaster Pressure, Cyber Threat, Market Stress, Climate Stress, health alerts; later conflict | Weighted nonlinear blend with domain caps and interaction terms; publish domain contributions, never a bare number | Weighted input confidence × geographic coverage; lower when any critical domain is absent | 15 min | Cross-domain composition must match ATLAS taxonomy, coverage and transparent provenance; no third party represents this exact system |
| **Human Concern Index** | Estimate attention/concern reflected in trusted information flow and exposed populations | First-party news volume/novelty, official warning severity, affected population; optional licensed public-attention signals later | Baseline-adjusted volume × severity × novelty × exposure, deduped by underlying event and corrected for publisher cadence/language | Coverage across regions/languages and source diversity; explicitly low without attention signals | 30 min | Avoids copying opaque “sentiment”; ATLAS can disclose bias and distinguish concern from emotion |
| **Fear Index** | Downside-risk/defensive-state component across markets and real-world hazards | Volatility/drawdown/breadth from licensed markets, CISA/health/disaster accelerations | Robust percentile of downside volatility, negative breadth, safe-haven moves and hazard acceleration; separate crypto/market scope | Market coverage + quote freshness + hazard-source health | 5–15 min | A transparent ATLAS factor avoids trademarked/proprietary Fear & Greed indices and can cover more than one asset class |
| **Greed Index** | Risk-appetite/upside-exuberance component | Market momentum, positive breadth, volume, crypto leverage inputs if licensed | Percentile of positive momentum/breadth and risk-on cross-asset confirmation; penalize narrow/illiquid moves | Instrument breadth, real-time entitlement and cross-signal agreement | 5–15 min | Keeps methodology, universe and licensing explicit instead of cloning a branded number |
| **Attention Index** | Measure how concentrated global official attention is on events/topics | All official feeds, event deduplication, publication timestamps, optional search-trend license | Novel, deduplicated mention velocity and publisher diversity relative to each source’s baseline; topic concentration via entropy | Feed coverage, language coverage, duplicate-resolution quality | 15 min | ATLAS needs an event-linked attention measure with citations, not an opaque social trend score |
| **Technology Index** | Track material AI/technology activity and risk | Seven AI vendor feeds, NASA/JPL, CVE/CISA technology vulnerabilities, later releases/research datasets | Weighted counts of verified launches, research, incidents and security actions; normalize publisher volume and separate progress/risk sub-scores | First-party coverage and classifier precision; human-reviewed taxonomy sampling | 1 h | Vendor-neutral, provenance-first coverage is unique to ATLAS and avoids copying market/brand rankings |
| **Climate Stress Index** | Track persistent environmental stress relative to climate normals | NOAA/NCEI anomalies, Open-Meteo short-term context, FIRMS, flood/drought/heat datasets, EIA emissions/energy where suitable | Population/area-weighted standardized heat, precipitation, fire and other anomalies over seasonal baselines; slow and fast components | Spatial completeness, baseline length, observation quality; no score if baseline is inadequate | Daily, with monthly revision | ATLAS can expose baseline, geography and hazard links; generic third-party scores use different assumptions and licenses |
| **Disaster Pressure Index** | Quantify current burden and acceleration of natural hazards | USGS, NHC, tsunami.gov, FIRMS, GDACS floods, GVP, exposed population | Sum severity × exposure × recency × persistence, deduped across aggregators/owners; apply regional saturation to avoid event-count inflation | Hazard coverage, geometry quality, authority, freshness and exposure-data quality | 5–15 min | ATLAS controls cross-hazard deduplication and can explain every contributing event |
| **Cyber Threat Index** | Measure observable public vulnerability/exploitation pressure | CISA KEV additions, NVD/CVE publication/modification, CERT notes | Exploitation evidence dominates; add severity, affected prevalence proxy, ransomware flag, remediation urgency and publication acceleration | High for KEV facts, lower for prevalence/missing enrichment; source-lag penalty | 1 h | Produces an auditable operational signal without copying a vendor threat score or conflating CVSS with risk |
| **Market Stress Index** | Measure cross-asset dislocation | Licensed stock/index, FX, gold, oil, crypto observations; macro release events | Volatility, drawdown, correlation spike, liquidity proxy and cross-asset dispersion percentiles; separate delayed-data mode | Entitled instrument breadth, latency, market-hours handling and missing-data rate | 5–15 min | ATLAS can define its own lawful instrument universe and disclose delay/coverage instead of copying proprietary VIX-like composites |

### Metric safeguards

- No metric is a safety instruction, investment advice, diagnosis, or forecast.
- No score is published with confidence below a configured threshold; display “insufficient data.”
- Backfills use only data available at the historical computation time to prevent look-ahead bias.
- Formula and material weight changes increment a metric version; old and new series must not be spliced silently.
- LLMs may summarize cited factors but do not directly choose numerical values. Human evaluation is required for classifier/model changes.
- “Fear,” “Greed,” and similar labels must use ATLAS branding and methodology and must not imitate third-party visual identity or imply equivalence.

## C. Missing sources and unresolved decisions

| Gap | Why missing / decision required | Recommended next action | Priority |
|---|---|---|---|
| Global conflict incidents | No provider was requested and licensing/editorial neutrality are high-risk; official sources do not form a complete global feed | Product/legal review of ACLED, UCDP and UN sources; define whether conflict belongs in ATLAS before procurement | P2 |
| Global cyclone basins outside NHC/CPHC | Current NHC source does not cover all WMO basins | Add WMO-designated RSMC/TCWC feeds basin by basin or a licensed global aggregator with authority labels | P1 |
| Global flood local warnings | GDACS prioritizes major events and is an aggregator | Add national hydrometeorological authorities and GloFAS/Copernicus after license/API review | P1 |
| Drought, heatwave, air quality | Required for Planet Health/Climate Stress but not in the minimum source list | Evaluate NOAA/Copernicus, WHO/WMO and OpenAQ v3; OpenAQ remains disabled until key/terms approval | P1 |
| Population/exposure baseline | Computed disaster metrics need affected-population estimates | Select WorldPop/GHSL/World Bank population datasets and record their licenses/versioning | P1 |
| Global AIS | No free authoritative global stream; public AIS scraping is unsuitable | Procure a provider with explicit server-cache, display, history and derived-data rights | P2 |
| Exchange-grade stocks, FX and gold | Candidate aggregator does not itself confer all exchange/benchmark rights | Select paid plan and obtain written entitlement matrix before UI display/API redistribution | P1 |
| Fear & Greed external index | Proprietary branded indices conflict with ATLAS-computed requirement | Do not ingest; implement ATLAS Fear and Greed metrics after lawful market inputs | P2 |
| Anthropic and Meta machine feeds | No approved stable official RSS/API recorded | Ask vendors/validate official feed discovery and terms; otherwise use manual editorial links, not scraping | P2 |
| General world/government news | “Official” is a policy, not one endpoint; global language coverage absent | Maintain jurisdictional allow-list with one registry row and license record per feed | P1 |
| WHO stable API query | Sitefinity help exists but production pagination/schema is unvalidated | Contract test endpoint, identify terms and schema, then activate | P1 |
| FAA stable public API | Public pages do not equal a supported data contract | Select an FAA SWIM or approved public dataset and determine credential/terms requirements | P2 |
| Historical event persistence | Live feeds have short windows | Implement licensed internal snapshots, retention policy and correction/tombstone handling before claims of history | P0 |
| Dedicated `climate` category | Current `AtlasEventCategory` has weather but not climate/tsunami/satellite | Future schema decision; do not overload event types indefinitely | P1 |

## D. Legal and licensing notes

1. **Publicly reachable is not public domain.** A URL without authentication may still forbid commercial reuse, bulk download, derivative databases, or redistribution.
2. **U.S. government works:** USGS, NOAA, NASA, CDC, CISA, NIST and EIA data produced by federal employees are generally public domain in the United States, but agency logos/marks, people’s likenesses, contractor/third-party content and some linked datasets are not. Always attribute and never imply endorsement.
3. **Attribution chain:** Store `sourceName`, canonical item URL, upstream owner, dataset/version and required attribution with every normalized record. UI widgets and exported/API data must carry the same chain.
4. **Government warnings:** ATLAS is a secondary display, not an emergency-warning authority. Show issue/update/cancel state, jurisdiction, stale status and direct official link. Preserve NHC, tsunami, aviation and weather disclaimers.
5. **RSS copyright:** RSS is a transport format, not a content license. Store only metadata, a minimal permitted excerpt and a canonical link unless explicit terms allow more. Do not copy full articles or images by default.
6. **Commercial market data:** Exchange and benchmark rights can attach even when an aggregator provides an API. Contracts must explicitly cover web display, derived metrics, retention, caching, redistribution through ATLAS API/widgets, user geography and delayed/real-time labels.
7. **Open-Meteo:** The keyless public hosted tier is described for non-commercial use; production commercial deployment must use a suitable customer/paid arrangement and retain Open-Meteo plus underlying-provider attribution.
8. **OpenSky and AIS:** Location streams carry provider terms, safety caveats and potential privacy/security concerns. Do not expose bulk raw tracks through public APIs without contract and abuse review.
9. **WHO/ESA/company content:** These organizations retain copyright. Linking and factual metadata are safer than republication; logo and brand use need separate approval.
10. **Database rights:** EU database rights may apply independently of copyright. CC BY content requires attribution and change indication. Dataset-level licenses override general portal assumptions.
11. **No model-training assumption:** Permission to display or analyze a feed does not grant permission to train models on it. Any training/evaluation corpus requires a separate rights register.
12. **Retention/deletion:** Record provider corrections and tombstones. If terms restrict retention, keep derived aggregates only where permitted and expire raw payloads on schedule.
13. **Terms drift:** Legal review is required at integration and at least annually, plus whenever provider terms, endpoint, ownership, pricing or attribution changes. Record the reviewed terms URL and date in the runtime registry.
14. **Not legal advice:** This specification identifies known constraints; counsel/procurement must approve commercial launch and data redistribution.

## E. Recommended implementation priority and roadmap

### Phase 1 — Current Active Sources

Goal: harden what ATLAS truthfully serves today.

1. **P0:** USGS Earthquake GeoJSON — active.
2. **P0:** NOAA/NHC cyclone GIS RSS — active, keep experimental-feed warning.
3. **P0:** Open-Meteo weather — active; resolve production commercial plan before monetized launch.
4. **P0:** NASA/JPL news — active.
5. **P0:** CNEOS news — active.
6. Add source-registry legal review date, raw retention, stale-data policy, schema/version monitoring and attribution rendering. Persist event history with update/tombstone semantics.

Exit criterion: every displayed value links to an upstream item, source health is visible, stale data is labeled, and no placeholder appears as live data.

### Phase 2 — Easy integrations

Goal: fill the most visible dashboard gaps with keyless or straightforward official feeds.

1. **P0:** NOAA tsunami Atom/CAP.
2. **P0:** GDACS flood/multi-hazard API.
3. **P1:** Smithsonian GVP weekly volcano reports/database.
4. **P1:** NOAA SWPC solar activity.
5. **P1:** CISA KEV and CVE List; add NVD key later for higher throughput.
6. **P1:** AviationWeather hazards and NOAA/NDBC marine observations.
7. **P1:** World Bank, IMF and ECB macro series.
8. **P1:** Official AI/company feeds whose endpoints and reuse terms validate: Google, NVIDIA, Microsoft, then Hugging Face; ESA RSS and expanded NASA/NOAA/USGS/CDC news.

Exit criterion: parsers have fixtures/contract monitoring, source-specific attribution, backoff, deduplication and explicit coverage labels.

### Phase 3 — Credentialed sources

Goal: add quota-controlled and contracted data only after secrets, cost and rights are approved.

1. **P0:** NASA FIRMS MAP_KEY for wildfire.
2. **P1:** NASA Open APIs/NeoWs key; NVD API key; FRED and EIA keys.
3. **P1:** Procure stock/index, FX, gold and crypto production plans with display/derived-data rights.
4. **P2:** Decide OpenSky commercial/production fit and OAuth; keep disabled until approved.
5. **P2:** Procure global AIS; select FAA contract/channel; assess satellite-element redistribution.
6. Resolve Open-Meteo commercial production access and OpenAQ v3 if air quality is adopted.

Exit criterion: credential rotation, quota budgets, provider-specific cache enforcement, entitlement tests, geographic restrictions and public API redistribution rules are documented.

### Phase 4 — AI-computed intelligence

Goal: release transparent ATLAS metrics in dependency order.

1. Disaster Pressure Index and Cyber Threat Index.
2. Market Stress Index after licensed market breadth is sufficient.
3. Climate Stress Index after baselines/exposure datasets are versioned.
4. Attention, Technology and Human Concern indices after multilingual/source-bias evaluation.
5. Fear and Greed indices as named ATLAS components.
6. Global Risk Index last, because it depends on the domain indices; Planet Pulse/Planet Health become presentation composites over these versioned metrics.

Exit criterion: published methodology, reproducible snapshots, confidence thresholds, backtests, drift monitoring, citations and human review. LLM prose is grounded only in stored factors.

### Phase 5 — Predictive analytics

Goal: cautiously add forecasts, never unlabelled predictions.

1. Define forecast targets, horizons, ground truth and decision use before modeling.
2. Build leakage-safe historical snapshots with provider revisions preserved.
3. Backtest against seasonal and persistence baselines; calibrate probabilities by region/domain.
4. Publish uncertainty, coverage, model/version, training cutoff and major drivers.
5. Run shadow mode and expert review before user display; prohibit automated safety/financial actions.
6. Add conflict/pandemic/disaster escalation forecasts only after ethical, bias, misuse and legal review.

Exit criterion: a model card, reproducible evaluation, calibration thresholds, rollback plan and clear “forecast, not fact” UI contract exist for every predictive output.

## Final implementation order

**Immediate P0:** protect the five active integrations; add tsunami, wildfire, flood and durable event history.  
**Next P1:** volcano, space weather, cyber, macroeconomy, marine/aviation weather, expanded official news, global cyclone coverage, and climate/exposure baselines.  
**Then credentialed P1:** lawful market data, EIA/FRED/NVD/NASA keys and production weather terms.  
**P2 after product/legal approval:** flights, AIS, satellites, conflict, proprietary content and vendor channels without supported machine feeds.  
**Computed intelligence:** begin only when its required source coverage and historical baselines meet confidence thresholds; Global Risk is the final composite, not the first.

---

### Change-control checklist

For every new or changed source, update: component/feature mapping; owner/provider; documentation and exact endpoint; authentication/secret owner; free/paid plan; commercial and redistribution rights; attribution text; cadence/format/coverage/history; reliability/SLA; cache and raw retention; status/priority; normalization mapping; `AtlasEvent` category; parser fixtures; source-health checks; terms-review date; and fallback/stale behavior. A provider is **Active** only after all fields are complete and runtime behavior matches this document.
