# ATLAS Architecture Freeze v1.0

Status: **ACTIVE**
Baseline: commit `9461e86`, tag `atlas-v1.5-watchlists`
Coverage: production architecture implemented through ATLAS v1.5

## Purpose

This freeze records the production architecture already implemented by ATLAS. It is
a governance boundary, not a redesign. Its purpose is to keep verified facts,
canonical identities, deterministic behavior, provenance, attribution, and public
integration contracts stable while later milestones are developed.

The freeze is authoritative for the current production baseline. Future changes
remain subject to the authority hierarchy and accepted ADR process.

## Decision hierarchy

When two authorities conflict, the higher authority wins:

1. Human-approved directive
2. Accepted Architecture Decision Record (ADR)
3. Architecture Freeze
4. Canonical contracts
5. Milestone specification
6. Existing implementation
7. Local implementation optimization

Implementation code must not silently redefine an architectural contract.

## Scope and current baseline

The baseline contains AI Technology Radar v0.8, Breaking News Center
v0.9, Global Operations Map v1.0, Global Risk & Alert Engine v1.1, Reports Center
v1.2, Intelligence Search & Explorer v1.3, Entity Knowledge Graph v1.4, and
Watchlists & Intelligence Monitoring v1.5.

The freeze covers:

- the verified-source boundary and configured provider registry;
- canonical event ownership, identity, categories, normalization, coordinates,
  source metadata, provenance, and attribution;
- Timeline, Breaking, AI Radar, Map, Risk, Reports, Search, and Entity Graph
  public contracts;
- public APIs, application routes, query-string navigation, cache state, degraded
  responses, deterministic ordering, tests, and releases;
- the boundary between canonical deterministic processing and optional future AI.

The detailed source-level inventory is in `ATLAS-CONTRACT-INVENTORY.md`.

## Frozen modules and contracts

### Verified source boundary

Only configured, attributable sources may create canonical inputs. Provider
fetching belongs to data-source/service modules, never presentation components.
Disabled, planned, unavailable, or configuration-required providers remain
explicitly unavailable. ATLAS must not manufacture replacement records when a
source fails.

Adding a provider is not prohibited forever, but requires the change-control
process, source/licensing review, deterministic normalization, provenance, failure
behavior, and tests. A provider that changes the trust boundary requires an ADR.

### Canonical ownership and normalization

`AtlasEvent` is owned by the Data Hub/event store. Downstream modules are
projections and may not become alternate sources of truth. Event IDs and
fingerprints are deterministic: an explicit source item ID is preferred; otherwise
the v1 identity uses source, category, normalized type/title, coordinates, and a
five-minute occurrence bucket. WGS84 coordinate ordering is longitude then
latitude. Missing coordinates are not inferred.

Canonical category and severity meanings are frozen as implemented. Projection
categories used by Breaking and later modules are mappings, not replacements for
the Data Hub category contract.

### Timeline

Timeline preserves canonical identity, timestamps, verified status, source URL,
attribution, source health, stale state, and optional event/report references.
Filtering, cursor behavior, stable ordering, and the 200/206/400/503 envelope are
compatibility contracts.

### Breaking News

Breaking is a deterministic cached projection over Timeline and AI Radar. Its
version, category set, priority set, priority rules, canonical identity,
provenance, stable ordering, provider health, partial/stale state, and response
envelope are frozen. It owns no provider and generates no headline or summary.

### AI Technology Radar

Radar technologies, releases, benchmark records, official links, capabilities,
deployment facts, provider states, provenance, and versioned snapshot envelope are
frozen public contracts. Registry content must remain explicit, attributable, and
non-generated.

### Global Operations Map

The map is a MapLibre visualization over verified Breaking records. Supported
layers, priority colors, deterministic marker sizing, coordinate validation,
filtering, clustering, and canonical navigation are frozen behavior. The map must
not fetch providers, infer locations, or introduce a second event contract. It has
no dedicated map API.

### Risk Engine

Risk levels are `CRITICAL`, `HIGH`, `ELEVATED`, `WATCH`, and `INFORMATIONAL`.
Versioned rule precedence, explanations, safe missing-field fallback, stable queue
ordering, canonical references, and rule metadata are frozen. Risk is
deterministic, non-predictive, and must not emit probabilities or recompute during
filtering.

### Reports

The eight report types, history presets, structured deterministic aggregation,
canonical references, stable ordering, risk reuse, attribution-preserving
Markdown/JSON/text exports, and complete/degraded/stale envelope are frozen.
Reports do not generate interpretation.

### Search

The Search document is an index projection, not canonical ownership. Canonical-ID
deduplication, content domains, fixed relevance precedence, stable tie-breaking,
filters, contextual facets, bounded suggestions, UTC time handling, URL
serialization, browser-local saved searches/history, degraded-module reporting,
and canonical navigation are frozen.

