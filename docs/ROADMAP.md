# Production milestones

- [x] Global Operations Map — verified-coordinate MapLibre rendering, independent layers,
  deterministic symbols, clustering, canonical navigation, and responsive accessible fallbacks.
- [x] Global Risk & Alert Engine v1.1 — versioned deterministic classification, canonical alert
  queue, operational matrix, risk APIs, stale/degraded behavior, and map focus integration.
- [x] Reports Center v1.2 — eight deterministic report types, history and filters,
  attribution-preserving exports, report APIs, and degraded cache behavior.
- [x] Intelligence Search & Explorer v1.3 — canonical index projection, fixed-rule ranking,
  contextual facets, deterministic suggestions, shareable URLs, and browser-local saved history.
- [x] Entity Knowledge Graph v1.4 — deterministic entity projection, evidence-backed
  edges, bounded traversal, accessible explorer, canonical provenance, and degraded state.

## Architecture governance

- [x] Architecture Freeze v1.0 — **ACTIVE** for the implemented baseline through
  v1.5.

- [x] v1.5 Watchlists & Intelligence Monitoring — local deterministic watchlist
  preferences, Search-index matching, internal alert lifecycle, and responsive UI.
- [x] v1.6 Alert Center — accepted Alert Domain projection, deterministic lifecycle,
  source aggregation, filtering, distributions, canonical navigation, and audit view.
- [x] v1.7 Notification Runtime — deterministic FIFO delivery queue, webhook
  adapter, retries, backoff, idempotency, timeout, cancellation, and DLQ state.

- [x] ADR-0002 Alert Domain Boundary — **ACCEPTED** boundary for unified alert
  projections between canonical intelligence and delivery.
- [x] ADR-0003 Notification Delivery Boundary — **ACCEPTED** architecture for
  queues, adapters, retries, and external notification channels.
- [x] ADR-0004 Intelligence API Boundary — **ACCEPTED** versioned `/api/v1`
  compatibility boundary.
- [x] v1.8 Intelligence API — read-only PUBLIC-STABLE adapters, standard
  envelopes, request IDs, pagination metadata, provenance, and OpenAPI contract.

## Next candidate milestone

- [ ] Future monitoring extensions — multi-user persistence and external
  notification delivery require accepted delivery architecture and are not
  implemented.
