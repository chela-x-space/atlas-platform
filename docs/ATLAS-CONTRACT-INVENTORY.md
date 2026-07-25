# ATLAS Contract Inventory

Baseline: commit `9ef729a` through v1.4. Classifications:

- **FROZEN** — public identity, semantics, route, response, ordering, or trust contract.
- **INTERNAL-STABLE** — shared internal boundary relied on by multiple modules.
- **IMPLEMENTATION-DETAIL** — replaceable when frozen observable behavior remains.
- **FUTURE** — configured or documented but not an implemented production contract.

## Canonical foundation

| Contract | Owner / source | Boundaries and behavior | Protection | Class |
|---|---|---|---|---|
| Canonical event | Data Hub; `apps/web/src/types/atlas-data.ts` | `AtlasEvent`: ID/fingerprint, category/type, verified source metadata, timestamps, severity/status, optional WGS84 coordinates, tags/metadata, attribution. Returned through `/api/events`, Event Detail, and downstream projections. Query sorts: occurrence asc/desc, update desc, severity desc. | `data-hub-contracts`, `real-data`, `event-detail` | FROZEN |
| Event identity | Data Hub; `lib/data-hub/event-identity.ts` | `evt_<32 hex>` and `sha256:` fingerprint. Explicit source item ID wins; fallback identity uses version, source, category, normalized type/title, coordinate precision, and five-minute UTC bucket. | `data-hub-contracts`, fixture tests | FROZEN |
| Category/severity | `types/atlas-data.ts`; projection mapping in Breaking | Data Hub categories and severities retain their implemented meaning. Breaking categories are a downstream mapping and do not replace them. | Data Hub, Timeline, Breaking tests | FROZEN |
| Coordinates | `AtlasCoordinates`; normalizers; `global-map-logic.mjs` | WGS84 longitude then latitude. Provider-supplied values only; invalid/missing coordinates are excluded from map actions. | `real-data`, `global-map` | FROZEN |
| Provider/source registry | `config/data-sources.ts`; source fetchers | ID, organization, status, endpoints, licensing/attribution, refresh policy, configuration boundary. Disabled/planned sources produce no records. | `real-data`, `source-center`, provider tests | FROZEN trust boundary; registry mechanics INTERNAL-STABLE |
| Event store | `lib/event-store/*` | Canonical event ownership, upsert/query/get/expiry boundary. Current in-memory implementation is replaceable if semantics remain. | Data Hub tests | INTERNAL-STABLE; storage engine IMPLEMENTATION-DETAIL |
| Provenance/attribution | Canonical and module contract files | Source/provider ID, URL metadata, attribution and canonical evidence must survive projections and exports. | All milestone tests | FROZEN |

## Module contracts

| Contract | Owner / source | Public routes and APIs | Inputs, outputs, sorting/filtering, failure/cache | Protection | Class |
|---|---|---|---|---|---|
| Global Timeline | `lib/timeline/timeline-contract.ts`, logic/service | `/app/timeline`; `GET /api/timeline` | Canonical events/reports/advisories; verified-only items, source status, cursor and filters. Deterministic time ordering with stable identity. Partial is 206; invalid 400; unavailable 503. | `timeline.test.mjs` | FROZEN |
| Breaking News | `lib/breaking/breaking-contract.ts`, logic/service | `/app/breaking`; `/api/breaking`, `/latest`, `/providers` | Timeline + Radar projection; fixed priority/category rules, canonical dedupe, stable priority/time/ID ordering, provider health. Cached verified stale fallback; explicit partial/stale and 206/503. | `breaking-news.test.mjs` | FROZEN |
| AI Radar | `lib/ai-radar/ai-radar-contract.ts`, registry/providers/service | `/app/ai`; `/api/ai`, `/technology`, `/releases`, `/benchmarks` | Explicit registry/provider facts, official links and provenance; stable filters/order from Radar logic; partial/stale provider state. | `ai-radar.test.mjs` | FROZEN public contract; registry assembly INTERNAL-STABLE |
| Global Map | `lib/global-map/global-map-logic.mjs`; `GlobalOperationsMap.tsx` | `/app/map`; no map-specific API | Consumes `/api/breaking?limit=200`; verified coordinates, layer/category/priority/date/provider/country filters, deterministic marker size/color, clustered GeoJSON, canonical focus query. | `global-map.test.mjs` | FROZEN behavior; MapLibre layout IMPLEMENTATION-DETAIL |
| Risk | `lib/risk/risk-contracts.ts`, `risk-engine.mjs`, service | `/app/risk`; `/api/risk`, `/alerts`, `/summary`, `/rules` | Timeline input. Fixed five-level scale, v1.1 rules and precedence, explanations, safe fallback, stable level/priority/time/ID queue order. Filtering does not classify. Cached stale fallback; explicit degraded/stale 206/503. | `risk-engine.test.mjs` | FROZEN |
| Reports | `lib/reports/report-contracts.ts`, engine/service/cache | `/app/reports`; `/api/reports`, `/types`, `/summary`, `/export` | Risk alerts; eight report types, UTC history boundaries, deterministic count/time/ID order, attribution-preserving Markdown/JSON/text. Explicit degraded/stale 206/503. | `reports.test.mjs` | FROZEN |
| Search document projection | `lib/search/search-contracts.ts`, `search-index.mjs` | `/app/search`; `/api/search` family | Deduplicates module membership by canonical identity; output retains domains, canonical navigation, official sources, coordinates and provenance. Partial module indexing is explicit. | `search-explorer.test.mjs` | FROZEN |
| Search ranking/filtering | `search-engine.mjs` | `/api/search`, `/facets`, `/suggestions`, `/status` | Relevance precedence: exact canonical ID, exact title, title prefix, title token, provider, location, category, description token; timestamp and canonical ID tie-break. UTC presets/custom range, contextual facets, bounded stable suggestions and pagination. | `search-explorer.test.mjs` | FROZEN |
| Search URL/local state | `search-url-state.mjs`, `saved-searches.mjs` | `/app/search?...` | Sorted deterministic query serialization. Saved/recent searches are browser-local, bounded and corruption-safe; no canonical writes. | `search-explorer.test.mjs` | FROZEN URL contract; browser storage implementation INTERNAL-STABLE |
| Entity graph node/edge | `lib/graph/entity-graph-contracts.ts`, builder | `/app/entities`, `/app/entities/[entityId]`; entity/graph APIs | Search projection input. Nodes reference canonical records or explicit structured fields. Directed edges carry evidence ID/path, provenance, derivation and deterministic confidence policy. | `entity-knowledge-graph.test.mjs` | FROZEN |
| Entity identity | `entity-normalization.mjs` | Entity IDs in routes/APIs | NFKC, trim, `en-US` lowercase, punctuation-run hyphen normalization; `entity:<type>:<value>`, stable hash suffix on collisions. No name-similarity merge. | `entity-knowledge-graph.test.mjs` | FROZEN |
| Entity query/traversal | `entity-graph-query.mjs` | `/api/entities*`; `/api/graph?view=entities`; `/api/graph/status` | Contextual facets; deterministic label/connection/activity/risk/source sorts with canonical ID tie-break. Depth 1–2, max 100 nodes/200 edges. Partial/degraded state explicit. | `entity-knowledge-graph.test.mjs` | FROZEN |
| Legacy Event Graph | `lib/graph/graph-contract.ts`, logic/service | `/app/graph/[id]`; `/api/graph`, `/api/graph/[id]` | Canonical event-centered graph. `/api/graph` remains legacy unless `view=entities` is explicit. | `event-graph.test.mjs` | FROZEN compatibility |
| Source Center | `lib/source-health/*`, provider/source contracts | `/app/sources`; `/api/source-health` | Reports actual source state, attribution/configuration and failures; does not fabricate availability. | `source-center.test.mjs`, provider tests | FROZEN public status |

