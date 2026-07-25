# ATLAS v1.6 Alert Center

## Scope

The Alert Center is the first implementation of the accepted ADR-0002 Alert
Domain. Alerts are non-canonical projections between existing intelligence
producers and a future delivery layer. They reference canonical records, preserve
provenance, and never own or mutate facts.

## Sources

The service consumes existing Timeline, Breaking, Risk, Watchlists, and Reports
projections. Producers retain authority over their own contracts. No producer
behavior, Search ranking, Watchlist matching, Risk classification, graph
relationship, or canonical event model is changed.

## Alert model and lifecycle

An alert contains an alert ID, source module, source record ID, severity, priority,
status, canonical reference, matching reason, category/risk metadata, timestamps,
provenance, and non-canonical metadata. Canonical payloads are not copied into the
alert record.

Lifecycle transitions are deterministic:

`CREATED → NEW → ACKNOWLEDGED → READ → DISMISSED → ARCHIVED`

Initial producer projections enter `NEW` (or preserve Watchlist status). The local
lifecycle store records transition actor/system, timestamp, and reason. Archived
alerts are terminal. Transitions never modify canonical intelligence.

## Matching, deduplication, and ordering

Risk and Breaking alerts reference their existing classifications and priorities.
Timeline alerts are projected only from existing high/critical severity. Watchlist
alerts reference existing deterministic matches. Reports create an informational
projection only when an existing report contains canonical events.

Alert IDs are producer-scoped and canonical-reference based. Duplicate projections
use deterministic identity and stable tie-breakers. Filters support status,
severity, source, category, risk level, UTC time range, and text search. Sorting
supports newest, oldest, severity, and source with alert ID tie-breaking.

## APIs and UI

- `/app/alerts`
- `/app/alerts/[alertId]`
- `GET /api/alerts`
- `GET /api/alerts/[alertId]`
- `PATCH /api/alerts/[alertId]`
- `GET /api/alerts/summary`
- `GET /api/alerts/status`
- `GET /api/alerts/sources`

The Center exposes summary cards, severity/status/source distributions, recent
activity, filters, deterministic sorting, pagination, provenance, lifecycle audit,
and canonical navigation.

## Degraded behavior and limitations

Source failures are surfaced as degraded responses with named warnings. No
replacement alert or canonical fact is generated. The current lifecycle store is
process-local and single-user, consistent with the v1.5 local preference boundary;
authentication, multi-user persistence, historical replay, and cloud sync are not
implemented.

## Delivery boundary

Email, Telegram, Discord, Slack, webhooks, push notifications, credentials,
consent, retries, and endpoint management remain outside the Alert Domain and this
milestone. A future Delivery Layer requires separate architecture approval and
must not mutate canonical data or silently alter alert lifecycle.
