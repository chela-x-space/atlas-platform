# ATLAS Data Platform Scalability Review

**Audit date:** 2026-07-22  
**Scope:** Capacity and maintainability for 100, 500 and 1,000 external sources; data models, storage, ingestion, governance, search, AI and operations.

## Executive decision

The present architecture is suitable for a small prototype, not a 100–1,000-source global intelligence platform. `DATA_SOURCES` is a compile-time list, connectors are bespoke, `AtlasEvent` is overloaded, and source health is request-centric rather than governed as a data product. Scaling is possible, but only by turning ingestion into a platform with typed contracts, queues, durable raw storage, multiple data stores, provenance and legal enforcement.

## Capacity assessment

| Scale | Current architecture | After minimum refactor | Organizational requirement | Verdict |
|---|---|---|---|---|
| 10–25 sources | Manageable but increasingly bespoke | Straightforward | Small platform team + domain reviewers | Current near-term ceiling |
| 100 sources | Registry/type unions, polling and metadata become brittle; outages/rates collide | Feasible with connector SDK, queues, typed models, schema registry, immutable landing and SLOs | Dedicated data platform, legal ops and domain ownership | Achievable |
| 500 sources | Manual onboarding/terms/schema review cannot scale; backfills and revisions dominate | Difficult but feasible with self-service control plane, automated contracts/quality, regional workers and entitlement enforcement | Multiple domain teams + central platform/on-call/governance | Multi-year platform |
| 1,000 sources | Unsafe/unmaintainable | Technically feasible only with strong automation, data-product governance and strict admission/retirement | Platform organization, procurement/legal operations, 24×7 reliability | Do not target before 100/500 maturity |

Source count is a poor capacity metric alone. One global aircraft feed can exceed the volume of hundreds of daily macro/RSS sources. Plan by events/observations per second, payload bytes, geometry/raster size, retention, query concurrency, backfill volume, and legal partitions.

## Current bottlenecks

- Compile-time source registry and category unions require code deployment for governance changes.
- One event shape for incidents, news and attempted observations.
- No source contract/version/terms model.
- No durable immutable raw landing or replay contract.
- No typed observation, time-series, forecast, trajectory or raster storage.
- Polling is not centrally scheduled with quotas, leases and backpressure.
- No schema registry/compatibility gates or automated drift detection.
- No per-source SLO, budget, ownership, kill switch or maintenance calendar.
- No point-in-time revision model needed for analytics/backtests.
- No rights-aware query/export/AI layer.
- No capacity isolation: one large/slow source can impair others.

## Target architecture

### Control plane

Maintain governed, queryable objects:

- organization/provider/service/dataset/endpoint;
- source owner and domain owner;
- status, priority, criticality and dependencies;
- schedule, timeout, retries, rate/credit budget and concurrency;
- auth strategy/secret reference and rotation date;
- schema versions and compatibility;
- geographic/temporal coverage and expected latency;
- data quality rules and SLOs;
- terms/license/contract and allowed-use matrix;
- retention, cache, export and AI policies;
- incident state, kill switch and last verification.

Configuration changes should be reviewed/audited and compiled into worker schedules; secrets remain in a secret manager, never in registry records.

### Data plane

1. Scheduler emits bounded source-run jobs.
2. Connector obtains lease and distributed rate budget.
3. Raw response streams to immutable object storage with headers/hash/timing.
4. Parser validates against provider schema/contract.
5. Normalizer emits typed records and provenance.
6. Dedup/reconciliation creates revisions and relationships.
7. Domain stores persist canonical data.
8. Derived indexes/metrics/search update asynchronously.
9. Source-run, quality, cost, lag and rights telemetry are recorded.

Use at-least-once delivery with idempotent writes. Exactly-once claims are unrealistic across external HTTP and internal failure boundaries.

## Connector SDK

Every connector should implement the same lifecycle:

- discover/check prerequisites;
- build requests and partition backfills;
- authenticate and rotate/refresh tokens;
- enforce rate/credit budget;
- fetch with conditional requests/compression;
- record raw artifact and response metadata;
- parse/validate with size limits;
- normalize typed records;
- checkpoint cursor/watermark;
- classify transient/permanent/legal/schema errors;
- reconcile updates/deletions;
- emit health/quality/coverage metrics;
- support replay from raw artifacts without refetching.

RSS, REST JSON, file/CSV, CAP/XML, SDMX, Socrata, WMS/WFS and streaming connectors can share transport templates but retain product-specific parsers.

## Storage decisions

### Raw object storage — required

Immutable compressed payloads, headers, request fingerprint, source run, content hash, schema and encryption. Retention is license-driven. Enables replay/audit and prevents repeated provider calls.

### Relational transactional store — required

Source registry, contracts, runs, canonical events, revisions, alerts, entities, claims, relationships, metric definitions and workflow state. Postgres is a reasonable initial choice; partition large tables and isolate workloads.

### Time-series/columnar storage — required

Weather/climate, market, energy, buoy, air-quality, space-weather and metric values must not be stored as events. Start with partitioned relational/columnar storage based on volume; use a specialized engine only after workload evidence. Required features: compression, downsampling, late/revised data, point-in-time queries and unit/quality metadata.

### Geospatial storage — required

PostGIS-class indexing for points/polygons/tracks; object storage/tile pipeline for rasters and large geometry assets. Preserve CRS, geometry validity, simplification lineage and forecast validity.

### Knowledge graph — later, required for intelligence

Relationship projection over canonical stores. See graph roadmap. It does not replace raw/time-series/geospatial storage.

### Search and vector indexes — derived

Lexical/faceted search is required before vector search. Vector search is useful for semantic retrieval over rights-approved text and ATLAS summaries. Both must be rebuildable, versioned and deletion-aware.

