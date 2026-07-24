# ATLAS Deterministic Event Graph v1

## Architecture

The event graph is a read-only projection over the verified ATLAS timeline. It does not fetch
providers, alter canonical records, or create a second event store. `aggregateTimeline()` supplies
verified USGS, NOAA, NASA, and ESA records plus source health; `generateGraph()` converts that input
to a sorted, duplicate-free snapshot; the graph API and event graph page consume the snapshot.

`graphVersion` is `atlas-event-graph-v1`. `generatedAt` is the latest official `updatedAt` or
`occurredAt` in the input, not wall-clock generation time. Identical inputs therefore produce
byte-equivalent nodes, edges, IDs, ordering, version, and generation timestamp.

## Node types

| Type | Creation rule |
| --- | --- |
| `event` | Verified non-advisory timeline record with an exact canonical event ID |
| `report` | Verified NASA or ESA report with an exact report ID |
| `advisory` | Verified NOAA advisory with an exact canonical event ID |
| `location` | A verified record has a non-empty source-supplied location |
| `source` | A verified record has an allowed official `sourceId` |

Location IDs use the exact location text, countries, and exact coordinates when supplied. ATLAS
does not reverse geocode or normalize a location into a guessed region.

## Edge types and rules

| Edge | Rule IDs | Meaning |
| --- | --- | --- |
| `reports_on` | `related-event-id-exact-v1`, `exact-provider-identifier-v1` | An explicit `relatedEventId`, or an existing exact provider identifier, equals the event canonical ID |
| `originates_from` | `source-ownership-event-v1` | Event/advisory `sourceId` exactly equals provider canonical ID |
| `located_in` | `verified-location-exact-v1` | A verified source location exists; coordinates are preserved exactly when present |
| `published_by` | `source-ownership-report-v1` | Report `sourceId` exactly equals provider canonical ID |
| `updates` | `official-update-timestamp-v1` | Revisions share one exact event ID and are ordered by official `updatedAt` |
| `references` | `related-report-id-exact-v1` | An explicit `relatedReportId` equals a report canonical ID |
| `related_exact` | `shared-provider-identifier-v1` | Reports share an existing exact provider identifier |

Every edge contains its rule ID, a plain-language reason, the official creation timestamp,
field-level provenance, and `deterministic: true`.

## Deterministic guarantees

- Graph IDs are SHA-256-derived from exact canonical values and rule inputs.
- Nodes and edges are de-duplicated by deterministic ID and sorted lexicographically.
- Event history uses exact canonical IDs and official timestamps with ID tie-breaking.
- Only `verificationStatus: "verified"` records enter the graph.
- Only event groups marked `exact` enter the graph. `strong`, `probable`, title-window, title
  overlap, location similarity, and other heuristic groupings are ignored.
- No title comparison, embeddings, semantic similarity, LLM inference, probability, or reverse
  geocoding is performed.
- Separate canonical event IDs are never merged.

## API

`GET /api/graph` returns the global snapshot. Filters are comma-separated:

- `nodeType`: `event`, `report`, `advisory`, `location`, `source`
- `edgeType`: any documented edge type
- `source`: `usgs-earthquakes`, `noaa-nhc`, `nasa-rss`, `esa-rss`
- `category`: a canonical ATLAS event category

`GET /api/graph/:id` returns the connected component for a graph node ID or canonical ID. Both
responses contain `nodes`, `edges`, `graphVersion`, `generatedAt`, `partial`, and `sourceHealth`.
Unknown parameters or filter values return `400`; unknown IDs return `404`. A partial upstream
outage returns the verified available graph with HTTP `206` and `partial: true`.

`/app/graph/:id` renders the connected component as a responsive, library-independent view:
a compact graph card layout on desktop and a stacked relationship view on mobile. It is
informational and has no editing surface.

## Provenance

Edge provenance records the provider ID/name, official source record ID and URL, exact field used
by the rule, and the exact value. Node metadata preserves sorted source metadata. Provider and
location nodes remain source-scoped so similarly named places or providers cannot be silently
combined.

## Known limitations

- The graph reflects the current bounded timeline aggregation rather than a persistent historical
  graph database.
- Update chains exist only when multiple official revisions are present in the input.
- Most NASA/ESA reports are standalone because providers do not usually publish an ATLAS event ID.
- Location strings are intentionally not reconciled across providers.
- A partial source outage cannot expose nodes absent from the available verified input.

## Future expansion

Future versions may add persistent snapshots, pagination, additional exact provider identifier
schemas, and richer visualization. Any new rule must remain source-verifiable, deterministic,
documented, reproducible, and covered by fixtures. AI-generated or probabilistic relationships
remain outside this architecture.
