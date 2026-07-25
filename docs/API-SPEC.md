# Breaking News APIs

- `GET /api/breaking?category=&priority=&country=&provider=&limit=`
- `GET /api/breaking/latest?category=&priority=&country=&provider=&limit=`
- `GET /api/breaking/providers`

## Global Operations Map

No map-specific API is introduced. `/app/map` consumes `GET /api/breaking?limit=200`; its canonical
IDs, deterministic priorities, provider health, verified flag, and confirmed coordinates are
sufficient for the visualization. Open tiles are presentation infrastructure, not an ATLAS data
provider.

## Global Risk APIs

- `GET /api/risk?level=&category=&provider=&from=&to=&activity=&coordinates=&search=&limit=`
- `GET /api/risk/alerts` — the same filtered canonical alert contract
- `GET /api/risk/summary`
- `GET /api/risk/rules`

Complete responses use 200; degraded or stale-backed responses use 206 and
`X-Atlas-Data-State`; unavailable canonical inputs use 503. Filters never recompute a
classification. Rules expose only IDs, versions, input fields, resulting levels, precedence, and
fixed explanation templates.

## Reports APIs

- `GET /api/reports?type=&history=&category=&provider=&risk=&region=&search=`
- `GET /api/reports/types`
- `GET /api/reports/summary` with report filters
- `GET /api/reports/export?format=markdown|json|text` with report filters

Reports return 200 when complete, 206 when canonical inputs are degraded/stale, 400 for invalid
filters, and 503 when no current or eligible stale canonical data exists. Exports preserve provider
attribution.

## Intelligence Search APIs

- `GET /api/search?q=&category=&subcategory=&provider=&country=&region=&risk=&timeRange=&from=&to=&contentType=&hasCoordinates=&hasOfficialSource=&sort=&page=&pageSize=`
- `GET /api/search/facets` with the same filters; counts are contextual
- `GET /api/search/suggestions?q=&limit=`
- `GET /api/search/status`

Complete indexes return 200, partial verified indexes return 206 with named warnings, invalid
queries return 400, and unavailable indexes return 503. Results preserve canonical navigation and
provenance. Search never returns generated replacement records.

Breaking filters are deterministic and validated. `category` and `priority` allow comma-separated
values; `limit` is bounded to 1–200. Responses use 200 for complete data, 206 for partial provider
coverage, 400 for invalid input, and safe 503 responses when no snapshot can be produced.

## Entity Knowledge Graph APIs

- `GET /api/entities` — contextual entity list/facets; accepts `q`, `entityType`,
  `nodeType`, `category`, `country`, `region`, `provider`, `risk`,
  `relationshipType`, `page`, `pageSize`, and deterministic `sort`.
- `GET /api/entities/{entityId}` — entity, connected nodes, incoming/outgoing
  evidence, canonical references, provenance, and degraded status.
- `GET /api/entities/{entityId}/relationships` — accepts `relationshipType` and
  `direction=incoming|outgoing`.
- `GET /api/graph?view=entities&root={nodeId}&depth=1|2` — bounded graph projection.
  Without `view=entities`, the existing event-graph contract is unchanged.
- `GET /api/graph/status` — counts, included node/edge types, generation state,
  degraded modules, and warnings.

Successful partial responses use HTTP 206. Missing entities use 404; unavailable
canonical data uses 503. No endpoint synthesizes replacement nodes or edges.

## Watchlists & Intelligence Monitoring APIs

- `GET|POST /api/watchlists` — list the local watchlist projection or create a
  watchlist with `name` and a supported `{type,value}` target.
- `GET|PATCH|DELETE /api/watchlists/{watchlistId}` — detail, rename/enable/disable,
  or remove a local watchlist.
- `GET /api/watchlists/{watchlistId}/matches` — current deterministic canonical
  matches for one watchlist.
- `GET|PATCH /api/watchlists/alerts` — alert queue or status transition using
  `NEW`, `READ`, or `DISMISSED`.
- `GET /api/watchlists/summary` — local counts and latest match time.
- `GET /api/watchlists/status` — local storage and canonical index readiness.

Watchlists consume the Search projection and preserve canonical document links and
provenance. They are process-local preferences (`storage: process-local`), not a
canonical data store, user account system, or notification service. Invalid target
types/statuses return 400; missing watchlists return 404; unavailable canonical
index data returns 503.

## Alert Center APIs

- `GET /api/alerts` — deterministic alert list with `status`, `severity`, `source`,
  `category`, `risk`, `from`, `to`, `search`, `sort`, `page`, and `pageSize`.
- `GET /api/alerts/{alertId}` — alert metadata, canonical reference, provenance,
  and lifecycle audit.
- `PATCH /api/alerts/{alertId}` — deterministic lifecycle transition.
- `GET /api/alerts/summary` — status, severity, source distributions and latest
  activity.
- `GET /api/alerts/status` — Alert Domain readiness, source modules, and degraded
  warnings.
- `GET /api/alerts/sources` — source distribution and source warnings.

Alert responses are projections and do not contain duplicated canonical payloads.
Complete responses use 200, usable degraded responses use 206, invalid filters or
transitions use 400, missing alerts use 404, and unavailable source projections use
503. Delivery endpoints are not implemented.
