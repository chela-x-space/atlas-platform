# ATLAS Intelligence Search & Explorer

ATLAS v1.3 is a deterministic index projection over existing Risk/Timeline, Breaking News, Global
Map capability, AI Radar, and Reports records. It does not call providers from the UI, replace
canonical contracts, or create a second source of truth. No LLM, embedding, vector search, semantic
model, generated suggestion, or predictive scoring is used.

## Canonical boundary and deduplication

Search documents retain canonical IDs, paths, timestamps, fields, provenance, attribution, official
links, and verified coordinates. Appearances in multiple ATLAS modules are merged by canonical ID;
the `domains` list records Timeline, Risk, Breaking, Map, Reports, and Radar availability without
duplicating results. Missing fields remain null.

## Deterministic relevance

Relevance precedence is: exact canonical ID (800), exact title (700), title prefix (600), all title
tokens (500), provider (400), location (300), category (200), then all description/tag/source
tokens (100). Results then tie-break by timestamp descending and canonical ID. Other sort modes are
newest, oldest, risk high/low using the v1.1 scale, title A–Z, and provider A–Z.

## Filters, time, facets, and URL state

Filters cover canonical category/subcategory, provider, country, region, risk, content domain,
coordinates, official sources, and time. Today uses midnight UTC; rolling presets use the index
generation instant; custom inputs are explicit UTC instants. Facets are contextual counts over the
fully filtered result set. URL parameters are sorted and array values are deduplicated/sorted, so a
shared `/app/search?...` URL reproduces state.

## Suggestions and local state

Suggestions require two characters, are capped at 20, and come only from indexed titles, provider
names, canonical IDs, countries, regions, and categories. Saved searches and a bounded ten-item
recent history use browser storage only. Corrupt or unavailable storage degrades to empty local
state and never changes backend or canonical data.

## Cache and degraded mode

The index has a stable `atlas-search-v1.3:canonical-projections` cache key, 60-second freshness, and
five-minute verified stale fallback. Module failures retain results from available modules and are
named in status warnings. `/api/search/status` reports readiness, document count, domains, index
time, degraded modules, and warnings. If no index can be produced, APIs return 503.

## APIs

- `GET /api/search`
- `GET /api/search/facets`
- `GET /api/search/suggestions?q=...&limit=...`
- `GET /api/search/status`

Known limitations: coverage equals configured ATLAS modules and their reported fields. Reports are
indexed at report-type level; no report-to-event relationship is inferred. Market integration is
not included.
