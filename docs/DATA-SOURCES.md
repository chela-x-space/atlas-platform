# ATLAS Data Sources

Verified 2026-07-22. Exact machine endpoints are also held in `apps/web/src/config/data-sources.ts`, the authoritative runtime registry.

| ID | Provider | Category | Exact endpoint/feed URL | Documentation | Status | Authentication | Refresh/cache | Attribution | Limitations | Last verified |
|---|---|---|---|---|---|---|---|---|---|---|
| usgs-earthquakes | USGS | earthquake | `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`<br>`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson`<br>`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson` | https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php | active | none | 60s; SWR 300s | U.S. Geological Survey | Preliminary values may be revised. | 2026-07-22 |
| open-meteo | Open-Meteo | weather | `https://api.open-meteo.com/v1/forecast`<br>`https://geocoding-api.open-meteo.com/v1/search` | https://open-meteo.com/en/docs | active | none for non-commercial open access | 900s; SWR 1800s | Weather data by Open-Meteo | Coordinate snapshot; no global raster layer. | 2026-07-22 |
| jpl-news | NASA/JPL | space/news | `https://www.jpl.nasa.gov/feeds/news/` | https://www.jpl.nasa.gov/rss/ | active | none | 900s; SWR 1800s | NASA/JPL | Official editorial feed; “latest” is not automatically “breaking.” | 2026-07-22 |
| cneos-news | NASA/JPL CNEOS | space/news | `https://cneos.jpl.nasa.gov/feed/news.xml` | https://cneos.jpl.nasa.gov/ | active | none | 1800s; SWR 1800s | NASA/JPL CNEOS | Feed can be infrequent. | 2026-07-22 |
| noaa-nhc | NOAA NHC/CPHC | cyclone | `https://www.nhc.noaa.gov/gis-at.xml`<br>`https://www.nhc.noaa.gov/gis-ep.xml`<br>`https://www.nhc.noaa.gov/gis-cp.xml` | https://www.nhc.noaa.gov/aboutrss.shtml | active | none | 300s; SWR 900s | NOAA/National Hurricane Center | Experimental; availability not guaranteed; not for life-threatening decisions. Empty feeds can truthfully mean no active advisories. | 2026-07-22 |
| who-emergencies | WHO | health | — | https://www.who.int/api/emergencies/diseaseoutbreaknews/sfhelp | planned | none documented | not fetched | World Health Organization | Official Sitefinity API found, but stable query, pagination, and payload validation remain to be completed. HTML is not scraped. | 2026-07-22 |
| openaq-v3 | OpenAQ | air quality | `https://api.openaq.org/v3` | https://docs.openaq.org/api | disabled | `X-API-Key` / `OPENAQ_API_KEY` | not fetched | OpenAQ | v1/v2 prohibited; disabled without key. | 2026-07-22 |
| opensky | OpenSky Network | aviation | `https://opensky-network.org/api` | https://openskynetwork.github.io/opensky-api/index.html | disabled | OAuth2 client credentials | not fetched | The OpenSky Network | Credentials and compatible terms required; anonymous access is not assumed. | 2026-07-22 |

Cache policy refers to ATLAS shared-cache max age; failures are not replaced with stale mock objects. Live response verification details are recorded during validation, not hard-coded as product data.
