# ATLAS Reports Center

ATLAS v1.2 generates reproducible structured reports from the existing verified Risk snapshot.
Reports are deterministic aggregation, not authored interpretation or predictive AI. They never
add facts, summaries, probabilities, forecasts, casualty counts, or confidence values.

## Report contract

Every report exposes its ID/type, generation and coverage timestamps, event/source totals,
categories, provider list, attribution, and canonical references. Sections are structured counts
and unchanged source fields: Summary, Key Events, Category Breakdown, Timeline, Risk Breakdown,
Top Regions, Official Sources, and Canonical Event Links.

Types are Daily Global, Weekly Global, AI Technology, Cybersecurity, Natural Disaster, Space
Activity, Breaking News, and Risk Summary. History windows are today (UTC), rolling 24 hours,
7 days, and 30 days.

## Determinism, provenance, and cache

The engine filters existing risk alerts, sorts by event time descending and canonical ID, and uses
stable tie-breakers for grouped counts. Provider attribution appears in the report and every
Markdown, JSON, and plain-text export. No UI component accesses providers.

Cache keys combine `atlas-reports-v1.2` with normalized filters. Reports are fresh for 60 seconds;
eligible canonical data may be served for five additional minutes with explicit degraded/stale
flags. Without current or eligible stale data, APIs return 503.

Missing regions, categories, or sources are not inferred. Counts describe covered records and are
not estimates of real-world completeness.
