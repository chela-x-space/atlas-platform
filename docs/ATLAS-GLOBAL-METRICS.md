# ATLAS Global Metrics Engine v1

## Purpose and boundary

Global Metrics Engine v1 is a deterministic read-only calculation layer over the verified ATLAS
timeline, runtime source health, and Deterministic Event Graph v1. It measures current verified
activity. It is not a danger score, risk forecast, alerting system, or AI summary.

The engine does not predict damage, impact, casualties, or future events. A future Risk Engine
would be a separate architecture with separately governed inputs, validation, and terminology.

## Architecture

The graph service exposes one shared verified input boundary containing timeline records, source
health, and the canonical graph snapshot. The metrics service captures one UTC `generatedAt`
timestamp and passes those inputs to the pure `calculateMetricsSnapshot()` function. The API,
metrics page, and dashboard consume the resulting typed snapshot.

The pure function accepts an injected `generatedAt`, which makes fixture results reproducible.
Inputs are de-duplicated by exact timeline item ID and stably sorted. Metrics and components have
fixed IDs and stable lexical/declared ordering.

## Contracts

`GlobalMetric` contains ID, label, description, nullable value, unit, status, completeness, window,
formula ID/version, generation time, input count, source IDs, provider provenance, breakdown, and
limitations.

`MetricsSnapshot` contains `atlas-global-metrics-v1`, generation time, partial/stale state, source
health, metrics, the Planet Activity Index, and an input summary. `ActivityComponent` preserves
raw and normalized values, weight, contribution, sources, completeness, breakdown, and
limitations. All fields are JSON-serializable.

Formula version for v1 formulas is `1.0.0`.

## Time windows and UTC behavior

One calculation timestamp is captured per snapshot. Inclusive boundaries are derived once:

- 1h: `generatedAt - 60 minutes`
- 24h: `generatedAt - 24 hours`
- 7d: `generatedAt - 7 × 24 hours`

An input exactly on either boundary is included. Future-dated inputs after `generatedAt` are
excluded. Occurrence windows use official `occurredAt`; advisory update windows use official
`updatedAt`. All comparisons use UTC instants.

## Raw metrics

Event volume counts unique verified `event` and `advisory` timeline records, excluding reports, in
1h, 24h, and 7d windows.

Earthquake metrics use verified USGS earthquake records in 24h: total, M4+, M5+, M6+, and the
strongest valid magnitude. Missing or non-finite magnitudes remain in total earthquake volume but
do not enter thresholds, strongest magnitude, or severity points.

Cyclone metrics count distinct active NOAA/NHC canonical IDs and verified advisories whose
official `updatedAt` falls in 24h. Statuses `inactive`, `ended`, and `closed` are not active.

Space metrics count NASA, ESA, and combined verified reports published in 24h. Provider counts
remain separate.

Graph coverage is read directly from Event Graph v1: nodes, edges, event/advisory nodes, source
nodes, and location nodes. The metrics engine does not recreate graph relationships.

## Earth Activity formula

Each valid verified earthquake magnitude in 24h contributes:

| Magnitude | Points |
| --- | ---: |
| below 4.0 | 0.25 |
| 4.0–4.9 | 1 |
| 5.0–5.9 | 3 |
| 6.0–6.9 | 8 |
| 7.0+ | 20 |

Raw Earth Activity is the sum. Normalized Earth Activity is `min(100, raw)`.

## Cyclone Activity formula

- each distinct active verified cyclone: 20 points
- each additional verified advisory update for that cyclone in 24h: 2 points

The first current advisory establishes the active cyclone and is not an “additional” update.
Normalized Cyclone Activity is `min(100, raw)`. NOAA degradation preserves available records,
marks completeness partial, and never estimates missing advisories.

## Space Activity formula

Each verified NASA or ESA report published in 24h contributes 5 points. Normalized Space Activity
is `min(100, report count × 5)`. If one agency is unavailable, the responding agency remains
measured and completeness is partial.

## Planet Activity Index v1

Formula ID: `planet-activity-index-v1`

```text
Earth normalized × 0.50
+ Cyclone normalized × 0.25
+ Space normalized × 0.25
```

The final result is rounded to one decimal place:

- 0.0–24.9: `normal`
- 25.0–49.9: `elevated`
- 50.0–100.0: `high`

If any component is partial or unavailable while another remains available, the index is calculated
from available verified component contributions and marked partial. If every component is
unavailable, the index is null and unavailable.

**This index measures verified event activity, not predicted impact or risk.**

## Provider availability

Runtime providers are classified:

- operational: weight 1.0
- degraded or stale: weight 0.5
- unavailable: weight 0.0

`configuration_required`, intentionally `disabled`, and `paused` providers are reported but
excluded from the active denominator.

```text
availability percentage =
  sum(active provider status weights)
  / active expected provider count
  × 100
```

The percentage is rounded to one decimal place. With no active expected providers, the value is
null and completeness unavailable—never a fabricated zero.

## Partial, stale, and cache behavior

A degraded or failed provider does not erase responding providers. Affected metrics and components
are partial; unavailable values are null; limitations and source-health provenance identify the
coverage boundary.

Successful or degraded snapshots are cached for 60 seconds. If refresh fails, the last snapshot
may be served for at most five minutes with `stale: true`, `partial: true`, an explicit `servedAt`,
and `X-Atlas-Data-State: stale`. `generatedAt` remains the original calculation time. After the
stale bound, the API returns 503 rather than persisting defaults.

## Provenance and limitations

Every metric identifies exact source IDs, runtime status/staleness, and contributing input counts.
Current limitations include bounded timeline/graph aggregation, NOAA/NHC basin coverage, provider
feed publication cadence, and lack of persistent historical snapshots. No missing provider record,
magnitude, advisory, relationship, or event count is inferred.

## API and UI

`GET /api/metrics` returns the snapshot. `window=1h|24h|7d` and a stable `metric=<id>` filter are
supported; invalid values return 400. Partial snapshots return 206, complete snapshots return 200,
and bounded stale snapshots are explicitly labeled.

`/app/metrics` presents the index, components, verified counts, provider availability, graph
coverage, formulas, inputs, and limitations. `/app` includes a compact real-value summary and
links to the full methodology.
