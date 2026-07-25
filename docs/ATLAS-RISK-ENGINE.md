# ATLAS Global Risk & Alert Engine

ATLAS v1.1 classifies verified canonical timeline records with explicit deterministic rules. It is
an operational organization layer, not predictive AI. It does not create probabilities, impact
estimates, casualty counts, forecasts, confidence values, summaries, or canonical facts.

## Contract and provenance

Every alert contains its level, rule ID/version, fixed explanation, evaluation time, source event
ID/category/attribution, provider identity, and canonical navigation target. Titles, locations,
timestamps, coordinates, status, severity, and provider fields remain unchanged from normalized
timeline inputs.

Levels, in order: `CRITICAL`, `HIGH`, `ELEVATED`, `WATCH`, `INFORMATIONAL`.

## Rule precedence (version 1.0.0)

1. Explicit official `extreme`, `emergency`, or `red` alert state → CRITICAL.
2. Canonical critical severity → CRITICAL.
3. Existing canonical critical priority → CRITICAL.
4. Canonical high severity → HIGH.
5. Existing canonical high priority → HIGH.
6. Active official warning with verified region/country scope → ELEVATED.
7. Existing canonical medium priority → ELEVATED.
8. Resolved/inactive canonical status → INFORMATIONAL.
9. Verified event within 24 hours without a severe designation → WATCH.
10. Missing or non-severe inputs → INFORMATIONAL with a conservative fallback explanation.

Rule IDs and semantic versions are stable public contract fields. A behavior change requires a new
rule version. `/api/risk/rules` exposes non-sensitive metadata and input field names.

## Service, cache, and failure behavior

The risk service consumes the existing Global Timeline aggregation; UI code never fetches
providers. Cache identity is `atlas-risk-v1.1:timeline`, with a 60-second fresh window and five
minute stale fallback. Stale results are explicitly marked degraded/stale. If neither current nor
eligible stale canonical data exists, APIs return 503 rather than an empty successful response.

## Limitations

Coverage is limited to configured ATLAS timeline providers and their reported fields. Missing data
is not inferred. The operational matrix groups canonical level by recency/status and does not
represent likelihood, probability, predicted impact, or advice.
