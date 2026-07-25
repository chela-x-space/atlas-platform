# ADR-0002: Alert Domain Boundary

- Status: **PROPOSED**
- Scope: architecture only
- Approval: explicit human approval required
- Baseline: ATLAS Architecture Freeze v1.0, active at commit `9461e86`

## Context

ATLAS has several deterministic subsystems that can produce information requiring
attention: Timeline, Breaking News, AI Radar, Map, Risk, Reports, Search, Entity
Graph, and Watchlists. They currently retain their own source or projection
contracts. A future unified alert capability needs a boundary that does not turn
alerts into a second canonical data store or couple canonical intelligence to
notification vendors.

## Decision

Define an Alert Domain as a projection boundary between canonical intelligence and
notification delivery:

```text
Canonical Intelligence
        ↓
Risk / Watchlist Match / Other Producer
        ↓
Alert Domain
        ↓
Delivery Layer
        ↓
Email · Telegram · Discord · Webhook · Push
```

The Alert Domain may create, lifecycle, search, filter, expire, retain, archive,
and audit alert projections. It references canonical objects and producer evidence
but owns no canonical facts. It never modifies, replaces, or causes canonical data
to expire. The Delivery Layer is outside this domain and is not approved by this
ADR.

This ADR defines architecture only. It authorizes no implementation, producer,
API, route, storage change, notification channel, or behavior change.

## Alert Domain definitions

### Alert

An Alert is a non-canonical projection representing that a producer has identified
a condition or canonical reference requiring attention. It contains a stable alert
identity, source/provenance, references, severity/priority, visibility, lifecycle,
timestamps, expiration policy, and metadata. An Alert must be reconstructable from
its producer evidence and must not contain an invented fact.

### Alert Source

An Alert Source is the approved producer projection that requests an Alert. Initial
source adapters may be Timeline, Breaking, Risk, Watchlists, or Reports. Future
modules may be added only through normal architecture change control. A source
identifies its producer type, producer record ID, canonical evidence IDs, and
matching/classification reason. A source does not transfer canonical ownership.

### Alert Target

An Alert Target is the user or delivery-facing scope to which an alert is visible.
The target may be a local user preference, an approved tenant/user identity in a
future system, or a delivery endpoint owned by the outside Delivery Layer. Target
identity and authorization are not defined by this ADR; no anonymous or multi-user
delivery is implied.

### Alert Severity

Severity describes the urgency represented by the producer's existing deterministic
classification. It must reuse an approved source scale (for example, Risk levels)
or use an explicitly versioned Alert scale. The Alert Domain may not invent a
probability, impact estimate, casualty count, forecast, or severity from missing
canonical fields.

### Alert Priority

Priority is the deterministic ordering or handling precedence assigned by an
approved rule. It is distinct from severity and must document its source and
version. Priority cannot silently replace Breaking priority or Risk level.

### Alert Lifecycle

Lifecycle is the state transition history of an alert:

```text
CREATED → NEW → ACKNOWLEDGED → READ → DISMISSED → ARCHIVED
```

Transitions must be explicit, auditable, monotonic unless a future ADR defines a
reopen operation, and must not mutate the referenced canonical object. A producer
may create an alert directly in a documented initial state, but it may not skip
required audit evidence.

### Alert Status

Status is the current lifecycle state visible to consumers. `CREATED`, `NEW`,
`ACKNOWLEDGED`, `READ`, `DISMISSED`, and `ARCHIVED` are architectural states, not
an implementation API. A future implementation must define actor, timestamp, and
reason for every transition.

### Alert Metadata

Metadata is non-canonical operational context such as producer version, rule
version, matching reason, visibility, delivery eligibility, expiration policy,
deduplication key, and display hints. Metadata must be clearly separated from
canonical facts and preserve its own provenance where it is derived.

### Alert Provenance

Provenance identifies the producer, producer record, canonical evidence IDs and
paths, source provider attribution, creation/evaluation time, and any deterministic
rule version. Provenance is mandatory for an alert. It must remain available after
read, dismissal, expiration, or archive.

### Alert References

