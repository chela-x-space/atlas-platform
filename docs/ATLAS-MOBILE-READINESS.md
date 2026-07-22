# ATLAS Mobile Readiness

## Status

**PASS — mobile service mode is ready for public deployment.**

## Root causes found

- The dashboard globally forced `html` and `body` to a minimum width of 1180px while hiding overflow, so phone viewports could neither reflow nor reach clipped content.
- A fixed 198px sidebar and fixed-height, multi-column command-center grid assumed a desktop canvas.
- Several dashboard labels and controls were 7–8px, below a practical phone reading and touch size.
- The map filled an absolutely positioned desktop panel; controls could overlap and map initialization had no explicit constructor failure state.
- The desktop ticker and dense card grids were not suitable for narrow viewports.
- The public landing page had responsive rules, but the smallest breakpoint retained a large hero, fixed visual dimensions, and a minimum document width that could create scrollbar pressure in narrow desktop-style rendering.
- Next.js supplied its default viewport, but no explicit theme color or safe-area-aware mobile chrome was configured.
- No small-screen hydration failure was found. The issue was layout architecture and resource density rather than a mobile-only data exception.

## Mobile architecture

- `/app` selects a dedicated mobile service component below 1180px; the existing desktop dashboard remains the rendering path at 1180px and above.
- Selection happens after hydration to avoid server/client markup disagreement. A small truthful loading shell is shown during detection.
- Mobile overview consumes the existing `/api/dashboard` contract and never creates substitute values.
- The view includes service status, update time, real USGS and NOAA/NHC totals, five verified events, strongest earthquake, cyclone summary, source health, attribution, limitations, and disclaimer.
- A fixed five-item bottom navigation provides Overview, Map, Events, Alerts, and More with at least 44px targets. Less important destinations are in the More panel.
- The map is collapsed by default. When requested, it has a bounded viewport, touch-capable MapLibre canvas, reduced controls, responsive popups, initialization/tile failure messaging, and the verified event list remains available as the fallback.
- `/app/earthquake` now presents a responsive list of real earthquake and cyclone records from `/api/events` instead of a placeholder page.
- `?desktop=1` provides an explicit full-dashboard override.

## Supported and tested widths

Browser checks covered 320, 360, 375, 390, and 430px portrait; 844×390 landscape; 768px tablet; and 1440px desktop. The mobile service view is used through 1179px because the preserved desktop command center has an intentional 1180px minimum canvas.

At every measured mobile/tablet size, document `scrollWidth` equaled `clientWidth`, the page was nonblank, and no JavaScript exception or console error was recorded. At 1440px the original desktop dashboard rendered without horizontal overflow.

## Routes tested

- `/`
- `/app`
- `/app/news`
- `/app/earthquake`
- `/api/events`
- `/api/dashboard`
- `/api/source-health`

The mobile map was expanded through its actual control; the MapLibre canvas initialized and the surrounding page/fallback content remained rendered.

## Viewport and accessibility

- Explicit `width=device-width`, `initial-scale=1`, dark theme color, color scheme, and `viewport-fit=cover` are configured.
- User scaling is not disabled and no maximum scale is imposed.
- Safe-area insets are applied to the sticky header and bottom navigation.
- Mobile controls do not depend on hover, critical text wraps, raw URLs are not displayed, and source/timestamp information remains visible.

## Known limitations

- Mobile map tiles still depend on the external MapLibre demo style; when tiles fail, the verified list remains usable.
- The mobile map currently visualizes USGS earthquakes only. Cyclones remain available in summaries and the event list.
- Alerts, news, weather, markets, and unsupported computed metrics retain their truthful pending, disabled, or unavailable status.
- The full desktop override intentionally preserves the 1180px desktop canvas and is not optimized for phone interaction.

## Future PWA work

Deferred by scope: web app manifest, install prompts, service worker strategy, offline event snapshots, background synchronization, and push notifications. These should be considered only after cache/licensing and alert-delivery policies are defined.

## Validation results

- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test` — PASS (including mobile service contracts)
- `npm run build` — PASS
- Production browser viewport and route checks — PASS
- Production API smoke checks — PASS
