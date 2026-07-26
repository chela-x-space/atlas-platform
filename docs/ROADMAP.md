# ATLAS Roadmap

This roadmap communicates direction, not implementation authorization. Every milestone requires separate scope, review, and approval. Existing architecture and public APIs remain frozen unless explicitly authorized.

## Current — v1.x Foundation

Completed:

- Verified intelligence ingestion and canonical events
- Situation-driven Dashboard
- Timeline and event detail
- Search
- Entity Graph
- Deterministic Risk
- Reports
- Global Map
- Alerts, watchlists, and notification runtime
- Read-only Intelligence API v1
- Marketplace navigation and Coming Soon placeholder

## Current — v2 Platform Foundation

### v2.0 Source Registry — Completed

The canonical provider control plane now governs identity, trust, licensing, coverage, collection policy, activation gates, lifecycle, version history, credential references, and explicit health outcomes.

### v2.1 Evidence Media Platform — Completed

The canonical media layer now provides typed provenance and rights, provider matching, URL and content validation, versioned storage, article references, safe projections, and deterministic selection without fabricated media.

### v2.2 Provider Runtime — Completed

The canonical execution-control layer now governs registry eligibility, collector bindings, schedules, claims, bounded concurrency, persisted rate limits, explicit retry and timeout policies, isolated execution results, observational health, and append-only audit events.

### v2.2.1 `/app` Internationalization Foundation — Completed

The locale-neutral `/app` dashboard now supports English and Thai interface presentation with a browser-local preference, deterministic English fallback, locale-aware formatting, and unchanged canonical source content. Translation of dynamic source titles and excerpts remains future work.

## Next — Planning only

### v2.3 Evidence Pipeline

Define how isolated collector execution results become validated, deduplicated, attributable evidence without allowing collectors to write directly to canonical intelligence.

The completed v2.0–v2.2 milestones do not change the frozen public Intelligence API.

### v2.4 Priority Engine

Classify verified events as Critical, High Impact, Regional, or Monitoring using deterministic evidence such as severity, official confirmation, independent sources, impact, geographic scope, and freshness.

### v2.5 Entity Intelligence

Expand evidence-backed identity, aliases, timelines, and relationships across people, organizations, places, companies, products, technologies, diseases, hazards, vulnerabilities, and financial assets.

### v2.6 Marketplace Architecture

Define the catalog, digital product, asset, version, provenance, and license boundaries for a future digital-only Marketplace. Commerce is not included.

## Future — v3 Product Platform

### v3 Identity Platform

Plan authentication, organizations, teams, roles, permissions, durable preferences, watchlists, notifications, and API credentials.

### v3 Evidence-Grounded AI Workspace

Plan cited research, summarization, translation, report drafting, notebooks, analyst workflows, controlled agents, and human review. AI outputs remain non-canonical.

### v3 Developer Platform

Plan governed API documentation, SDKs, webhooks, streaming, integrations, CLI access, and third-party applications.

## Recommended order

1. Source governance
2. Provider collection and evidence
3. Deterministic priority
4. Entity expansion
5. Identity and authorization
6. Marketplace catalog architecture
7. Evidence-grounded AI
8. Developer ecosystem

Trust, provenance, rights, and compatibility are release gates for every stage.
