# ATLAS Knowledge Graph Roadmap

**Audit date:** 2026-07-22  
**Decision:** Introduce a knowledge graph, but only after typed facts, stable identifiers, provenance and temporal revisions exist. The graph is a relationship and claim layer—not the raw ingestion store and not a substitute for time-series/geospatial databases.

## Why ATLAS needs a graph

ATLAS sources describe the same real-world entities from different perspectives:

- a USGS earthquake may trigger tsunami messages and GDACS episodes;
- a CVE record receives NVD enrichment, CISA KEV exploitation status and CERT/vendor notes;
- a cyclone has advisories, forecast tracks, affected regions, warnings and later best-track corrections;
- a company announcement relates to organizations, models, products, research and vulnerabilities;
- a market or energy shock relates to assets, regions, releases, disasters and policies.

Flat event rows cannot preserve these relationships without duplication or opaque metadata. A graph enables entity resolution, evidence-linked relationships, impact chains, cross-domain search and explainable reports.

## Readiness assessment

Current readiness: **Low (2/10)**.

Available foundations:

- source-scoped IDs, fingerprints, timestamps, coordinates and source URLs;
- explicit attribution and raw references;
- early category/severity vocabulary.

Missing prerequisites:

- canonical entity IDs and alias history;
- organization/service/dataset/endpoint hierarchy;
- claims with source/evidence/valid-time/transaction-time;
- event revision/supersession model;
- geometry and administrative-area entities;
- relationship vocabulary and directionality;
- confidence and conflict representation;
- ontology governance/versioning;
- rights-aware graph access.

## Architectural principle

Use polyglot persistence:

- **Object storage:** immutable raw payloads and large assets.
- **Relational/event store:** canonical events, revisions, source runs, contracts and transactional state.
- **Time-series/columnar store:** observations, bars, measurements, forecasts and metric values.
- **Geospatial store:** points, areas, tracks, rasters and spatial indexes (often relational PostGIS plus object storage).
- **Knowledge graph:** entities, claims and relationships with temporal/provenance edges.
- **Search index:** lexical retrieval/filtering.
- **Vector index:** permitted semantic retrieval over ATLAS-authored/rights-approved text; derived and rebuildable.

No single database should be forced to do all six jobs.

## Minimal graph model

### Nodes

- Organization, Agency, Provider, Service, Dataset, Endpoint
- SourceRun, RawArtifact, License/Contract, AttributionRequirement
- Event, Alert, EventRevision, Publication, ObservationSeries, Forecast
- Place, AdministrativeArea, Facility, InfrastructureAsset
- Hazard, Volcano, Storm, Earthquake, FireCluster
- Vulnerability, Product, Vendor, Technology, Model
- Satellite, NearEarthObject, Aircraft, Vessel, Instrument, Station
- Country/Economy, MarketInstrument, Commodity, Currency
- MetricDefinition, MetricSnapshot, ModelVersion, Report
- Evidence/Claim (or relationship properties where supported)

### Relationships

- `OPERATES`, `OWNS`, `PUBLISHES`, `EXPOSES_ENDPOINT`, `GOVERNED_BY`
- `REPORTS`, `OBSERVED_BY`, `DERIVED_FROM`, `SUPPORTED_BY`, `CONTRADICTS`
- `SUPERSEDES`, `UPDATES`, `CANCELS`, `SAME_AS`, `POSSIBLY_SAME_AS`
- `LOCATED_IN`, `AFFECTS`, `FORECAST_TO_AFFECT`, `NEAR`
- `TRIGGERS`, `CORRELATED_WITH` (never causal unless evidence supports it)
- `AFFECTS_PRODUCT`, `EXPLOITED_AS`, `MITIGATED_BY`
- `INPUT_TO`, `COMPUTED_BY`, `EXPLAINED_BY`, `CITED_IN`

Every material relationship must include source/evidence, asserted time, valid interval, ingest time, confidence type, algorithm/human actor and rights label. Do not store naked “facts” without who asserted them.

## Temporal and provenance model

ATLAS requires bitemporal semantics:

- **valid time:** when the statement is true in the world/provider domain;
- **transaction time:** when ATLAS learned, changed or removed it.

Example: an earthquake magnitude initially reported 6.2 then revised to 6.0. Both claims remain, with the later claim superseding the earlier one. The graph must not rewrite history or imply that ATLAS knew 6.0 at the first timestamp.

Provenance should align with W3C PROV concepts where useful, without adopting a heavyweight ontology prematurely: Entity, Activity, Agent; generated-by, attributed-to, derived-from. GeoSPARQL concepts may guide geometry semantics even if the storage engine is a property graph.

## Entity resolution

Resolution order:

