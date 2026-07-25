# Breaking News Center

The Breaking News Center is a cached deterministic projection over Global Timeline and AI
Technology Radar inputs. It owns no provider fetcher and no generated text. The pure breaking logic
maps canonical records into priority-tagged events, applies one captured time boundary, removes
canonical duplicates, and normalizes provider health. See `ATLAS-BREAKING-NEWS.md`.

# Global Operations Map

The map is a client visualization over the cached Breaking News projection. It owns no providers,
canonical records, priority rules, or inferred coordinates. One verified collection is filtered
locally and supplied to MapLibre as clustered GeoJSON. Canonical IDs connect Event Detail,
Timeline, Graph, and Source Center. See `ATLAS-GLOBAL-MAP.md`.

# Global Risk & Alert Engine

Risk is a cached deterministic projection over the existing Global Timeline aggregation. The
shared engine owns versioned rule evaluation, stable sorting, filters, summaries, and safe public
rule metadata; it owns no provider fetchers and changes no canonical event. The UI and four risk
endpoints share that service. Map integration validates canonical identity and coordinates through
the risk API before focusing an event. See `ATLAS-RISK-ENGINE.md`.

# Reports Center

Reports are a cached deterministic projection over the shared Risk service. The engine performs
filtering, stable sorting, structured aggregation, and attribution-preserving serialization. It
owns no providers, classification rules, or narrative generator. See `ATLAS-REPORTS.md`.

# Intelligence Search & Explorer

Search is a cached index projection that merges existing module records by canonical ID. Module
membership adds searchable domains and navigation targets rather than duplicate documents. Pure
modules own normalization, fixed-rule ranking, filtering, contextual facets, suggestions, URL
serialization, and browser-local saved/history state. The service uses existing cached Risk,
Breaking, Radar, and Reports projections and explicitly reports partial module failure. See
`ATLAS-SEARCH-EXPLORER.md`.

# Entity Knowledge Graph

The v1.4 graph service consumes the Search index projection and emits deterministic
nodes and evidence-bearing directed edges. Canonical services remain authoritative.
Entity normalization is stable and collision-aware; graph caching exposes partial
or stale operation explicitly. `/api/graph` retains its legacy behavior unless
`view=entities` is requested. Traversal is limited to depth two, 100 nodes, and 200
edges. See `ATLAS-ENTITY-KNOWLEDGE-GRAPH.md`.

# Architecture governance

ATLAS Architecture Freeze v1.0 is proposed over candidate commit `9ef729a` and
the implemented baseline through v1.4. The proposal does not change runtime
architecture or behavior.

Architectural authority is ordered as: human-approved directive, accepted ADR,
Architecture Freeze, canonical contracts, milestone specification, existing
implementation, then local optimization. Breaking changes require an accepted
ADR, compatibility and migration analysis, deterministic tests, and rollback.

Governance documents:

- `ATLAS-ARCHITECTURE-FREEZE-V1.md`
- `ADR-0001-ATLAS-ARCHITECTURE-FREEZE-V1.md` (status: `PROPOSED`)
- `ATLAS-CONTRACT-INVENTORY.md`
- `ATLAS-CHANGE-CONTROL.md`

The v1.5 Watchlists & Intelligence Monitoring milestone is implemented within
the documented boundaries below. Future multi-user and delivery extensions remain
outside this freeze.

# Watchlists & Intelligence Monitoring

v1.5 is a local deterministic projection over the v1.3 Search index. Watchlist
definitions and alert statuses are user preferences; canonical Search documents,
provenance, risk values, entity IDs, and graph relationships remain authoritative
and unchanged. Matching uses exact normalized structured fields or all-token
containment for a search query. The implementation has no authentication, cloud
sync, external notification delivery, AI, fuzzy matching, or historical replay.
See `ATLAS-WATCHLISTS.md`.
