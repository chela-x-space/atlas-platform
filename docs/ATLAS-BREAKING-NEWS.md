# ATLAS Breaking News Center

## Purpose

Breaking News Center is a deterministic current-event projection over verified ATLAS canonical
records. It does not scrape additional providers, generate headlines, summarize source text,
predict impact, or rank stories using AI.

## Architecture

The service reuses:

- Global Timeline for USGS, NOAA/NHC, NASA, and ESA canonical records and source health;
- AI Technology Radar for official registry, GitHub release, and benchmark-provider health plus
  official technology releases;
- canonical event IDs for Event Detail and Event Graph links.

One `generatedAt` timestamp defines every time boundary. Timeline records use an inclusive 24-hour
window. Official AI releases use an inclusive seven-day window. Records outside those windows,
unverified records, earthquakes below the breaking threshold, and records without an official
source URL are excluded. Canonical IDs prevent duplicates.

## Breaking event contract

Every event contains canonical ID, mapped category, priority, source headline, provider identity,
country/region, coordinates when supplied, publication and update timestamps, verification state,
official source URL, timeline relationship, and applicable Event Detail and Event Graph routes.
Provenance retains provider, attribution, source URL, and source-native record ID.

## Deterministic priority

- Earthquake magnitude `>= 7.5`: critical
- Earthquake magnitude `6.5–7.4`: high
- Earthquake magnitude `5.5–6.4`: medium
- Earthquakes below `5.5` or without verified magnitude: excluded
- NOAA/NHC text containing exact `hurricane warning`: critical
- NOAA/NHC text containing exact `tropical storm`: high
- Other verified weather/cyclone advisories: medium
- Existing canonical critical/high/moderate severity: critical/high/medium
- Other official reports: information
- Official model or agent semantic major release (`major >= 1`, remaining segments zero): medium
- Other official GitHub releases and patches: information

No model, embedding, semantic comparison, source reputation score, or editorial judgement
participates.

## Filtering and ordering

Filters are exact category, exact priority, case-insensitive country/region substring, and exact
provider ID. Categories and priorities accept comma-separated values. Results sort by fixed
priority order, then publication time newest-first, then canonical ID. Limits are bounded to
`1..200`.

## APIs

- `GET /api/breaking`: full snapshot and optional filters
- `GET /api/breaking/latest`: at most 25 latest filtered verified events
- `GET /api/breaking/providers`: normalized provider-health summary

Unknown parameters or values return HTTP 400. Partial provider coverage returns HTTP 206 while
preserving verified events from responding providers. A total service failure returns a safe 503
without stack traces.

## Cache and stale behavior

Successful or partial snapshots cache for 60 seconds. If refresh fails, the latest successful
snapshot may be served for up to five minutes with `stale=true`, `partial=true`, and a distinct
`servedAt`. `generatedAt` remains the original calculation time. Stale data is never labelled live.

## Interface and accessibility

`/app/breaking` provides the live status bar, category buttons, priority/country/provider controls,
keyboard-focusable event cards, source links, canonical navigation, and provider-health sidebar.
The page uses existing ATLAS dark-theme tokens and responsive overflow patterns.

## Limitations

Coverage is limited to providers and categories already verified by ATLAS. Volcano, conflict,
economy, cyber, health, marine, aviation, and energy filters remain available for canonical future
records, but no counts are fabricated when current providers supply none. Country and coordinates
remain null when the official record does not supply them.
