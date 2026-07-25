# ADR-0001: ATLAS Architecture Freeze v1.0

- Status: **PROPOSED**
- Date: 2026-07-26
- Candidate baseline: `9ef729a`
- Candidate tag: `atlas-v1.4-entity-knowledge-graph`
- Decision owners: ATLAS human maintainers

## Context

ATLAS has accumulated production modules through v1.4. Their source-first,
deterministic contracts now form dependencies for future work. Without a formal
authority hierarchy and change process, local implementation changes could
silently alter canonical identities, risk semantics, ranking, evidence, routes, or
attribution.

## Proposed decision

Adopt `ATLAS-ARCHITECTURE-FREEZE-V1.md`,
`ATLAS-CONTRACT-INVENTORY.md`, and `ATLAS-CHANGE-CONTROL.md` as the formal
architecture baseline through v1.4.

The authority order is:

1. Human-approved directive
2. Accepted ADR
3. Architecture Freeze
4. Canonical contracts
5. Milestone specification
6. Existing implementation
7. Local implementation optimization

Breaking architectural changes require an accepted ADR. Deterministic,
source-first canonical ownership, provenance, attribution, compatibility, explicit
degradation, and the optional non-canonical AI boundary become governance rules.

## Consequences

Future milestones can extend ATLAS without redefining established semantics.
Architecture-changing work has additional review, migration, compatibility,
testing, and rollback obligations. Internal refactors and accessible presentation
improvements remain possible when public behavior is preserved.

The candidate v1.5 Watchlists milestone must reference existing canonical objects
and may not create facts or alter classifications/relationships. New multi-user
identity/storage or notification trust boundaries require a future ADR.

## Alternatives considered

- Rely on implementation alone: rejected because code does not express authority,
  compatibility, deprecation, or approval policy.
- Freeze every implementation detail: rejected because it would prevent safe
  maintenance and performance work.
- Permit model-generated canonical enrichment: rejected because it conflicts with
  the verified-source boundary.

## Approval

No repository mechanism records prior human acceptance of this ADR. A human
maintainer must explicitly approve it and change `Status` to `ACCEPTED`. This
documentation milestone does not grant that approval.
