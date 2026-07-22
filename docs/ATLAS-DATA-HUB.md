# ATLAS Data Hub

The Data Hub is the server-only boundary between the existing official providers and ATLAS clients. The request flow is: safe bounded HTTP fetch → provider parser → source normalizer → runtime-validated `AtlasEvent` → exact deduplication → `AtlasEventStore` → ATLAS API → UI.

`AtlasDataHub.refreshSources()` concurrently refreshes USGS, NOAA/NHC, JPL and CNEOS and coalesces concurrent refresh calls. Open-Meteo remains the existing on-demand coordinate source; it emits an event only when the weather threshold policy is crossed. Each source reports health independently. A healthy feed may contain zero events. One failed source does not discard successful events; all failures produce no synthetic fallback.

Normalizers retain official URLs, attribution, stable source identifiers and useful JSON-safe metadata. Invalid records are skipped and may degrade source health. Deduplication first compares IDs, then fingerprints, and never compares approximate titles. Add a source by registering it, using bounded HTTP utilities, defining a payload guard and normalizer, returning independent health, adding fixtures/tests, and documenting attribution. Do not expose raw provider payloads from public routes.