1. exact official identifier in the same namespace;
2. maintained crosswalk between authoritative identifiers;
3. deterministic normalized keys with time/context constraints;
4. probabilistic candidate link with confidence and explanation;
5. analyst confirmation for high-impact merges.

Never delete source identities after merging. Canonical entities link to source records. `SAME_AS` requires strong evidence; use `POSSIBLY_SAME_AS` otherwise. Geographic boundaries and organization/product names must be time-versioned.

## Event relationships

Yes, ATLAS should introduce them. Minimum relation object:

- relation ID/type/direction;
- subject/object IDs and their versions;
- asserted vs inferred status;
- evidence record IDs;
- valid/transaction time;
- confidence dimensions;
- inference rule/model version;
- reviewer status;
- rights/export classification.

Causal relationships must be rare and evidence-backed. Temporal proximity or model correlation is not causation.

## Knowledge graph roadmap

### Stage 0 — Identity and source graph

- Define organization → service → dataset → endpoint hierarchy.
- Create namespaces and canonical ID policy.
- Model licenses, contracts, allowed uses and attribution.
- Add source runs/raw artifacts and verified schemas.

Exit: every datum resolves to an immutable artifact and exact source contract.

### Stage 1 — Typed domain records

- Add EventRevision, Observation/Series, Forecast, Trajectory and Geometry.
- Introduce place/admin-area and organization entities.
- Preserve bitemporal history.

Exit: core semantics are queryable without `metadata`.

### Stage 2 — Relationship ledger

- Add evidence-bearing relationships and source-specific claims.
- Implement cyber CVE correlation and disaster alert/update relations as pilot domains.
- Add analyst merge/split workflow.

Exit: no high-impact automatic relationship is unexplainable.

### Stage 3 — Graph projection and query

- Project normalized relational records into a graph store or graph tables.
- Support bounded queries: incident dossier, entity neighborhood, source lineage, affected regions/products.
- Enforce rights at nodes/edges/query results.

Exit: graph answers are reproducible from canonical stores.

### Stage 4 — Cross-domain intelligence

- Add event clusters, impact chains and regional/domain relationships.
- Use transparent rules before learned link prediction.
- Validate false-link rates with analysts.

Exit: cross-domain links improve retrieval/reporting without unacceptable false association.

### Stage 5 — Graph-assisted AI

- Ground summaries and reports in evidence subgraphs.
- Return citations and conflict/uncertainty.
- Permit graph embeddings/link suggestions only as candidate evidence, never stored truth.

Exit: AI answers can show the complete evidence path and honor source rights.

## Vector search

Yes, but as a derived search index after rights review. Index:

- ATLAS-authored summaries and reports;
- public-domain/explicitly permitted factual text;
- titles, tags and factual metadata allowed by source terms.

Do not automatically embed full RSS articles, WHO/ESA/company content, FRED data descriptions or contract-restricted market/AIS data. Store embedding model/version, chunk provenance, source rights and deletion lineage. Vector similarity is not evidence and must not create `SAME_AS` or causal relationships without validation.

## AI memory

Do not implement opaque persistent “AI memory.” Implement governed stores:

- analyst notes with author, permissions and retention;
- report/evidence snapshots;
- user preferences and saved entities under privacy controls;
- model conversation state with expiration;
- explicit hypotheses separated from verified claims.

AI-generated assertions are proposals with model/version/prompt/evidence, not source facts. They require review or remain ephemeral.

## Technology selection criteria

Do not select a graph database until query workloads are measured. Start with relational adjacency/edge tables and Postgres/PostGIS if sufficient. Evaluate a property graph when multi-hop traversals and relationship analytics dominate. Evaluate RDF only if standards interoperability and ontology reasoning justify its operational complexity. Required regardless of engine:

- temporal edges;
- provenance and properties;
- bulk rebuild from canonical stores;
- tenant/rights filtering;
- schema/ontology versioning;
- export and deletion lineage;
- observability and backup/restore;
- predictable query limits to prevent graph explosions.

## Governance risks

- False entity merges can create defamatory or dangerous associations.
- “Related to” edges can be misread as causation.
- Sensitive conflict, vessel, aircraft, health and person/location links may enable surveillance or harm.
- Derived embeddings may retain restricted text.
- Ontology changes can rewrite analytics.
- Automated graph expansion can amplify source bias.

Mitigations: evidence-first UI, relation labels, precision controls, rights enforcement, analyst review, immutable history, red-team testing and domain-specific retention.

## Success measures

- 100% of displayed claims trace to source artifact and terms record.
- Entity merge precision targets set per domain; high-impact merges require near-perfect precision.
- Graph rebuild is deterministic from canonical stores.
- Every inferred edge has rule/model version and confidence.
- Query results preserve valid/transaction time and conflicts.
- Restricted sources never leak through graph, vector or AI layers.