## `AtlasEvent` scalability

`AtlasEvent` remains useful for user-visible discrete happenings but cannot remain the universal schema.

Natural fits: earthquake occurrence, cyclone advisory lifecycle, tsunami alert, vulnerability publication/KEV addition, outbreak report, official news publication, marine/aviation warning.

Poor fits: weather grids, FIRMS detections, market bars, macro series, satellite elements, aircraft/vessel positions, buoy readings, climate normals, forecasts, rasters and metric values.

Required extensions around—not inside—`AtlasEvent`:

- first-class multi-geometry/area and asset references;
- validity interval and lifecycle state;
- revision/supersession/cancellation;
- jurisdiction/authority and language;
- entities/participants/affected areas;
- claim-level provenance/conflicts;
- quality/confidence dimensions;
- license/allowed-use lineage;
- relationship edges.

Do not turn all of these into unindexed `metadata` keys.

## Throughput classes

| Class | Examples | Pattern | Isolation |
|---|---|---|---|
| Low-volume editorial | company RSS, GVP, WHO DON | periodic poll, text sanitization, rights constraints | shared RSS workers |
| Low-volume critical alerts | tsunami, NHC, CISA KEV | frequent poll, lifecycle/revisions, low latency | priority queue and independent circuit breaker |
| Medium tabular | NVD, macro, EIA, NCEI | incremental cursor/backfill, large pages | batch workers and backfill pool |
| High-volume observations | FIRMS, weather grids, air quality, SWPC | partitioned ingestion, time-series compression | dedicated domain queues |
| Very high-volume trajectories | OpenSky, AIS | streaming/high-frequency, geospatial/time-window retention | dedicated licensed infrastructure and regional partitions |
| Large assets | rasters, GeoTIFF, shapefiles | object store, tiling, async processing | asset pipeline and CDN rights controls |

## Reliability and maintenance

Per-source SLOs:

- fetch success and valid-content success;
- ingestion lag vs provider publication time;
- freshness and stale duration;
- schema validity/drift;
- expected item/coverage bounds;
- duplicate/revision/tombstone rates;
- quota consumption and cost;
- legal verification age;
- attribution and restricted-export test status.

No public provider without a paid SLA should receive an invented uptime percentage. ATLAS should measure observed availability and report provider/no-provider-SLA separately.

Maintenance mechanisms:

- golden fixtures and live contract probes;
- canary runs before parser rollout;
- schema compatibility CI;
- automatic circuit breakers and kill switches;
- provider-change subscriptions and annual terms review;
- backfill/replay tooling;
- runbooks, owner and escalation route;
- source retirement/deprecation workflow;
- cost and quota forecasts.

## Multi-region design

Do not start multi-region solely for scale. Begin with durable queues/object storage and clear recovery objectives. Add regional fetch egress only when provider geography/latency/rates or data residency require it. Prevent duplicate global polls through leases; partition high-volume data spatially or by provider-defined shard. Terms may restrict data residency and cross-border processing.

## Knowledge, search and AI

- Knowledge graph: introduce after canonical identities and provenance.
- Vector search: yes, derived and rights-aware; never source of truth.
- AI memory: replace with governed analyst/evidence/user state and retention.
- Event relationships: required for deduplication and intelligence.
- Source provenance: mandatory at claim/field level for conflicts and composites.
- Confidence: mandatory, decomposed into data/model dimensions.
- AI summaries: asynchronous, cited and rebuildable; must not block ingestion.

## Security and abuse

- Secret manager, short-lived credentials where possible, per-source least privilege.
- SSRF-resistant allow-listed endpoint resolution and response-size limits.
- XML entity expansion disabled; sanitize RSS HTML.
- Malware scanning for archives/documents; decompression-bomb limits.
- Supply-chain review for parser libraries.
- Tenant/contract-aware authorization for restricted datasets.
- Audit logs for data export and AI use.
- Location/sensitive-domain aggregation and abuse controls.
- Provider key leakage detection and immediate source kill switch.

## Cost model

Track cost per source and data product:

- provider subscription/exchange fees;
- request/credit consumption;
- network egress and object storage;
- parse/normalize compute;
- time-series/geospatial/index storage;
- backfill/replay cost;
- vector embedding and LLM cost;
- engineering/on-call/legal maintenance.

A “free” feed with unstable schemas and high maintenance may cost more than a contracted source.

## Roadmap to scale

### 0–25 sources

Build source contracts, immutable raw landing, queues, typed observation/series and revision/provenance. Harden active sources.

### 25–100 sources

Release connector SDK/templates, schema registry, automated quality/terms checks, rights-aware export and domain ownership. Add geospatial asset pipeline.

### 100–500 sources

Introduce self-service onboarding with approval gates, regional/dedicated worker pools, multi-tenant quota manager, graph projection, data catalog, lineage UI and formal on-call rotations.

### 500–1,000 sources

Only proceed with measured demand. Add automated discovery/change detection, provider contract operations, large-scale backfill orchestration, capacity isolation, source scoring/retirement and platform SRE. Enforce a source budget: new sources replace or justify their long-term operational cost.

## Production gates

Before calling ATLAS scalable:

1. replay from raw storage is demonstrated;
2. source outage/schema drift does not corrupt canonical data;
3. point-in-time history and tombstones work;
4. restricted data cannot leak through UI/API/widgets/search/AI;
5. one high-volume source cannot starve critical alerts;
6. backfills do not compete with live ingestion;
7. source SLOs and on-call ownership are visible;
8. recovery objectives are tested;
9. capacity/cost forecasts cover 10× load;
10. source onboarding and retirement are auditable.
