# ATLAS Platform

ATLAS is a deterministic global intelligence platform built from verified, attributable provider
data. Production modules include the Dashboard, News Center, Source Center, Global Timeline, Event
Detail, Event Graph, Global Metrics, Global Sentiment, AI Technology Radar, and Breaking News
Center, and Global Operations Map.

## Global Operations Map

`/app/map` plots only verified canonical events with provider-supplied coordinates. It uses
MapLibre GL, open tiles, deterministic category symbols, and Breaking News priority colors. Missing
locations are never inferred. See `docs/ATLAS-GLOBAL-MAP.md`.

## Global Risk & Alert Engine

`/app/risk` applies versioned deterministic rules to verified canonical timeline records. It
preserves provenance, exposes the matched rule, degrades conservatively when fields are missing,
and never generates probabilities or forecasts. APIs: `/api/risk`, `/api/risk/summary`,
`/api/risk/alerts`, and `/api/risk/rules`. See `docs/ATLAS-RISK-ENGINE.md`.

## Reports Center

`/app/reports` creates deterministic Daily, Weekly, AI, Cybersecurity, Natural Disaster, Space,
Breaking News, and Risk Summary reports from verified canonical data. Attribution-preserving
exports are available as Markdown, JSON, and plain text. See `docs/ATLAS-REPORTS.md`.

## Intelligence Search & Explorer

`/app/search` provides deterministic, shareable search across canonical Timeline/Risk, Breaking,
Map, Reports, and AI Radar projections. Ranking and suggestions use documented fixed rules; no LLM,
embedding, or vector search is used. See `docs/ATLAS-SEARCH-EXPLORER.md`.

## Breaking News Center

`/app/breaking` presents current verified events from existing ATLAS providers. Priority is computed
with published deterministic rules; headlines, dates, locations, source links, and provider state
remain unchanged from canonical inputs. ATLAS does not generate news or infer missing events.

APIs: `/api/breaking`, `/api/breaking/latest`, and `/api/breaking/providers`.

## Development validation

From `apps/web` run:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Entity Knowledge Graph

ATLAS v1.4 adds `/app/entities`, an evidence-backed graph projection over existing
canonical intelligence. It preserves provenance and canonical navigation, uses
stable entity IDs and bounded traversal, and performs no LLM extraction,
embeddings, probabilistic resolution, or inferred relationship generation. See
[`docs/ATLAS-ENTITY-KNOWLEDGE-GRAPH.md`](docs/ATLAS-ENTITY-KNOWLEDGE-GRAPH.md).

## Architecture governance

Architecture Freeze v1.0 is **ACTIVE** for the production baseline through v1.6.
It freezes canonical ownership, deterministic
module contracts, provenance, public routes/APIs, failure semantics, and the
non-canonical optional-AI boundary. ADR-0002 is **ACCEPTED** and defines the
Alert Domain boundary. ADR-0003 is **ACCEPTED** and defines the Notification
Delivery boundary.

- [Architecture Freeze](docs/ATLAS-ARCHITECTURE-FREEZE-V1.md)
- [ADR-0001](docs/ADR-0001-ATLAS-ARCHITECTURE-FREEZE-V1.md)
- [Contract Inventory](docs/ATLAS-CONTRACT-INVENTORY.md)
- [Change Control](docs/ATLAS-CHANGE-CONTROL.md)
- [ADR-0003 Notification Delivery Boundary](docs/ADR-0003-NOTIFICATION-DELIVERY-BOUNDARY.md)

## Notification Runtime

v1.7 provides a deterministic process-local FIFO delivery runtime with retry,
backoff, idempotency, timeout, cancellation, audit history, and a single Webhook
adapter. Delivery state never mutates Alerts or canonical intelligence. See
[ATLAS Notification Runtime](docs/ATLAS-NOTIFICATION-RUNTIME.md).

## Intelligence API governance

ADR-0004 defines the versioned Intelligence API boundary. Existing unversioned
`/api/*` routes remain internal application APIs. v1.8 publishes a read-only
`/api/v1` contract. Public representations must preserve canonical IDs,
provenance, attribution, freshness, and degraded-state metadata.

See [ATLAS Intelligence API v1](docs/ATLAS-INTELLIGENCE-API-V1.md) and the
[OpenAPI contract](docs/openapi/atlas-intelligence-api-v1.yaml).

The v1.5 Watchlists & Intelligence Monitoring milestone is implemented within
these boundaries; multi-user persistence and external delivery remain future work.

## Watchlists & Intelligence Monitoring

`/app/watchlists` monitors verified Search index documents against local targets
such as countries, providers, categories, risk levels, entities, locations, or
deterministic queries. Alerts remain local and have `NEW`, `READ`, and `DISMISSED`
states. No account, AI, canonical data creation, or external notification delivery
is included. See [`docs/ATLAS-WATCHLISTS.md`](docs/ATLAS-WATCHLISTS.md).

## Alert Center

`/app/alerts` provides a deterministic lifecycle view over existing Timeline,
Breaking, Risk, Watchlist, and Report projections. Alerts preserve canonical
references and provenance without owning facts. External delivery, authentication,
multi-user storage, and AI are outside v1.6. See [`docs/ATLAS-ALERT-CENTER.md`](docs/ATLAS-ALERT-CENTER.md).
