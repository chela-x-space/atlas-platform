# Breaking News APIs

- `GET /api/breaking?category=&priority=&country=&provider=&limit=`
- `GET /api/breaking/latest?category=&priority=&country=&provider=&limit=`
- `GET /api/breaking/providers`

## Global Operations Map

No map-specific API is introduced. `/app/map` consumes `GET /api/breaking?limit=200`; its canonical
IDs, deterministic priorities, provider health, verified flag, and confirmed coordinates are
sufficient for the visualization. Open tiles are presentation infrastructure, not an ATLAS data
provider.

Breaking filters are deterministic and validated. `category` and `priority` allow comma-separated
values; `limit` is bounded to 1–200. Responses use 200 for complete data, 206 for partial provider
coverage, 400 for invalid input, and safe 503 responses when no snapshot can be produced.
