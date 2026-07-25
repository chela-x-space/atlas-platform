# ADR-0004: Intelligence API Boundary

- Status: **ACCEPTED**
- Scope: architecture and governance only
- Approval: human approval required
- Baseline inspected: `33aef22` (`atlas-v1.7-notification-runtime`)

## Context and decision

ATLAS currently exposes unversioned application APIs for canonical and projection
services. Those routes serve the web application and are **INTERNAL** by default;
their existence does not promise external compatibility. This ADR defines a
future compatibility boundary for consumers without publishing `/api/v1` routes.

```text
Consumers → Versioned Intelligence API → Application Services
          → Canonical Intelligence and Projection Services
```

The Intelligence API is a compatibility layer over existing verified services. It
does not create canonical facts, bypass service ownership, or turn internal API
shapes into public contracts. Application services remain responsible for
normalization, provenance, attribution, risk, search, graph, alert, and delivery
semantics.

## API definitions

- **Intelligence API:** the governed, versioned read and explicitly authorized
  mutation surface for ATLAS intelligence capabilities.
- **Internal API:** an unversioned application route used by ATLAS modules. All
  current `/api/*` routes are internal unless separately classified.
- **Public API:** a documented, versioned, compatibility-supported contract.
- **Partner API:** a separately authorized public contract with consumer-specific
  identity, quota, and support terms.
- **API version:** a compatibility namespace; the initial candidate is `/api/v1`.
  Major versions mark breaking boundaries.
- **API contract:** route, method, parameters, representation, status, ordering,
  errors, provenance, freshness, and compatibility behavior.
- **API resource / representation:** a named canonical or projection capability
  and its serialized view. A representation references canonical records rather
  than replacing them.
- **Canonical reference:** canonical ID, navigation/path where applicable,
  provider attribution, and record timestamp/freshness.
- **Projection resource:** a deterministic view such as Risk, Reports, Search,
  Graph, Alerts, or Notifications; it owns no canonical facts.
- **Capability:** an explicitly documented read or mutation operation.
- **Consumer / client identity:** a calling application and its future
  authenticated identity. Identity is not inferred from an API key alone.
- **API key, authentication, authorization:** future controls at the API boundary;
  none are selected or implemented here.

## Representation and envelope rules

Future public responses should use a documented response envelope containing the
resource data, request/correlation ID, generated/freshness metadata, degraded or
stale state, warnings, and provenance where relevant. Errors should use a standard
envelope containing `code`, human-readable `message`, HTTP `status`, request or
correlation ID, `retryable`, field details when applicable, and degraded context.
Existing internal response envelopes remain unchanged.

Canonical representations must preserve originating provider, attribution,
canonical identifier, timestamp/freshness, degraded state, and canonical links.
Compactness is not a reason to remove attribution.

## Classification

The classification vocabulary is:

- `INTERNAL` — current unversioned application APIs (the default).
- `PUBLIC-STABLE` — explicitly released and compatibility-supported.
- `PARTNER` — authorized partner contract with scoped access and quota.
- `ADMINISTRATIVE` — privileged operational or administrative capability.
- `EXPERIMENTAL` — explicitly unstable and not compatibility-supported.

No current route is automatically `PUBLIC-STABLE` by this ADR.

## Versioning and compatibility

The initial public namespace is `/api/v1`, but it is not implemented by this ADR.
Major versions represent compatibility boundaries. Breaking changes require a new
major version unless an accepted compatibility mechanism preserves all existing
client behavior. Backward-compatible optional fields, explicitly documented
filters, and additions within a resource family may remain in the same major
version. Version labels apply consistently to routes, documentation, and future
OpenAPI descriptions; internal implementation versions must not leak into public
resource identifiers.

Breaking changes include removing/renaming fields or resources, changing field
meaning or identifiers, pagination semantics, standard errors, provenance,
authentication/authorization, mutation capability, or deterministic ordering.
Non-breaking changes preserve existing meanings and may add optional fields,
documented filters, endpoints in the same family, tolerant enum values, or
performance improvements without output changes. A change is not non-breaking if
reasonable existing clients could fail.

