# Real Data Integration

The browser calls same-origin ATLAS route handlers. Those handlers select only an active source from the central registry, validate query parameters, fetch with an abort timeout and size/content-type bounds, validate/normalize the payload, and return source metadata with cache headers. Coordinates remain WGS84 `[longitude, latitude]`; USGS depth is preserved separately in kilometres.

RSS 2.0 and Atom feeds are bounded before parsing. Unsafe markup is removed, canonical source links are retained, items are normalized to `AtlasNewsItem`, deduplicated by canonical URL then normalized title, and sorted newest-first. A failed feed yields source-health metadata while healthy feeds still return a partial result. If every source fails, the API returns 503 and an empty real item list—never placeholders.

Shared caches reduce upstream load and `stale-while-revalidate` permits a previously validated response to remain useful during refresh. Explicit failure responses use `invalid-parameters`, `timeout`, `unavailable`, `invalid-content-type`, `response-too-large`, `invalid-upstream-data`, or `all-sources-unavailable` without leaking upstream bodies, credentials, or internal errors.

To add a source safely: verify its official documentation and exact HTTPS endpoint; review authentication, licensing, attribution, rate limits, and redistribution rights; add a disabled registry entry first; implement bounded fetch and schema validation; normalize into an ATLAS contract; add partial/all-failure tests; show attribution and original links in the UI; then mark active. Fabricated fallback data and silent mock fallbacks are prohibited.
