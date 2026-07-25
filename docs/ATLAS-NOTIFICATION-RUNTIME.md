# ATLAS Notification Runtime v1.7

The Notification Runtime implements the delivery boundary defined by ADR-0003.
It consumes alert references, queues delivery intents, executes transport
adapters, and records delivery state. It does not own canonical facts, mutate
alerts, or change alert lifecycle.

## Runtime model

`PENDING → RUNNING → SUCCESS` is the successful path. Transient failures become
`RETRYING` using deterministic exponential backoff (1s, 2s, 4s, bounded at
60s). After three attempts a job becomes `DEAD_LETTER`. Jobs may be cancelled
before terminal completion. Delivery state is separate from Alert status.

The queue is deterministic FIFO, ordered by creation timestamp and stable job ID.
Idempotency is keyed by channel, alert ID, and target. Duplicate active intents
return the existing job. Webhook requests have a five-second timeout and send a
small reference payload with an idempotency header.

## Adapter boundary

Webhook is the sole v1.7 adapter. It accepts HTTP(S) targets and treats non-2xx
responses, timeouts, and network failures as delivery failures. Email, Telegram,
Discord, Slack, push, SMS, and Teams remain future adapters using the same
isolated interface.

## APIs and UI

- `GET /api/notifications` — queue, status counts, attempts, and audit snapshot.
- `GET /api/notifications/{id}` — job, attempts, and audit entries.
- `GET /api/notifications/status` — runtime and adapter readiness.
- `POST /api/notifications/test-webhook` — enqueue and execute one webhook test.
- `PATCH /api/notifications/{id}/cancel` — cancel a non-terminal job.
- `/app/notifications` — queue and webhook history dashboard.

The current runtime store is process-local and single-user, consistent with
ATLAS's existing local projection architecture. It is not a durable production
queue, multi-user delivery service, or notification provider integration.

## Safety and provenance

Jobs contain an Alert ID and delivery metadata, not canonical event payloads.
Audit entries preserve job and attempt identity, status, timestamps, adapter, and
failure reason without credentials. The runtime never marks an Alert read,
acknowledged, dismissed, or archived.