## Candidate v1 resource families

These are candidates, not published contracts:

| Family | Boundary |
|---|---|
| sources, events, timeline, breaking, radar, map | read-only canonical or verified projections |
| risk, reports, search, entities, graph | deterministic projection resources |
| watchlists | local preference resource with controlled mutations |
| alerts | Alert Domain projection with controlled lifecycle mutations |
| notifications | operational delivery resource with controlled cancellation/test actions |
| status | service health and degraded-state metadata |

Each family requires explicit classification and contract review before becoming
public. Not every internal capability must be published.

## Pagination, filtering, and sorting

The v1 strategy is bounded page/offset pagination using `page` (one-based) and
`pageSize`, matching current Search, Risk, Reports, Entities, and Alerts
conventions. Page sizes must have a documented upper bound. Responses should
include total/totalPages where the service can calculate them. Stable ordering is
mandatory: deterministic primary sort plus canonical ID (or stable resource ID)
tie-breaker. Offset pagination can duplicate or omit records when the underlying
projection changes between requests; consumers should use generated/freshness
metadata and repeat the same filter/sort snapshot. A future cursor strategy
requires an ADR and compatibility analysis.

Filters must be explicitly supported and validated. Unknown filters must not
silently change results. Consumers cannot submit executable expressions or
arbitrary internal field paths. Search relevance remains governed by the frozen
Search ranking contract.

## Mutation, bulk, streaming, and webhooks

Public consumers must not directly mutate canonical intelligence. Watchlist
preference changes, Alert lifecycle transitions, and Notification operational
actions may be exposed only as explicitly documented capabilities. No generic
update endpoint is permitted. Bulk requests, streaming responses, and API
webhooks are separate future boundaries requiring contracts for limits,
ordering, retries, idempotency, authorization, and failure handling. A webhook
delivery is governed by ADR-0003 and is not a canonical event channel.

## Security and trust boundary

Future API keys identify a client credential, not a person or authorization grant.
Authentication establishes client identity; authorization determines permitted
resource, action, scope, and provenance visibility. Rate limits, quotas, abuse
controls, audit logs, key rotation, revocation, and correlation IDs belong at the
API boundary and must not be implemented by canonical services. This ADR selects
no identity provider and authorizes no credentials, keys, rate limiting, or auth.

## Cache, freshness, and degraded behavior

Public responses must expose generated/freshness metadata and degraded, partial,
or stale state when present. Existing services already use 200 for complete data,
206 for usable partial data, 400 for invalid input, 404 for missing resources, and
503 when no safe snapshot can be produced. A future public envelope may standardize
these semantics without changing internal behavior. Stale fallback may contain
only previously verified data; upstream failure must not become a fabricated empty
success.

## OpenAPI and change control

OpenAPI is the future machine-readable contract. It must match implemented
behavior, preserve canonical semantics, and use examples that do not present
fabricated claims as live intelligence. Public release validation must include
schema/contract tests, deterministic fixtures, provenance checks, degraded/error
checks, and compatibility review.

An accepted ADR is required before publishing a resource family, changing public
identifiers, pagination or error semantics, provenance requirements,
authentication/authorization, mutation capabilities, materially incompatible rate
limits, bypassing application services, or allowing AI-generated canonical
responses. A future AI Copilot must consume approved API/service contracts, retain
citations, and never read canonical stores directly or bypass authorization.

## Prohibitions and approval

This ADR originally created no `/api/v1` route; v1.8 now implements its approved
read-only boundary. It creates no authentication, API key,
rate limiter, gateway dependency, OpenAPI document, or behavior change. It does
not alter current routes, response envelopes, canonical contracts, Search ranking,
Graph identity, Risk classification, Alert lifecycle, or Notification Runtime.

Status is **ACCEPTED**. Future authentication, mutation, partner, or breaking
version changes still require explicit change-control review.