### Entity Knowledge Graph

The graph is a projection over Search. Node/edge contracts, evidence requirements,
stable entity ID normalization, collision suffix policy, explicit relationship
rules, risk aggregation from existing classifications, and traversal limits
(depth 2, 100 nodes, 200 edges) are frozen. Free-text extraction, similarity
merging, probabilistic resolution, and unsupported inferred relationships are
outside the contract.

### Provenance and attribution

Every canonical or projected record must preserve its available source identifier,
organization/name, official URL metadata, and attribution. Projections must retain
the evidence canonical ID and navigation target. Attribution must not be replaced,
hidden by fallback content, or silently dropped during export.

### API, URL, cache, and ordering contracts

Existing public paths and query parameters in the contract inventory are frozen.
Fields may not be removed, renamed, retyped, or semantically repurposed without an
accepted ADR and migration. Canonical URL state must remain reproducible.

Caches may reuse verified current or eligible stale data only. Stale, partial,
degraded, unavailable, and configuration-required states must remain explicit;
successful empty responses must not conceal upstream failure. Cache durations,
storage mechanisms, and implementation libraries are not frozen if observable
behavior is preserved.

All result ordering must use the documented deterministic comparator and stable
canonical-ID tie-breaker. Random or model-generated ranking is prohibited.

## Non-frozen implementation details

The following may change without an ADR when outputs and compatibility remain
unchanged:

- file layout, private function names, internal types, and module composition;
- styling, responsive breakpoints, accessible presentation, and SVG placement;
- cache implementation, in-memory data structures, batching, and concurrency;
- performance optimizations, dependency upgrades, and internal refactoring;
- additional tests, diagnostics, logging, and non-breaking optional fields.

These changes still require normal review and validation.

## Prohibited changes without an accepted ADR

- changing canonical IDs, category meaning, source trust, or data ownership;
- changing risk semantics, deterministic Search ranking, entity normalization,
  merge policy, relationship evidence, or graph safety bounds;
- removing or renaming frozen routes or breaking API response fields;
- replacing attribution or allowing AI-generated canonical facts;
- introducing probabilistic entity resolution or a new canonical data store.

## Compatibility, versioning, and deprecation

Version constants identify projection contracts. A breaking schema or semantic
change requires an accepted ADR, a new contract version, migration instructions,
compatibility tests, and rollback plan. Additive optional fields are permitted when
old consumers remain valid.

Deprecations must be documented before removal, retain the old contract for an
approved transition window, identify affected routes/fields/clients, and provide a
tested migration and rollback path. Silent deprecation is prohibited.

## Testing and release requirements

Every production release must pass the repository's actual typecheck, lint, full
test suite, production build, and `git diff --check`. Contract changes require
fixed deterministic fixtures and compatibility tests. Provider-dependent behavior
must test unavailable/degraded states and must not depend on fabricated fixtures in
production. Releases must identify the approved milestone/ADR and canonical
contract versions affected.

## Optional AI boundary

LLMs may later assist with explanation, natural-language interaction, or
non-canonical presentation. They must not create canonical facts, replace verified
providers, alter attribution, invent relationships, silently change risk or Search
ranking, or write canonical data without deterministic verification. A future AI
Copilot must consume existing verified services and expose citations or canonical
references.

Allowing AI-generated canonical data requires an accepted ADR and changes the
trust boundary.

## Known limitations

Several configured domains remain disabled, planned, or integration-pending.
In-memory caches and browser-local saved state are not multi-user persistence.
Search and graph coverage is limited to explicit fields exposed by current
canonical modules. Graph traversal is bounded. The dashboard route is `/app`;
there is no `/app/dashboard` route. The map has no dedicated API.

## Future milestone boundary

The v1.5 Watchlists & Intelligence Monitoring milestone is now implemented within
this boundary as a local deterministic preference projection. It does not change
the frozen canonical contracts. Multi-user persistence and external notification
delivery remain future extensions.

Watchlists reference existing canonical entities, searches, categories,
providers, locations, or risk levels. They must not create facts, recompute risk,
alter graph relationships, or change filter/query contracts. The current local
store is process-local and explicitly non-canonical. Multi-user persistence or external notification delivery
requires a future ADR when it introduces a new trust, identity, delivery, or
storage boundary.

## Human approval statement

This freeze is ACTIVE for the `9461e86` baseline. ADR-0002 is separately
ACCEPTED and defines the Alert Domain boundary. ADR-0003 is separately ACCEPTED
and defines the Notification Delivery boundary. ADR-0004 is ACCEPTED and governs
the v1.8 read-only public Intelligence API boundary. Authentication, mutation,
and partner API extensions remain future work.
