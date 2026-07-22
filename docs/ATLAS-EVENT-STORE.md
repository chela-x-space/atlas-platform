# ATLAS Event Store

`AtlasEventStore` defines `upsertMany`, `getById`, `query`, `count`, and `deleteExpired`. The current implementation is a bounded, process-local in-memory map. It is deterministic but not persistent and must not be presented as durable storage. Tests create isolated instances; production route state is scoped to the server process.

Queries filter category, severity, source, occurrence time, text, and optional Haversine radius. Default ordering is occurrence descending with ID as a stable tie-breaker. The opaque cursor encodes a stable result offset; callers must treat it as opaque and restart pagination after refresh. Expired records are removed during refresh and explicit cleanup. The store evicts oldest-updated records above its configured bound.

`AtlasEventRepository` is the interface-compatible PostgreSQL boundary only. A future migration should map normalized columns, JSONB metadata, unique ID/fingerprint indexes, geospatial indexing, and transactional upserts behind this contract. No ORM, connection, schema migration, or persistence claim is included now.
