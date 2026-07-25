# ATLAS Global Operations Map

`/app/map` is the Global Intelligence visualization for verified ATLAS events. It is a projection,
not a provider or event store. The view consumes the cached Breaking News contract and keeps the
same canonical ID for Event Detail, Global Timeline, Event Graph, and Source Center navigation.

## Data integrity

- A marker is rendered only when `verified === true` and the provider supplied valid WGS84
  latitude/longitude.
- Missing, inferred, geocoded, estimated, and generated coordinates are never plotted.
- Empty layers truthfully indicate that no current canonical event has verified coordinates.
- Priority and size reuse deterministic Breaking News classifications.

## Rendering and accessibility

MapLibre GL renders open tiles, clustered GeoJSON, and deterministic SVG symbols. The client makes
one request to `/api/breaking?limit=200`, refreshes every 60 seconds, and updates one clustered
source. MapLibre provides viewport culling and collision handling.

The visible-event rail mirrors every marker as a keyboard button. Selection opens a screen-reader
announced panel containing canonical links and provenance. Desktop, tablet, and 390px layouts use
the same data and controls.
