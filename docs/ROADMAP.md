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

- [ ] Architecture Freeze v1.0 — **PROPOSED** for baseline commit `9ef729a`
  through v1.4. ADR-0001 requires explicit human acceptance before this item may
  be marked complete.

## Next candidate milestone

- [ ] v1.5 Watchlists & Intelligence Monitoring — candidate only; no implementation
  is included in the architecture freeze. Watchlists must reference existing
  canonical contracts and must not create facts, recompute risk, or alter graph
  relationships.
