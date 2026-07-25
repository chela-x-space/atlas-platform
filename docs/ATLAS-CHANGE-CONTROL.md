# ATLAS Architecture Change Control

Status: proposed with Architecture Freeze v1.0.

## Authority and approval

The authority order is human-approved directive, accepted ADR, Architecture
Freeze, canonical contracts, milestone specification, existing implementation,
then local optimization. A proposal or code change cannot approve its own ADR.
Architecture-changing work requires explicit human acceptance before merge.

## Breaking and non-breaking changes

A change is breaking when an existing consumer, canonical identity, interpretation,
trust decision, deterministic result, route, query, response field, ordering, or
evidence link can change incompatibly. Semantic changes are breaking even if the
TypeScript shape is unchanged.

A change is normally non-breaking when it preserves identities, meanings, output
semantics, deterministic ordering, provenance, routes, required fields, failure
states, and existing consumers.

## Changes requiring an accepted ADR

An accepted ADR is required before:

- changing canonical IDs or fingerprints;
- changing canonical category meaning;
- changing the verified-source trust boundary or source-first attribution;
- introducing a new canonical data store or ownership boundary;
- changing risk levels, classification semantics, rule precedence, or fallback;
- changing deterministic Search relevance/ranking rules or stable tie-breakers;
- changing entity normalization, collision handling, or merge policy;
- changing graph relationship evidence rules;
- increasing graph traversal beyond depth 2, 100 nodes, or 200 edges;
- removing or renaming frozen routes or URL parameters;
- removing, renaming, retyping, or semantically repurposing API fields;
- allowing AI-generated canonical data or probabilistic entity resolution;
- permitting AI to silently alter risk, ranking, attribution, or relationships;
- adding a new data domain that changes canonical schema, trust, ownership, or
  classification boundaries;
- adding multi-user persistence, identity, or external delivery when it establishes
  a new security, privacy, storage, or notification trust boundary.

Provider additions require an ADR when they alter the trust boundary, canonical
schema, identity rules, licensing posture, or data domain. A provider within an
already approved boundary still requires documented source/licensing review,
normalization, attribution, failure behavior, fixtures, and human review.

## Changes normally not requiring an ADR

Subject to repository review and compatibility validation:

- accessible styling and focus fixes;
- responsive layout improvements;
- copy and documentation corrections;
- additional deterministic tests;
- non-breaking internal refactoring;
- performance improvements that preserve observable outputs;
- implementation/library replacements behind the same contract;
- additive optional response fields that preserve compatibility;
- bug fixes that restore documented behavior.

This list does not override a higher-authority directive or an existing ADR.

## Contract-specific control

### Canonical schema

Schema additions must distinguish optional projection metadata from canonical
facts. Required-field changes, changed meanings, ownership moves, or identity
effects require an ADR, version increment, migration, compatibility tests, and
rollback.

### APIs and URLs

Frozen routes, query parameters, status semantics, response fields, and canonical
navigation may not be silently changed. Additive optional fields must be
documented and tested. Route/field replacement requires parallel compatibility or
an approved versioned endpoint and deprecation plan.

### Risk, Search, and Graph

Risk model changes require fixed fixtures demonstrating precedence and safe
fallback. Search ranking changes require an explainable comparator specification
and before/after compatibility analysis. Graph identity/evidence changes require
collision, deduplication, attribution, and traversal-bound analysis. Each requires
an accepted ADR.

### Optional AI

Non-canonical AI explanation or natural-language assistance may be proposed if it
consumes verified services and displays citations/canonical references. Any write
to canonical data, provider replacement, hidden classification/ranking change, or
invented relationship requires an ADR and is prohibited by Freeze v1 absent such
approval.

## Deprecation and migration

Every deprecation must:

1. identify the exact route, field, identifier, or semantic behavior;
2. link to an accepted ADR when architecture-breaking;
3. publish a compatibility window and replacement;
4. preserve attribution and canonical-reference mapping;
5. include automated compatibility and migration tests;
6. document consumer/data migration and operational rollout;
7. define success criteria and removal date;
8. retain a tested rollback until removal is approved.

Silent removal or behavior drift is prohibited.

## Rollback requirements

Architecture-affecting releases must define the last compatible version, reversible
deployment steps, data/schema rollback constraints, cache invalidation behavior,
and how canonical IDs/references remain resolvable. Rollback must never replace
verified data with generated content or erase required provenance.

## Validation and release gate

Changes must pass typecheck, lint, the complete deterministic test suite,
production build, and `git diff --check`. Contract changes also require targeted
fixtures, API/URL compatibility tests, degraded/failure tests, documentation,
versioning assessment, and human approval evidence.

## ADR lifecycle

ADRs begin `PROPOSED`. Human decision owners may mark them `ACCEPTED`, `REJECTED`,
or `SUPERSEDED`; supersession must link both decisions. Implementation must not
precede acceptance when a change is ADR-required.
