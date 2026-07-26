# ATLAS Architecture

ATLAS is a global intelligence product built around verified evidence, deterministic processing, and attributable outputs. Existing application behavior and public API contracts remain compatibility boundaries.

## Platform flow

```text
Trusted Sources
      ↓
Source Registry
      ↓
Provider Runtime
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

### Provider runtime

The Provider Runtime is the canonical execution-control layer. It resolves every provider through the Source Registry before an enabled, code-controlled collector binding may be scheduled, claimed, rate-limited, executed, timed out, or considered for retry.

```text
Source Registry → Runtime eligibility → Schedule → Claim → Collector → Isolated execution result
```

Scheduling is an explicit manual, interval, cron, or disabled policy with a named timezone. Bounded concurrency, persisted rate limits, explicit retry/backoff, timeouts, claim recovery, observational health, and append-only audit events are runtime responsibilities. A bounded tick replaces a permanent worker.

Collector results stop at the runtime boundary in v2.2. They do not write to canonical intelligence, Evidence Media, Dashboard, or public APIs. The governed Evidence Pipeline remains future work.

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

The `/app` presentation shell supports English and Thai through browser-local locale state. English is the deterministic server and missing-key fallback; a valid saved preference takes precedence over device language. Localization changes interface labels and formatting only. Canonical titles, excerpts, provider identities, identifiers, URLs, timestamps, and provenance remain language-preserving.

## Boundaries

- Providers do not write directly to product views.
- Registry state governs providers but does not create intelligence events.
- Provider Runtime cannot approve or activate providers and cannot bypass Source Registry governance.
- Runtime execution results are isolated until a future Evidence Pipeline validates and promotes evidence.
- Intelligence records do not own media-selection rules or raw media delivery.
- Evidence media without explicit provenance and rights remains unavailable.
- Credentials remain external secrets referenced indirectly and are never returned by registry APIs.
- Restricted and internal-only providers are excluded from public projections.
- Product views do not create canonical facts.
- Presentation localization does not mutate canonical intelligence or provenance.
- AI may assist analysts only through evidence-grounded, non-canonical outputs.
- User, organization, and Marketplace data remain separate from canonical intelligence.
- Public API changes require explicit authorization and compatibility planning.

See [Standards](STANDARDS.md), [Decisions](DECISIONS.md), and [Roadmap](ROADMAP.md).
