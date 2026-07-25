# Breaking News APIs

- `GET /api/breaking?category=&priority=&country=&provider=&limit=`
- `GET /api/breaking/latest?category=&priority=&country=&provider=&limit=`
- `GET /api/breaking/providers`

## Global Operations Map

No map-specific API is introduced. `/app/map` consumes `GET /api/breaking?limit=200`; its canonical
IDs, deterministic priorities, provider health, verified flag, and confirmed coordinates are
sufficient for the visualization. Open tiles are presentation infrastructure, not an ATLAS data
provider.

## Global Risk APIs

- `GET /api/risk?level=&category=&provider=&from=&to=&activity=&coordinates=&search=&limit=`
- `GET /api/risk/alerts` — the same filtered canonical alert contract
- `GET /api/risk/summary`
- `GET /api/risk/rules`

Complete responses use 200; degraded or stale-backed responses use 206 and
`X-Atlas-Data-State`; unavailable canonical inputs use 503. Filters never recompute a
classification. Rules expose only IDs, versions, input fields, resulting levels, precedence, and
fixed explanation templates.

## Reports APIs

- `GET /api/reports?type=&history=&category=&provider=&risk=&region=&search=`
- `GET /api/reports/types`
- `GET /api/reports/summary` with report filters
- `GET /api/reports/export?format=markdown|json|text` with report filters

Reports return 200 when complete, 206 when canonical inputs are degraded/stale, 400 for invalid
filters, and 503 when no current or eligible stale canonical data exists. Exports preserve provider
attribution.

Breaking filters are deterministic and validated. `category` and `priority` allow comma-separated
values; `limit` is bounded to 1–200. Responses use 200 for complete data, 206 for partial provider
coverage, 400 for invalid input, and safe 503 responses when no snapshot can be produced.
