# ATLAS Intelligence API v1

The v1 Intelligence API is the first **PUBLIC-STABLE**, read-only compatibility
layer over existing verified ATLAS application services. Existing unversioned
`/api/*` routes remain INTERNAL and the web application is not migrated.

## Base path and resources

Base path: `/api/v1`. Implemented resources are status, sources, events and event
detail, timeline, breaking, radar, map, risk, reports, search, entities, entity
relationships, and bounded graph. Watchlists, Alerts, Notifications, delivery,
administrative, and mutation operations are excluded. A report-by-ID route is
omitted because the current Reports service exposes deterministic report
generation by filters, not a stable detail lookup service.

## Envelope

Successful responses use `{data, meta}`. `meta` contains `apiVersion`, `requestId`,
`generatedAt`, `freshness`, `degraded`, and collection pagination when applicable.
Errors use `{error}` with `code`, `message`, `requestId`, HTTP `status`,
`retryable`, and optional details. Request IDs are propagated from a validated
`X-Request-Id` header or generated in the `v1_<unique>` format and returned in
the response header.

## Pagination, filtering, and sorting

Collection services retain their existing filter and sort contracts. Page-based
services use one-based `page`, bounded `pageSize` (default 25, maximum 100),
deterministic ordering, and service-provided totals. Timeline and Events retain
their existing cursor semantics. Unknown or invalid parameters return the v1
error envelope; arbitrary expressions and internal field paths are unsupported.

## Provenance and security

Representations preserve canonical IDs, provider/source attribution, source links
where available, observed/published timestamps, canonical navigation, freshness,
and degraded or stale metadata. v1 does not create facts or change service
ordering, risk, search, graph, alert, or notification behavior.

Authentication, authorization, API keys, quotas, rate limiting, abuse controls,
and partner access are future boundaries; this release exposes read-only verified
projections only.

## OpenAPI

The machine-readable contract is
`docs/openapi/atlas-intelligence-api-v1.yaml`. It documents only routes
implemented in this milestone and uses illustrative examples rather than live
intelligence.
