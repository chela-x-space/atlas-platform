# ATLAS Global Timeline

## Purpose

`/app/timeline` is a chronological global activity stream built only from existing verified ATLAS production data. It combines USGS earthquakes, NOAA/NHC cyclone advisories, NASA official RSS reports, and ESA official RSS reports. It does not infer relationships, generate summaries, add severity, or create provider data.

## Timeline data model

`TimelineItem` is the public normalized contract. It preserves the source title, source-provided summary, category, provenance, original timestamps, attribution, location, coordinates, severity, and status. Missing location, coordinates, and severity are `null`; they are never inferred. Operational records reference their existing `AtlasEvent` ID and reports reference their verified report ID.

Cyclone records already emitted by the NOAA/NHC event normalizer are presented as `advisory`. Earthquakes are `event` items. NASA and ESA publications are `report` items.

Only safe HTTP or HTTPS detail URLs accepted by the existing ATLAS external-URL validator are exposed. Records with malformed required timestamps or unsafe supplied URLs are rejected deterministically.

## Source mapping

| Source | Timeline type | Categories | Source contract |
| --- | --- | --- | --- |
| USGS Earthquake Hazards Program | event | earthquake | `AtlasEvent` |
| NOAA/NHC | advisory | cyclone | `AtlasEvent` |
| NASA official RSS | report | feed-provided verified category | verified report |
| ESA official RSS | report | feed-provided verified category | verified report |

No additional providers are queried by the timeline.

## Ordering and deduplication

Items are ordered by `occurredAt` descending. Equal timestamps use the timeline item ID ascending as a stable tie-breaker.

Deduplication checks, in order:

1. exact timeline item ID;
2. canonical safe source URL;
3. provider ID plus provider record ID;
4. normalized title within a five-minute window as a same-provider report fallback.

Distinct NASA and ESA reports are not collapsed. Operational revisions with changed occurrence or update timestamps are retained, even if they share an event detail URL or provider record ID. Cyclone advisories at different advisory times remain distinct. Duplicate reasons are retained inside the aggregation service and are not exposed publicly.

## Filtering and pagination

`GET /api/timeline` supports `limit`, `cursor`, `category`, `source`, `itemType`, `from`, `to`, and `search`. Values are validated against the active timeline source and taxonomy allowlists. Limits range from 1 to 100 and default to 25. Dates must be valid timestamps and `from` cannot follow `to`.

Cursors are opaque, encode the last item’s timestamp and stable ID, and are valid only while that item remains in the filtered result. Invalid or stale cursors return a sanitized `400 INVALID_CURSOR` response.

The upstream event query is bounded at 500 items. News providers already enforce their own conservative limits and caches.

## Stale data and partial outages

Timeline source status reuses the event hub and verified-news provider health records. NASA and ESA item staleness comes directly from provider health. Event source health does not currently expose a stale flag, so USGS and NOAA/NHC records are not labeled stale by inference.

Event ingestion and official-news ingestion run through separate settled operations. Failure of either branch produces partial results from the other branch. The API reports `activeSources`, `staleSources`, `partial`, and sanitized `sourceStatus`. A partial response uses HTTP 206; parameter errors use 400; total aggregation failure uses a sanitized 503 envelope.

## Dashboard integration

The existing dashboard timeline remains unchanged. It consumes a compact `AtlasDashboardSnapshot.timelineEvents` array of `AtlasEvent` records that also drives mobile overview and dashboard search behavior. Replacing it with the paginated mixed event/report contract would change those established consumers and couple the dashboard refresh to editorial feed latency. The dedicated `/api/timeline` contract is therefore authoritative for mixed-source chronological activity, while the dashboard safely retains its existing verified operational subset.

## Known limitations

- The event store is process-local and bounded; timeline history is not durable.
- USGS and NOAA/NHC coverage and update cadence remain provider-defined.
- NOAA/NHC covers its documented Atlantic and eastern/central Pacific responsibilities, not every global cyclone basin.
- NASA and ESA report locations and coordinates remain unavailable unless their verified report contract later supplies them.
- A cursor can expire when the bounded live dataset changes.
- The timeline does not infer event-to-report relationships.

## Future event-detail integration

A future event-detail service may expose provider revisions and already-established deterministic event/report relationships. Timeline items can then link to those details through `relatedEventId` and `relatedReportId` without changing source provenance or using probabilistic grouping.
