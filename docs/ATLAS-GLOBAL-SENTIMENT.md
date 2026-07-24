# ATLAS Global Sentiment Index v1

## Purpose and boundaries

Global Sentiment Index v1 measures literal textual polarity in eligible verified source text. It is
not public-opinion polling, emotion recognition, a geopolitical or disaster risk score, or a
prediction system.

**This index measures the tone of eligible verified source text. It does not measure public
opinion, human emotion, or predicted impact.**

No LLM is used for sentiment classification. No remote sentiment API, opaque model, embedding,
translation, fuzzy match, stemming, or generated summary participates. Missing sources are never
estimated, and unavailable measurements never become an artificial neutral zero.

## Architecture

The sentiment service reuses the shared verified graph/timeline input boundary. It receives
canonical timeline records and runtime source health without refetching providers independently.
The pure `calculateSentimentSnapshot()` function accepts those inputs, a single injected UTC
`generatedAt`, the selected window, and optional source filter. The API, page, and dashboard consume
the resulting stable snapshot. Planet Activity Index remains separate and unchanged.

## Eligible and excluded sources

Eligible v1 providers are the already-integrated NOAA/NHC, NASA RSS, and ESA RSS sources. Eligible
source-supplied fields, evaluated in fixed order, are `title`, `summary`, `description`, and
`advisoryText`. Identical normalized field bodies within a record are analyzed once.

Excluded inputs include location/provider names alone, UI labels, error and health messages,
ATLAS-generated descriptions, AI summaries, user content, social media, inferred text, and
non-verified records. USGS earthquake timeline entries are excluded in v1 because their ATLAS title
is composed from magnitude and location, while the source title is structured magnitude/location
text rather than eligible prose. The underlying USGS events remain available to the activity
metrics and graph. Large advisory bodies are not returned by the UI.

## Contracts and stable IDs

Snapshot version is `atlas-global-sentiment-v1`; index ID is `global-sentiment-index`. The index,
record result, coverage, source breakdown, provenance, input summary, and source-health contracts
are typed and JSON-serializable. Records and source breakdowns use deterministic ordering.

## Lexicon

Lexicon ID is `atlas-official-text-en`, version `1.0.0`. Its source-controlled categories are:

- positive terms: base `+1`
- strong positive terms: base `+2`
- negative terms: base `−1`
- strong negative terms: base `−2`
- intensifiers
- negations

The compact lexicon is reviewed for literal use in official reports and advisories. Ambiguous
emotion/political terms, provider names, locations, and `safe` are intentionally excluded because
the current contracts do not preserve quotation context.

## Normalization

Each field is stripped of HTML tags, decodes numeric and common named entities, normalized with
Unicode NFKC, lowercased using the English locale, punctuation-separated, and whitespace-collapsed.
Tokens are matched exactly. No stemming or semantic equivalence is applied.

v1 is English-only. Explicit languages other than `en`, an `en-*` locale, or provider-default `und` are
unscored and counted as unsupported. No translation or language guess is performed. Existing
English-language operational providers without an explicit language field use `en`.

## Record scoring

Formula:

1. Sum exact term weights across fixed-order eligible fields; modifier windows reset at each field.
2. An intensifier immediately preceding a matched term multiplies its weight by `1.5`.
3. Inspect the previous three tokens for exact negations.
4. An odd negation count reverses sign; an even count leaves sign unchanged.
5. `normalized = clamp(raw / 5, −1, +1)`.
6. Raw values are rounded to two decimals and normalized values to three.

Record buckets are `≤−0.60 strongly_negative`, `≤−0.20 negative`, `<+0.20 neutral`,
`<+0.60 positive`, and otherwise `strongly_positive`.

Analyzable English text with zero recognized terms is a measured neutral record. A record with no
eligible text or unsupported language is unscored, never neutral.

## Duplicate handling

Duplicates are removed before scoring by:

1. source plus canonical report/event identity;
2. source-native record ID;
3. exact normalized title, source, and publication timestamp when neither stable ID exists.

No fuzzy or semantic duplicate rule is used. Eligible, unique, duplicate, unsupported, scored, and
unscored counts remain visible.

## Windows and recency

All window boundaries are inclusive and derived from the one injected UTC timestamp. Future records
are excluded. Equal record weights apply across providers.

| Window | Quartile age weights |
| --- | --- |
| 1h | 0–15m `1.00`; >15–30m `0.85`; >30–45m `0.70`; >45–60m `0.55` |
| 24h | 0–6h `1.00`; >6–12h `0.85`; >12–18h `0.70`; >18–24h `0.55` |
| 7d | 0–1.75d `1.00`; >1.75–3.5d `0.85`; >3.5–5.25d `0.70`; >5.25–7d `0.55` |

## Global formula and labels

Formula ID is `global-sentiment-index-v1`, version `1.0.0`.

```text
weighted average = sum(record normalized score × recency weight)
                   / sum(recency weights)
index = round(weighted average × 100, 1)
```

Output buckets are `≤−60 strongly_negative`, `<−20 negative`, `<+20 neutral`, `<+60 positive`,
and otherwise `strongly_positive`. With no scored record the value is null, status and completeness
are unavailable, and no zero is emitted.

## Coverage and completeness

Coverage is `scored unique records / eligible unique records × 100`, rounded to one decimal.
With no eligible unique record it is null.

- complete: at least one scored record, coverage ≥80%, and every expected provider is healthy;
- partial: at least one scored record, but a provider is degraded/unavailable or coverage <80%;
- unavailable: no scored records.

Coverage reports responding, degraded, and unavailable providers plus duplicate, unsupported, and
unscored records. Each stable source-ID breakdown shows counts, average score, and its
recency-weighted contribution using the global applied-weight denominator, plus completeness and
limitations. No trust ranking is produced.

## Cache, stale data, and provenance

Successful and partial snapshots are cached for 60 seconds. Failed refresh may serve the previous
snapshot for at most five minutes with `stale: true`, `partial: true`, and `servedAt`; `generatedAt`
remains its original calculation time. After that bound, the API returns 503.

Every result preserves provider ID/name, official URL, attribution, stable source record ID, and
the exact analyzed field names. Stale data is explicitly labeled and never presented as live.

## API and UI

`GET /api/sentiment` defaults to 24h. It supports `window=1h|24h|7d`,
`source=esa-rss|nasa-rss|noaa-nhc`, and `limit=1..50`. Invalid input returns 400;
partial snapshots return 206; complete snapshots return 200.

`/app/sentiment` shows the index, literal label, coverage, distribution, stable source breakdown,
attributed recent records, formula, lexicon, and limitations. The dashboard replaces the former
placeholder with the live, partial, or honest unavailable state. This signal remains separate from
Global Metrics activity and from any future explicitly governed Risk Engine.
