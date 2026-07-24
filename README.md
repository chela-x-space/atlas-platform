# ATLAS Platform

ATLAS is a deterministic global intelligence platform built from verified, attributable provider
data. Production modules include the Dashboard, News Center, Source Center, Global Timeline, Event
Detail, Event Graph, Global Metrics, Global Sentiment, AI Technology Radar, and Breaking News
Center.

## Breaking News Center

`/app/breaking` presents current verified events from existing ATLAS providers. Priority is computed
with published deterministic rules; headlines, dates, locations, source links, and provider state
remain unchanged from canonical inputs. ATLAS does not generate news or infer missing events.

APIs: `/api/breaking`, `/api/breaking/latest`, and `/api/breaking/providers`.

## Development validation

From `apps/web` run:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```
