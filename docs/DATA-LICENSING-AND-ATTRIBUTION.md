# Data Licensing and Attribution

Free access does not mean unrestricted use. Deployers must re-check official terms, quotas, attribution rules, and branding guidance before production use.

- USGS: credit “U.S. Geological Survey”; see https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits. Item popups/cards link to USGS.
- Open-Meteo: credit “Weather data by Open-Meteo”; see https://open-meteo.com/en/terms. Attribution and the exact request URL are returned with every snapshot.
- NASA/JPL/CNEOS: credit the named NASA/JPL source and preserve original item links. NASA media/brand guidance: https://www.nasa.gov/nasa-brand-center/images-and-media/. NASA endorsement must not be implied.
- NASA RSS: credit “National Aeronautics and Space Administration (NASA)” and preserve the canonical NASA item link. ATLAS stores only title, timestamp, feed metadata and a bounded source excerpt; it mirrors no media or article bodies.
- ESA RSS: credit “European Space Agency (ESA)” and preserve the canonical ESA item link. ESA copyright applies; ATLAS stores metadata and a bounded feed excerpt only.
- ReliefWeb API v2: credit “ReliefWeb / UN OCHA” and the named original information partner. Partner content may be copyrighted. The provider remains `configuration_required` until `atlas.chela-x.space` is pre-approved; 1,000 calls/day and 1,000 entries/call apply.
- NOAA/NHC: credit NOAA/National Hurricane Center. Disclaimer: https://www.weather.gov/disclaimer. NHC GIS RSS is experimental and explicitly unsuitable as the sole basis for life-threatening decisions.
- WHO: copyright and licensing: https://www.who.int/about/policies/publishing/copyright. The integration remains planned; no WHO content is redistributed yet.
- OpenAQ: terms: https://docs.openaq.org/about/terms. v3 requires an API key and is disabled.
- OpenSky: terms: https://opensky-network.org/about/terms-of-use. Access can carry research/non-commercial and redistribution restrictions; aviation remains disabled pending a deployment-specific review and OAuth credentials.

Where data is active, attribution appears in API metadata and in the dashboard map, weather detail, source links, news cards, and ticker. Officially documented rate/refresh expectations are enforced by server caching; ATLAS does not run uncontrolled retries.
