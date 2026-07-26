# ATLAS Architecture

ATLAS is a global intelligence product built around verified evidence, deterministic processing, and attributable outputs. Existing application behavior and public API contracts remain compatibility boundaries.

## Platform flow

```text
Trusted Sources
      ↓
Source Registry
      ↓
Collectors
      ↓
Verified Evidence
      ↓
Canonical Intelligence
      ↓
Deterministic Priority
      ↓
Timeline and Search
      ↓
Entity Intelligence
      ↓
Risk and Reports
      ↓
Intelligence API
      ↓
Dashboard

Marketplace ── future digital-product domain, kept separate from intelligence
```

## High-level domains

### Sources and registry

The Global Source Registry is the canonical control plane for external intelligence providers. It governs provider identity, trust, coverage, languages, capabilities, rights, attribution, collection policy, credentials by reference, and operational health.

Provider governance is distinct from collection:

```text
Registered → Review → Approved → Active
                         ↓         ↓
                    Suspended ← Health
                         ↓
                      Retired
```

Registration does not mean approval. Approval does not mean a collector exists. Activation requires passed legal, schema, quality, operational, and security reviews plus valid collection, rights, refresh, rate-limit, timeout, and attribution configuration.

Registry health records distinguish successful data, a valid empty response, provider failure, authentication failure, rate limiting, and schema failure. Registry status never fabricates ingestion success.

### Collection and evidence

Collectors retrieve provider data under defined authentication, rate, refresh, and failure policies. Original evidence and provenance are preserved before information is normalized.

### Evidence media

The Evidence Media Platform is the canonical media layer. Intelligence records retain stable media references rather than raw display URLs; the media registry owns provenance, rights, validation, audit history, and deterministic selection.

```text
Intelligence record → Media reference → Media registry → Rights filter → Deterministic selection → Product view
```

Only verified, reachable, rights-eligible media may reach a safe display projection. Official provider media, satellite imagery, maps, and logos precede licensed or open-licensed media and evidence visualizations. Missing eligible media produces no selection, preserving the current product fallback.

### Canonical intelligence

Canonical records provide stable identity and shared meaning across ATLAS. Downstream domains may project, rank, connect, or present these records but do not become competing sources of truth.

### Priority and risk

Priority and risk are deterministic, versioned interpretations of verified evidence. They expose their basis and never rely on opaque AI-generated scores.

### Timeline, search, and entities

Timeline organizes intelligence by time. Search provides deterministic discovery. Entity Intelligence connects people, organizations, places, products, technologies, hazards, vulnerabilities, and assets through evidence-backed relationships.

### Reports and API

Reports assemble attributable intelligence without replacing its sources. The Intelligence API exposes governed, versioned representations while preserving canonical identifiers, provenance, freshness, and degraded states.

### Product surfaces

The Dashboard presents the most important verified global events. Map, Timeline, Search, Reports, Risk, and Entity Graph remain specialized views over shared intelligence.

Marketplace is a separate future catalog for digital products. Marketplace content is not automatically trusted intelligence and cannot enter canonical data without the normal provider-governance process.

## Boundaries

- Providers do not write directly to product views.
- Registry state governs providers but does not create intelligence events.
- Intelligence records do not own media-selection rules or raw media delivery.
- Evidence media without explicit provenance and rights remains unavailable.
- Credentials remain external secrets referenced indirectly and are never returned by registry APIs.
- Restricted and internal-only providers are excluded from public projections.
- Product views do not create canonical facts.
- AI may assist analysts only through evidence-grounded, non-canonical outputs.
- User, organization, and Marketplace data remain separate from canonical intelligence.
- Public API changes require explicit authorization and compatibility planning.

See [Standards](STANDARDS.md), [Decisions](DECISIONS.md), and [Roadmap](ROADMAP.md).
