# Breaking News APIs

- `GET /api/breaking?category=&priority=&country=&provider=&limit=`
- `GET /api/breaking/latest?category=&priority=&country=&provider=&limit=`
- `GET /api/breaking/providers`

Breaking filters are deterministic and validated. `category` and `priority` allow comma-separated
values; `limit` is bounded to 1–200. Responses use 200 for complete data, 206 for partial provider
coverage, 400 for invalid input, and safe 503 responses when no snapshot can be produced.
