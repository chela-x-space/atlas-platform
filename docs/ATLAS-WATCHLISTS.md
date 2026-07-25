# ATLAS v1.5 Watchlists & Intelligence Monitoring

## Scope

Watchlists are local, single-user preferences over existing ATLAS Search index
documents. They do not create canonical facts, entities, providers, risk
classifications, graph relationships, or notification deliveries. No account,
authentication, cloud synchronization, or AI is used.

## Model

Each watchlist has a deterministic local ID, name, enabled flag, target type and
value, timestamps, last match time, and total match count. Supported targets are
`entity`, `country`, `organization`, `category`, `provider`, `risk-level`,
`search-query`, and `location`.

Definitions are preferences, not canonical records. The current server-side local
store is process-local and intentionally not a multi-user database; deployments
must treat it as ephemeral until a future persistence boundary is approved.

## Matching

Matching consumes the existing Search projection. Country, organization, provider,
category, risk, and location targets use exact normalized structured fields.
Entity targets use canonical ID/title fields already present in Search documents.
Search queries require every normalized query token to occur in the indexed
verified fields. Matching is case-normalized and deterministic; it never uses
fuzzy inference, embeddings, an LLM, or similarity resolution.

Alerts are deduplicated by watchlist ID, canonical ID, and occurred timestamp, and
are sorted by occurred time, watchlist ID, and canonical ID. Existing risk values,
search ranking, entity IDs, graph edges, and source attribution are reused without
recomputation or mutation.

## Alert lifecycle

An alert references the watchlist, canonical document, occurrence timestamp, and
matching reason. New matches start as `NEW`. Users may move them to `READ` or
`DISMISSED`; status is a local preference and does not alter canonical data.

## Routes and APIs

- `/app/watchlists`
- `GET|POST /api/watchlists`
- `GET|PATCH|DELETE /api/watchlists/{watchlistId}`
- `GET /api/watchlists/{watchlistId}/matches`
- `GET|PATCH /api/watchlists/alerts`
- `GET /api/watchlists/summary`
- `GET /api/watchlists/status`

Responses preserve canonical navigation and provenance through the embedded Search
document. Partial canonical-index results use the existing degraded conventions;
unavailable canonical services return an explicit error rather than fabricated
matches.

## Limitations and future boundary

There is no historical replay, notification delivery, authentication, multi-user
sharing, market monitoring, or external persistence. Email, SMS, Telegram,
Discord, Slack, and mobile push are explicitly out of scope. A future notification
or multi-user storage design requires an architectural review/ADR before it adds
identity, trust, delivery, or persistence boundaries.
