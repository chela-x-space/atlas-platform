# ATLAS Event Detail

## Purpose

`/app/events/[id]` is the canonical sourced-detail surface for existing ATLAS operational events, NOAA/NHC advisories, and verified NASA/ESA reports. It resolves exact identifiers only and does not infer impact, confidence, severity, location, historical context, or relationships.

## Canonical detail model

`EventDetail` preserves the underlying title, source summary, category, event type, status, timestamps, source identity, canonical source URL, original source, attribution, location, countries, coordinates, and source-provided type-specific values. Missing values remain `null`.

The supported canonical types are:

- `operational_event` for USGS `AtlasEvent` earthquake records;
- `advisory` for NOAA/NHC cyclone advisory `AtlasEvent` records;
- `verified_report` for NASA and ESA official RSS reports.

Every displayed sourced field maps to a provenance record containing source ID, source name, safe source URL, and attribution. Raw metadata is a bounded, user-readable subset: internal stack traces, credentials, tokens, cache keys, raw payload references, unsafe URLs, nested objects, and oversized values are removed.

## ID resolution

The resolver accepts:

1. an exact `AtlasEvent.id`;
2. an exact verified report ID;
3. an exact global timeline item ID;
4. an exact NOAA/NHC advisory event ID.

A timeline ID resolves to its exact `relatedEventId` or `relatedReportId`, preferring the newest available revision of that same canonical record. Lookup never uses titles, similarity, fuzzy matching, or a fallback record. Unsupported characters, traversal sequences, malformed percent encodings, empty IDs, and IDs longer than 300 characters are rejected.

## Source provenance and links

The resolver reuses the safe URL validation, timeline normalization, source registry, and timeline source-health records. The ATLAS detail link and original-provider link are separate actions. Provider documentation comes from the existing governed source registry.

## Relationship rules

Related reports are shown only when the existing news grouping contract reports `exact` confidence. `strong` and `probable` groups are not promoted to canonical relationships. Related timeline entries must share the exact canonical event or report ID, or reference a report in an exact group. No new relationship engine is introduced.

## Map rules

The map renders only when the canonical record contains finite WGS84 longitude and latitude in range. NASA and ESA reports currently have `null` coordinates and do not render a map. MapLibre uses the exact source coordinates, adds one marker, and displays a coordinate fallback if initialization or tiles fail. It never substitutes a default event location.

## Stale data and provider outages

Detail resolution has an in-process cache bounded to 100 alias/canonical entries and coalesces concurrent requests by ID. USGS/NOAA detail entries use a 60-second fresh TTL; NASA/ESA entries use 15 minutes. A previously resolved sourced detail may be served for at most one additional hour when its provider is unavailable. Stale fallback sets `item.stale`, source health, `partial`, and a sanitized `STALE_CACHE_FALLBACK` error explicitly.

Provider branches remain isolated by the Global Timeline aggregator. A degraded unrelated provider may make the overall response partial without removing an available canonical record.

## API contract

`GET /api/events/[id]` returns:

- `item`;
- `relatedReports`;
- `relatedTimelineItems`;
- `sourceHealth`;
- `fetchedAt`;
- `partial`;
- `errors`.

Invalid IDs return `400 INVALID_EVENT_ID`; exact unknown IDs return `404 NOT_FOUND`; total live failure without cached data returns `503 EVENT_DETAIL_UNAVAILABLE`. Internal exceptions, stack traces, and secrets are never returned. The existing `GET /api/events` collection contract is unchanged.

## Not-found behavior and metadata

Unknown IDs render a deliberate “Event not found” page with links to Global Timeline and Event News Center. No substitute item is selected. Valid pages use the sourced title and sourced summary for page metadata and publish the canonical path on the public `atlas.chela-x.space` origin. Not-found metadata is non-indexable and never claims valid event content.

## Known limitations

- The event store and detail cache are process-local and not durable.
- The bounded live timeline determines which IDs can be resolved after cache expiry.
- Provider revisions are available only when retained by the existing event store.
- NOAA/NHC geographic coverage remains limited to its documented basins.
- NASA/ESA report feeds do not currently provide coordinates or operational severity.
- Most current NASA/ESA reports are standalone because no exact event relationship exists.

## Future deterministic event graph

A future persistent event graph may add source-owned revisions and explicit identifiers across providers. It must preserve exact provenance and relationship evidence. Probabilistic or AI-generated associations must not silently enter the canonical detail model.