## Public route inventory

Frozen milestone routes actually present:

- Dashboard: `/app` (there is no `/app/dashboard`)
- Timeline: `/app/timeline`
- Breaking News: `/app/breaking`
- Global Operations Map: `/app/map`
- Global Risk: `/app/risk`
- Reports Center: `/app/reports`
- Intelligence Search: `/app/search`
- Entity Knowledge Graph: `/app/entities`
- Entity detail: `/app/entities/[entityId]`
- Event Detail and Event Graph: `/app/events/[id]`, `/app/graph/[id]`
- AI Radar and Source Center: `/app/ai`, `/app/sources`

The route-to-menu mapping in `lib/dashboard-logic.mjs`, desktop sidebar, and mobile
menu is **FROZEN**. Visual ordering and icons are **IMPLEMENTATION-DETAIL**.

## API inventory

Implemented APIs in the frozen domains:

- Canonical/event/source: `/api/events`, `/api/events/[id]`, `/api/timeline`,
  `/api/source-health`
- Breaking: `/api/breaking`, `/api/breaking/latest`, `/api/breaking/providers`
- AI Radar: `/api/ai`, `/api/ai/technology`, `/api/ai/releases`,
  `/api/ai/benchmarks`
- Risk: `/api/risk`, `/api/risk/alerts`, `/api/risk/summary`,
  `/api/risk/rules`
- Reports: `/api/reports`, `/api/reports/types`, `/api/reports/summary`,
  `/api/reports/export`
- Search: `/api/search`, `/api/search/facets`, `/api/search/suggestions`,
  `/api/search/status`
- Entity/graph: `/api/entities`, `/api/entities/[entityId]`,
  `/api/entities/[entityId]/relationships`, `/api/graph`,
  `/api/graph/[id]`, `/api/graph/status`

The response fields, status semantics, accepted query names, canonical navigation,
and attribution represented by their contract/route files are **FROZEN**.
Validation implementation and header formatting are **INTERNAL-STABLE** unless
consumers rely on a documented header.

## Intelligence API classification

All current unversioned `/api/*` endpoints listed above are **INTERNAL**. They
serve the ATLAS application and existing modules; none is implicitly
`PUBLIC-STABLE`, `PARTNER`, or externally supported. ADR-0004 defines the future
`/api/v1` boundary and candidate resource families without publishing them.
Current page/`pageSize` pagination, deterministic sorting, 200/206/400/404/503
status behavior, provenance, attribution, freshness, and degraded metadata remain
owned by their existing service contracts.

## Cache and degraded-state inventory

Breaking, Radar/news, Risk, Reports, Search, and Entity Graph use deterministic
cache keys and bounded freshness/stale windows in their cache/service modules.
Exact TTL constants and in-memory map choice are **IMPLEMENTATION-DETAIL**.
The following are **FROZEN**:

- stale fallback contains only previously verified data;
- partial/degraded/stale/provider failures are surfaced;
- upstream failure is not disguised as successful empty data;
- 206 is used by milestone projections for usable partial/degraded results;
- unavailable canonical inputs return safe 503 responses.

## Future/non-contract inventory

Configured but disabled/planned providers, market integration, multi-user saved
state, external notification delivery extensions, semantic/vector search,
probabilistic entity resolution, and AI-generated canonical data are **FUTURE**.
Their names in documentation do not constitute implemented contracts.

CSS, component structure, SVG/radial placement, MapLibre internals, private helper
names, cache containers, and directory layout are **IMPLEMENTATION-DETAIL**.
