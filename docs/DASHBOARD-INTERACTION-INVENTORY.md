# Dashboard Interaction Inventory

Scope: the approved `/app` dashboard in `apps/web`. “Live” below applies only to the USGS earthquake map; other visible figures and story cards are clearly treated as presentation/sample content until their documented integrations exist.

| Component / file | Visible control | Expected behavior | Previous behavior | Status | Test coverage |
|---|---|---|---|---|---|
| `AtlasSidebar.tsx` | All sidebar menu items | Navigate when a route exists; otherwise explain the missing integration | Routes worked for a subset; unsupported items showed a fake selection toast | Implemented | `dashboard-logic.test.mjs` route cases |
| `AtlasSidebar.tsx` | App Store / Google Play | Open configured public URL or be visibly disabled | Silent buttons | Implemented; disabled until env URLs exist | Manual accessibility inspection |
| `AtlasSidebar.tsx` | Social icons | Open configured public URL or be visibly disabled | Silent buttons | Implemented; disabled until env URLs exist | Manual accessibility inspection |
| `AtlasDashboard.tsx` | Search input, Enter, `/` shortcut | Filter the visible timeline; Enter announces count; `/` focuses search | Filtered as typed, but Enter produced a misleading “searching” toast and `/` did nothing | Implemented | `dashboard-logic.test.mjs` filtering |
| `AtlasDashboard.tsx` | English / ไทย | Toggle a small supported dictionary of visible header/map/timeline labels | Only the language name changed | Implemented | Manual UI check |
| `AtlasDashboard.tsx` | System status icon | Open an honest system-status panel | Toast only | Implemented | Dialog contract test |
| `AtlasDashboard.tsx` | Notification icon | Open notification/integration panel | Toast only | Implemented | Dialog contract test |
| `AtlasDashboard.tsx` | Share | Native share, clipboard, then safe copy dialog fallback | Fake “prepared” toast | Implemented | Manual browser API check |
| `AtlasDashboard.tsx` | Login | Navigate to `/login` | Working | Implemented | Route inspection |
| `AtlasDashboard.tsx`, `AtlasMap.tsx` | Map layer chips | Show/hide actual earthquake MapLibre layers; explain unavailable feeds | Set state and toast; visibility could be lost before map load | Implemented | Layer visibility unit test |
| `AtlasMap.tsx` | 24H / 7D / 30D | Fetch corresponding USGS day/week/month feed | Working | Implemented | Feed mapping unit test |
| `AtlasMap.tsx` | Map drag / wheel / built-in zoom and compass | Native MapLibre navigation | Present | Implemented | Manual MapLibre check |
| `AtlasMap.tsx` | Globe, +, −, Compass, Reset | Change projection, zoom, north bearing, and initial view | Globe/zoom/reset worked; no labeled custom compass | Implemented | Manual MapLibre check |
| `AtlasMap.tsx` | Earthquake clusters and points | Expand clusters; point popup shows magnitude, location, local time, depth | Implemented | Implemented | Manual MapLibre check |
| `AtlasMap.tsx` | Retry on feed error | Retry the selected USGS range | Error had no action | Implemented | API fallback contract test |
| `AtlasDashboard.tsx` | Timeline cards | Open event detail panel | Toast only | Implemented | Dialog contract test |
| `AtlasDashboard.tsx` | View Full Report | Open an honest report panel | Fake success toast | Implemented; live report blocked | Dialog contract test |
| `AtlasDashboard.tsx` | Earthquake View All | Navigate to `/app/earthquake` | Working | Implemented | Route inspection |
| `AtlasDashboard.tsx` | Earthquake list rows | Open details and identify sample status | Toast only | Implemented | Dialog contract test |
| `AtlasDashboard.tsx` | Market tabs | Switch the visible dataset | Active tab changed but rows did not | Implemented | Market dataset unit test |
| `AtlasDashboard.tsx` | AI news rows | Open detail/unavailable panel without fabricating an article | Toast only | Implemented | Dialog contract test |
| `DashboardModal.tsx` | Close, backdrop, Escape | Close the active panel and restore focus | Close/backdrop only | Implemented | Dialog contract test |

## Missing integration contracts

- Unsupported monitoring modules need a read-only events endpoint returning sourced GeoJSON or JSON with stable IDs, timestamps, titles, locations, source URLs, coordinates, category, and severity. Layer endpoints must use WGS84 longitude/latitude and declare freshness/error metadata.
- Notifications need an authenticated notification endpoint returning ID, title, timestamp, read state, severity, and a valid internal target. No notification persistence is simulated.
- AI reports need a report endpoint returning generated-at time, source citations, sections, confidence/limitations, and provenance. The current summary remains presentation content and is not represented as generated live intelligence.
- News/detail cards need a licensed news provider returning stable story IDs, timestamps, publisher/source URLs, and summaries. No fake article route is created.
- Mobile/social destinations are configured through `NEXT_PUBLIC_APP_STORE_URL`, `NEXT_PUBLIC_GOOGLE_PLAY_URL`, `NEXT_PUBLIC_X_URL`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_YOUTUBE_URL`, `NEXT_PUBLIC_INSTAGRAM_URL`, and `NEXT_PUBLIC_THREADS_URL`. Missing values deliberately render disabled controls with accessible explanations.