References are typed links to canonical events, reports, risk alerts, watchlists,
entities, sources, or other approved records. References contain canonical IDs and
navigation targets where available. Alerts do not copy canonical records as an
alternate source of truth; missing references are omitted rather than fabricated.

### Alert Visibility

Visibility determines which approved target may view an alert: local/private,
explicit user scope, future tenant scope, or delivery-pending scope. Visibility
must default to least privilege. It does not grant authentication or delivery
authorization, which belong to future identity and Delivery Layer decisions.

### Alert Deduplication

Deduplication groups repeated projections of the same producer condition. A future
implementation must use a deterministic, versioned key including producer/source,
canonical reference, alert kind/rule, target scope, and relevant occurrence or
validity boundary. Deduplication must not merge distinct canonical events merely
because titles or text are similar. Replaced rules require an explicit version and
migration behavior.

### Alert Expiration

Expiration is a deterministic validity boundary on the alert projection. It may
hide or transition an alert according to its policy but must never expire, delete,
or alter the referenced canonical intelligence. Expiration requires a reason,
timestamp, policy version, and preserved provenance.

### Alert Retention

Retention defines how long alert projections and audit transitions are kept. It is
separate from canonical data retention and must account for legal, operational,
and user-audit requirements. A retention policy must be explicit, versioned, and
reversible only through an approved migration; no implementation policy is chosen
by this ADR.

### Alert Archive

Archive is a durable or logically separated terminal view of alerts that are no
longer active. Archived alerts remain searchable and auditable according to the
retention policy, preserve references and provenance, and do not imply deletion of
canonical records.

### Alert Searchability

Alerts may be searched by alert ID, producer/source, status, severity, priority,
target scope, canonical reference, category, timestamps, and explicit metadata.
Search is over alert projections and references; it does not change canonical
Search ranking or create new canonical Search documents.

### Alert Filtering

Filtering may constrain source, status, severity, priority, visibility, target,
time range, expiration, archive state, and canonical reference. Filters must be
deterministic, validated, and non-mutating. Filtering must not recompute Risk,
change Watchlist matching, or alter producer output.

### Alert Auditability

Every creation, status transition, dismissal, expiration, archive operation, and
delivery handoff must be attributable to a producer, actor/system, timestamp,
reason, and rule/policy version. Delivery attempt history belongs to the Delivery
Layer but may be referenced by the Alert Domain.

## Producer boundary

The following are approved architectural source categories, not implemented
producers under this ADR:

- Timeline: references verified timeline records and their source health.
- Breaking: references existing Breaking events and priority output.
- Risk: references existing Risk classifications and rule evidence.
- Watchlists: references deterministic watchlist matches and local target scope.
- Reports: references report IDs and explicit canonical references.
- Future modules: require a documented source contract and change-control review.

Each producer remains authoritative for its own canonical or projection contract.
The Alert Domain consumes producer output and cannot change it.

## Delivery boundary

Email, Telegram, Discord, Slack, webhooks, push, and any future delivery channel
are outside the Alert Domain. A Delivery Layer may consume eligible alert
projections, but it must not write canonical facts or silently change alert status.
Delivery retries, credentials, rate limits, endpoint identity, and consent require
separate architecture decisions.

## Non-goals and prohibitions

This ADR does not authorize APIs, routes, React components, alert producers,
storage, notification delivery, authentication, multi-user scope, AI, fuzzy or
probabilistic matching, canonical schema changes, risk changes, Search ranking
changes, graph changes, Watchlist changes, or Report/Timeline/Breaking changes.

Alerts must never own facts, replace canonical records, modify canonical records,
invent severity, fabricate provenance, or cause canonical data to expire.

## Compatibility and change control

Any implementation must preserve Architecture Freeze v1.0 and existing canonical
contracts. A future Alert Domain implementation requires an accepted ADR or an
explicitly approved follow-up design for storage, APIs, lifecycle transitions,
producer adapters, retention, identity, and Delivery Layer integration. Changes to
canonical IDs, risk semantics, Search ranking, graph evidence, source trust, or
Watchlist matching remain subject to their existing ADR requirements.

## Approval

ADR-0002 is **PROPOSED**. Human approval is required before implementation or any
behavioral change based on this boundary. No production behavior is authorized by
this document.
