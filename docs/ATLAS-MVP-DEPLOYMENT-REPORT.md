# ATLAS MVP Deployment Report

**Deployment readiness: PASS**

## Active sources

- USGS Earthquake Hazards Program — worldwide earthquake feed; healthy in the production smoke test. Attribution and official event detail links are retained.
- NOAA/NHC — Atlantic and East/Central Pacific cyclone advisories only. Partial success is supported; the production smoke test returned two normalized advisories and a degraded state because one or more basin feeds/items were unavailable.

Open-Meteo is optional and disabled by default. It is enabled only with `OPEN_METEO_API_KEY` or an explicit `OPEN_METEO_ALLOW_NONCOMMERCIAL=true` declaration for an eligible deployment.

## Disabled sources

- JPL News — live server-style request returned HTTP 403; fetcher is not scheduled.
- CNEOS News — quarantined until non-empty items and public detail links pass end-to-end verification; fetcher is not scheduled.
- OpenSky — credentials and deployment terms unresolved.
- OpenAQ and WHO — not MVP integrations and not scheduled.
- FRED, Twelve Data, commercial market feeds, Fear & Greed, NVIDIA AI, and Microsoft AI — no active MVP adapter is scheduled or called. No market or AI values are fabricated.

## Validation

- `npm ci` — PASS
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test` — PASS (5 test files, including external-link safety)
- `npm run build` — PASS with Next.js 16.2.11
- Production route smoke test — PASS (HTTP 200): `/`, `/app`, `/app/news`, `/app/weather`, `/app/earthquake`, `/api/events`, `/api/dashboard`, `/api/source-health`
- Live normalized snapshot — 223 USGS events in the in-memory 24-hour query, 2 NHC advisories, zero invalid timestamps, and zero unsafe event URLs. Provider health is returned independently so one failure does not break the response.
- Credential pattern scan — no recognized committed API key, access-token, or private-key patterns found.

## Environment

No environment variables are required for the two active MVP feeds. Optional names are documented in `.env.example`; values must be supplied by the deployment environment and must never be committed.

## Known limitations

- Coverage is not globally comprehensive: cyclone coverage is limited to Atlantic and East/Central Pacific NHC feeds.
- Events use an in-memory cache; each horizontally scaled process refreshes independently and data is not persisted.
- Weather, official news, markets, AI summaries, Fear & Greed, wildfire, conflict, and computed global metrics show explicit unavailable, disabled, not-computed, or integration-pending states.
- NHC marks itself degraded when any configured basin feed or item cannot be normalized; valid basin results remain available.
- Source data is informational and must not be used as emergency, financial, medical, or security advice.

## Deployment command

```bash
cd /home/chela-x/atlas-platform/apps/web && npm ci && npm run build && npm start
```

## Files created

- `apps/web/src/lib/security/external-url.mjs`
- `apps/web/src/lib/security/external-url.d.ts`
- `apps/web/tests/external-url.test.mjs`
- `docs/ATLAS-MVP-DEPLOYMENT-REPORT.md`

## Files modified

- Deployment configuration and instructions: `apps/web/.env.example`, `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/README.md`
- Public and dashboard truthfulness: public layout/page, dashboard, news and weather pages, map link handling
- API and data hub: requested API routes, query validation, source registry/fetchers, normalizers, validation, news and GeoJSON helpers
- Tests: real-data contracts and external URL validation
