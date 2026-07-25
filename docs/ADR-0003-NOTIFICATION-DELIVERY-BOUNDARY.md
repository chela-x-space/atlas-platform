# ADR-0003: Notification Delivery Boundary

- Status: **ACCEPTED**
- Scope: architecture only
- Approval: human approval required
- Depends on: ADR-0002 Alert Domain Boundary (**ACCEPTED**)

## Context

ATLAS now has an internal Alert Domain that projects attention-worthy conditions
from Timeline, Breaking, Risk, Watchlists, and Reports. External notification
channels are not canonical intelligence and must not become coupled to alert
ownership, lifecycle, or source attribution.

## Decision

Define notification delivery as a replaceable boundary outside the Alert Domain:

```text
Canonical Intelligence
        ↓
Alert Domain
        ↓
Notification Queue
        ↓
Delivery Adapter
        ↓
External Channel
```

The Alert Domain remains the single source of truth for alert projections and
their lifecycle. A delivery system may read eligible alerts and record delivery
metadata, but it may not own canonical facts, mutate canonical records, or
silently change alert status. This ADR defines architecture only and authorizes
no implementation.

## Delivery domain definitions

### Notification Queue

A durable, bounded handoff of delivery intents referencing an Alert ID and its
delivery target. Queue messages contain references and delivery metadata, not
canonical payload ownership. Queue identity, ordering key, visibility timeout,
and retention must be deterministic and versioned.

### Delivery Adapter

An isolated channel-specific component translating a queue intent into an
external-channel request. Adapters are replaceable, independently configured,
and unable to write canonical intelligence. Credentials and channel protocols
remain outside the Alert Domain.

### Delivery Target

An explicitly authorized destination identity, such as an email address,
webhook endpoint, device token, or chat destination. Target ownership,
consent, authentication, and secrecy belong to the delivery/identity boundary.

### Delivery Channel

The external transport selected for a target: Email, Telegram, Discord, Slack,
Webhook, Push Notification, SMS, or Microsoft Teams. A channel is not a source
of canonical facts and must preserve Alert references and attribution.

### Delivery Attempt

One bounded adapter execution for a queue message. It records attempt ID,
queue message ID, adapter/version, start and finish time, outcome, provider
response classification, and a non-secret diagnostic reference.

### Delivery Status

Operational state of a delivery intent or attempt, separate from Alert lifecycle:
`QUEUED`, `IN_PROGRESS`, `DELIVERED`, `RETRYING`, `FAILED`, `CANCELLED`, and
`DEAD_LETTERED`. Delivery status must never be treated as Alert `READ`,
`ACKNOWLEDGED`, or `DISMISSED` without a separate approved rule.

### Retry Policy and Backoff Strategy

A versioned deterministic policy defining retryable failures, maximum attempts,
and terminal handling. Backoff must be bounded and deterministic (for example,
an attempt-based schedule with jitter prohibited unless explicitly governed).
Retries must preserve the same idempotency key and Alert reference.

### Rate Limiting

An adapter or target constraint limiting requests over a defined interval. Limits
must fail safely, expose retry timing where available, and never drop an alert
without an auditable terminal outcome.

### Deduplication and Idempotency

Deduplication prevents multiple queue intents for the same alert, target,
channel, and delivery policy window. Idempotency ensures a repeated attempt has
at most one externally effective outcome when the channel supports an idempotency
key. Keys must be deterministic, scoped, and versioned; message text similarity
is not sufficient.

### Failure Handling

Failures are classified as transient, permanent, cancelled, or unknown. The
system records the classification, preserves provenance, applies the approved
retry policy, and exposes degraded operation rather than fabricating success.

### Poison Message and Dead Letter Queue

A poison message is a queue item that repeatedly cannot be safely processed,
violates its contract, or causes deterministic validation failure. After the
versioned retry limit it moves to a Dead Letter Queue (DLQ) with its original
references, failure reason, and audit history intact. DLQ handling is an
operational boundary and must not delete or mutate the Alert.

### Audit Log

An append-only record of enqueue, claim, attempt, retry, cancellation, delivery,
failure, and DLQ transitions. Every entry includes actor/system, timestamp,
policy or adapter version, Alert ID, target scope, and reason. Secrets and full
provider credentials must never be logged.

### Delivery Metadata and Provenance

Delivery metadata describes channel, adapter, queue, policy, target scope,
idempotency key, and operational timestamps. Provenance links the intent back to
the Alert ID and its canonical references without copying canonical facts. The
Alert Domain's provenance remains authoritative.

### Delivery Ordering

Ordering is guaranteed only within an explicitly defined key (such as alert and
target). Cross-channel or global ordering is not implied. Any relaxation must
be documented because retries and independent adapters can complete out of order.

### Delivery Timeout and Cancellation

Each attempt has a bounded timeout. Cancellation prevents new work or stops
eligible in-flight work according to adapter capability, while preserving an
audit record. Cancellation does not dismiss, archive, or otherwise mutate the
Alert.

### Future Scheduling Boundary

Scheduled delivery, quiet hours, recurrence, and time-zone policy belong to a
future scheduling boundary between Alert eligibility and the Notification Queue.
Scheduling must not alter canonical timestamps or Alert lifecycle and requires a
separate accepted ADR before implementation.

## Supported future channels

The architecture permits isolated adapters for:

- Email
- Telegram
- Discord
- Slack
- Webhook
- Push Notification
- SMS
- Microsoft Teams

No adapter, credential integration, queue, worker, scheduler, or API is approved
by this ADR.

## Compatibility and prohibitions

The Alert Domain remains the sole owner of alert projection facts and lifecycle.
Delivery must not modify Alert status automatically, change canonical contracts,
replace provenance, infer recipients, or create notification facts as canonical
data. Delivery may reference an Alert and report its own operational outcome.

This ADR authorizes no APIs, routes, React components, queues, workers,
schedulers, notification services, external integrations, storage changes,
Watchlist changes, or Alert Center behavior changes.

## Change control

An accepted ADR is required before introducing a queue or worker, changing Alert
lifecycle semantics, adding a channel, changing delivery identity or consent
boundaries, adding multi-user persistence, introducing scheduling, or allowing a
delivery result to mutate Alert status. Implementation must include deterministic
tests, idempotency analysis, failure and rollback behavior, secret-handling
review, and compatibility with ADR-0002 and Architecture Freeze v1.0.

## Human approval

ADR-0003 is **ACCEPTED** for the v1.7 Notification Runtime implementation. Any
future expansion beyond this boundary still requires the change-control process.
