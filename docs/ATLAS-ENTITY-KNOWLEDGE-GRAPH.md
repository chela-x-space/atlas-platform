# ATLAS v1.4 Entity Knowledge Graph

## Scope and boundary

The Entity Knowledge Graph is a deterministic projection over the v1.3 canonical
search index. It is a navigation layer, not a source of truth. It makes no provider
requests, does not mutate records, and uses no LLM, embeddings, heuristic
free-text extraction, name-similarity merging, or probabilistic entity resolution.

## Node model

Canonical search documents remain record nodes (`EVENT`, `REPORT`, or
`AI_RADAR_ENTRY`). Structured fields may project entity nodes for country, region,
provider/source organization, category, and explicitly structured AI technology.
Risk, map, and official-source nodes exist only when their canonical fields exist.
Missing fields produce no node.

Entity IDs use `entity:<type>:<normalized-value>`. Values are NFKC-normalized,
lowercased with the `en-US` locale, trimmed, and have punctuation runs replaced by
hyphens. If two distinct labels normalize to one value, both IDs receive a stable
hash suffix; they are never silently merged.

## Edge evidence

Edges are directed, stable, and contain the evidence canonical ID, canonical path,
provider attribution, generation time, derivation flag, and one of:

- `EXPLICIT_CANONICAL_FIELD`
- `EXPLICIT_REFERENCE`
- `SYSTEM_PROJECTION`

Implemented relationships are `OCCURRED_IN`, `PROVIDED_BY`,
`RELATED_TO_CATEGORY`, `HAS_RISK_ALERT`, `HAS_OFFICIAL_SOURCE`, `MAPS_TO`, and
`TRACKED_BY_RADAR`. Co-occurrence and report/entity relationships are not emitted
without an explicit canonical reference.

Entity risk is the highest existing classification among directly connected
records in the canonical Risk scale. The graph does not recompute or predict risk.

## Query and cache behavior

Entity filters and facets are contextual to the filtered entity set. Sorting uses
canonical IDs as final tie-breakers. Traversal supports depth 1 or 2 and is bounded
to 100 nodes and 200 edges. The cache is keyed by graph version and search-index
generation, returns verified stale data only when available, and exposes refresh
failure as degraded state. Missing modules remain listed; no replacement data is
synthesized.

## UI and accessibility

`/app/entities` provides URL-backed filters, deterministic sorting, facets, and
bounded pagination. `/app/entities/[entityId]` provides a stable SVG relationship
view plus a semantic relationship table fallback. Controls are keyboard
accessible, focus is visible, reduced motion is honored, and mobile layouts avoid
horizontal page overflow.

## APIs

- `GET /api/entities`
- `GET /api/entities/{entityId}`
- `GET /api/entities/{entityId}/relationships`
- `GET /api/graph?view=entities&root={nodeId}&depth=1`
- `GET /api/graph/status`

The legacy event graph remains the default `/api/graph` response. Entity traversal
is explicitly selected with `view=entities`.

## Known limitations

Only explicit structured fields in currently indexed modules are projected.
Free-text names are intentionally ignored. Depth is deliberately bounded, and
report relationships are omitted until canonical report records carry explicit
record/entity references.
