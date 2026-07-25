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
