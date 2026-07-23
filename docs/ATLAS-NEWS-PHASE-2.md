# ATLAS News Phase 2

Verified NASA and ESA report cards now link to `/app/events/[id]` using their exact normalized report IDs. “Read original” remains a separate link to the official provider page. Canonical detail relationships only accept existing `exact` groups; strong or probable groupings remain contextual News Center presentation and are not asserted as identity.

**Validation date:** 2026-07-23
**Scope:** verified public report metadata and short source-supplied excerpts for `/app/news`
**Policy:** no commercial-publisher scraping, article-body mirroring, media mirroring, unofficial feeds, or LLM summaries.

## Provider decisions

| Provider | Decision | Evidence and exact endpoint | Attribution / terms |
|---|---|---|---|
| ReliefWeb API v2 | `configuration_required` | [V2 documentation](https://apidoc.reliefweb.int/); `https://api.reliefweb.int/v2/reports` and `/disasters`. The required `appname=atlas.chela-x.space` returned HTTP 403 on 2026-07-23. Since 2025-11-01 appnames must be pre-approved. | `ReliefWeb / UN OCHA` plus the named original information partner. API content can include partner-owned copyright; ATLAS stores metadata and a bounded API description only. |
| NASA official RSS | **Active** | [Official RSS directory](https://www.nasa.gov/rss-feeds/): `https://www.nasa.gov/news-release/feed/`, `https://www.nasa.gov/feed/`, and `https://www.nasa.gov/technology/feed/`. All returned HTTP 200 RSS on 2026-07-23. | `National Aeronautics and Space Administration (NASA)`. Title, feed excerpt, timestamp and canonical link only. No media is downloaded. |
| ESA official RSS | **Active** | Official `https://www.esa.int/rssfeed/Our_Activities` returned HTTP 200 RSS on 2026-07-23 and is both the directory and feed endpoint. | `European Space Agency (ESA)`. Metadata and a bounded feed excerpt only; no article or media republication. |
| WHO Headquarters | Disabled | No stable official general RSS endpoint with both reliable publication timestamps and confirmed headline/link syndication terms was verified. The existing Sitefinity Disease Outbreak News interface remains research-only. | WHO copyright policy applies. No WHO content is ingested. |
| WHO EMRO | Disabled | An official regional RSS directory was found, but the endpoint could not be reliably fetched during validation and its older linked material does not establish a production-quality emergencies feed contract. | No production ingest. Scope would have to be labeled Eastern Mediterranean Region if later approved. |
| JPL / CNEOS legacy feeds | Disabled | Prior production-style validation recorded HTTP 403/quarantine. NASA directory feeds replace them for this phase. | No ingest. |

Commercial publishers and unofficial RSS mirrors were rejected by policy. ATLAS does not scrape Reuters, AP, BBC, CNN, Google News, or publisher HTML.

## ReliefWeb configuration and quota

ReliefWeb API v2 allows at most 1,000 calls per day and 1,000 entries per call. ATLAS uses a conservative 40-report request, a 20-report disaster-referenced request, and a 40-disaster metadata request no more than once per 30-minute refresh window (normally 144 calls/day). It retries a transient 429/5xx failure once only.

Register the exact app name `atlas.chela-x.space` using the form linked from the ReliefWeb API `appname` documentation. After written approval, set:

```dotenv
RELIEFWEB_APPNAME_APPROVED=true
```

The app name is not a secret and remains fixed in server code. The environment flag is server-only and merely records approval; it does not bypass ReliefWeb enforcement.

## Normalization and content limits

Every accepted report has a canonical safe HTTP(S) URL, title, bounded source-supplied summary, provider and original source, source URL, valid publication/update/fetch timestamps, category, country/location/disaster/event metadata, language, attribution, verification state, provider ID and SHA-256 content fingerprint. Unsafe protocols, feed/media/download URLs, empty titles and malformed dates are rejected.

RSS summaries are HTML-stripped and deterministically limited to 500 characters. ReliefWeb descriptions are likewise bounded. Complete article bodies, attachments, images and videos are never stored or returned. Phase 2 performs no LLM summarization.

## Deduplication

Precedence is:

1. canonical URL;
2. provider plus provider record ID;
3. normalized title plus original organization in a six-hour window;
4. content fingerprint.

The internal result records the reason and retained record. Separately numbered bulletins or situation reports are not collapsed. Different original organizations are not collapsed by title.

## Event grouping

Grouping is deterministic. Shared disaster/provider identifiers are exact matches. Event-type/title, location and bounded time-window agreement is strong. High title overlap in a tight time window is only probable. Country alone never groups reports. Every unmatched report remains a standalone group.

USGS earthquakes and NOAA/NHC cyclones are queried as event anchors. Group output includes the anchor, related reports, source count, newest time, categories, countries, confidence and an explanatory reason. The UI explicitly labels probable grouping and does not present it as verified event identity.

## Cache and failure policy

The server cache is bounded to 12 provider entries and coalesces concurrent refreshes. NASA uses a 15-minute TTL; ESA and ReliefWeb use 30 minutes. A prior response may be served for up to four TTL windows during a temporary failure, with `degraded`, `stale=true`, and `STALE_CACHE` health. If only stale providers exist, the page does not claim live updates.

Provider orchestration uses `Promise.allSettled`; one failure cannot blank valid reports from another provider. Public errors contain categories only, never stack traces, response bodies, environment values or secrets.

## Known limitations

- ReliefWeb requires appname approval before activation.
- RSS feeds expose a bounded editorial window and have no public uptime SLA.
- NASA’s broad recent feed may overlap its releases and technology feeds; cross-feed deduplication handles exact duplicates.
- ESA content reuse is conservative: metadata/link and a short feed excerpt only.
- WHO remains disabled.
- Event anchoring is limited to current USGS/NHC in-memory events and can be unavailable independently.
- No persistent cross-instance cache is claimed; Vercel fetch revalidation supplements the small process cache.

## Production validation

Fixture tests cover valid/malformed ReliefWeb and RSS payloads, URL/date rejection policy, deduplication, grouping, partial failure, stale fallback, zero results and source health without live network access. Completion additionally requires a live production-mode check that NASA or ESA returns real current reports, attribution and original links render, and desktop/mobile have no console, hydration or overflow failures.
