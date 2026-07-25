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
