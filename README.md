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

Architecture Freeze v1.0 is **proposed** for the production baseline through v1.4
at candidate commit `9ef729a`. It freezes canonical ownership, deterministic
module contracts, provenance, public routes/APIs, failure semantics, and the
non-canonical optional-AI boundary. ADR-0001 still requires explicit human
acceptance.

- [Architecture Freeze](docs/ATLAS-ARCHITECTURE-FREEZE-V1.md)
- [ADR-0001](docs/ADR-0001-ATLAS-ARCHITECTURE-FREEZE-V1.md)
- [Contract Inventory](docs/ATLAS-CONTRACT-INVENTORY.md)
- [Change Control](docs/ATLAS-CHANGE-CONTROL.md)

The next candidate milestone is v1.5 Watchlists & Intelligence Monitoring; it is
not implemented by this freeze.
