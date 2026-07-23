# ATLAS Dashboard Data Contract

`GET /api/dashboard` returns `generatedAt`, metrics, strongest/recent earthquakes, active cyclones, timeline events, technology news, breaking items, source health, and unavailable metric keys. Available metrics contain a numeric value, unit and source IDs. Unsupported metrics use `not-computed` or `integration-pending` with a reason; they never contain invented numbers.

`GET /api/events` returns `AtlasEventPage`. It accepts category, severity, source, search, after, before, latitude, longitude, radiusKm, limit (maximum 500), cursor and sort. Radius parameters are all-or-none. `GET /api/events/{id}` returns one normalized event or a consistent 404 envelope. `GET /api/source-health` returns independent health records with stable error classifications and no secrets.

`GET /api/timeline` returns the bounded, mixed-source `TimelineResponse` used by `/app/timeline`. It combines verified USGS and NOAA/NHC operational records with NASA and ESA official reports, ordered newest first with cursor pagination. The existing dashboard `timelineEvents` field remains an `AtlasEvent` subset to preserve established dashboard and mobile consumers; it does not duplicate the mixed-source API contract.

Clients retain fixed panel footprints while loading. Errors state that the source or hub is unavailable and show no substitute data. Partial source health does not hide valid events. Event links open official source URLs with `noopener noreferrer`.
