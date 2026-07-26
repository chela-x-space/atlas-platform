# ATLAS Decision Log

This chronological log records product and architecture decisions. Future entries should be concise, append-only, and explicitly approved. It replaces separate architecture decision documents.

## DECISION-001 — ATLAS is a Global Intelligence Platform

**Status:** Accepted

ATLAS organizes verified global intelligence. It is not positioned as a generic news website, advertising surface, framework, or AI-generated fact source.

## DECISION-002 — Evidence First

**Status:** Accepted

Canonical intelligence must originate from identifiable evidence and preserve provenance, attribution, and source links.

## DECISION-003 — Deterministic canonical processing

**Status:** Accepted

Canonical identity, normalization, ordering, risk, priority, and evidence-backed relationships use deterministic rules. AI does not create canonical facts.

## DECISION-004 — Canonical intelligence has one owner

**Status:** Accepted

Product modules are projections over shared canonical intelligence. Timeline, Search, Map, Risk, Reports, Entity Graph, Dashboard, and API do not become independent sources of truth.

## DECISION-005 — Explicit degraded states

**Status:** Accepted

Empty, partial, stale, degraded, and unavailable states remain distinguishable. Provider failure is never hidden by fabricated or substitute data.

## DECISION-006 — Public Intelligence API is read-only and versioned

**Status:** Accepted

The existing `/api/v1/*` surface is a compatibility layer over verified services. It preserves canonical identity, provenance, freshness, deterministic ordering, and explicit failure states.

## DECISION-007 — Homepage is situation driven

**Status:** Accepted

The Dashboard answers “What are the most important events happening in the world right now?” The dedicated Map remains available without dominating the homepage.

## DECISION-008 — Marketplace is navigation only

**Status:** Accepted

Marketplace currently provides a Coming Soon destination. It has no homepage promotion, commerce, checkout, payment, order, wallet, creator, or delivery functionality.

## DECISION-009 — Marketplace remains separate from intelligence

**Status:** Accepted

Marketplace products do not become canonical intelligence without passing the normal provider and evidence governance process.

## DECISION-010 — Future milestones require authorization

**Status:** Accepted

Roadmap entries communicate direction only. New identity, provider, storage, delivery, commerce, AI, or public API boundaries require explicit approval before implementation.

## DECISION-011 — Global Source Registry is the provider control plane

**Status:** Accepted

The Global Source Registry is the canonical control plane for all external intelligence providers. Registration, approval, activation, collector connection, health, and public-display eligibility remain explicit and independently governed. Provider configuration is versioned and auditable; credentials remain external secrets.

## DECISION-012 — Evidence Media Platform is the canonical media layer

**Status:** Accepted

All evidence media is governed through centralized provenance, rights, validation, versioning, references, and deterministic selection. Intelligence records and product views do not independently choose raw media URLs. AI-generated media cannot replace official evidence.

## DECISION-013 — Provider Runtime is the canonical execution-control layer

**Status:** Accepted

The Source Registry remains the authority for provider identity, trust, governance, activation, configuration, and capabilities. The Provider Runtime may execute only active, eligible providers through enabled bindings to code-controlled collectors.

The runtime owns deterministic scheduling, claims, bounded concurrency, provider-level rate limits, explicit retry and backoff, timeouts, append-only execution audit, and health observations derived solely from recorded outcomes. Collectors return isolated execution results and cannot write to canonical intelligence, Evidence Media, Dashboard, or public APIs.

The runtime does not approve providers, infer vendor limits, create provider-specific business logic, run an unbounded worker, or use AI for canonical decisions. The public `/api/v1/*` and OpenAPI contracts remain frozen. Promotion of collector results through an Evidence Pipeline is future work.

See [Vision](VISION.md), [Architecture](ARCHITECTURE.md), and [Standards](STANDARDS.md).
