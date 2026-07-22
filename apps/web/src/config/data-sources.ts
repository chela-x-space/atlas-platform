export type AtlasDataSourceStatus = "active" | "disabled" | "planned" | "unavailable";
export type AtlasDataSource = {
  id: string; name: string; organization: string;
  category: "earthquake" | "weather" | "cyclone" | "news" | "space" | "health" | "air-quality" | "aviation";
  status: AtlasDataSourceStatus; documentationUrl: string;
  endpoints: Readonly<Record<string, string>>; requiresApiKey: boolean;
  environmentVariable?: string; attribution: string; licenseOrTermsUrl?: string;
  refreshSeconds: number; enabledByDefault: boolean; notes?: string;
};

export const DATA_SOURCES = [
  { id: "usgs-earthquakes", name: "USGS Earthquake Hazards Program", organization: "U.S. Geological Survey", category: "earthquake", status: "active", documentationUrl: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php", endpoints: { "24h": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson", "7d": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson", "30d": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson" }, requiresApiKey: false, attribution: "Earthquake data courtesy of the U.S. Geological Survey", licenseOrTermsUrl: "https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits", refreshSeconds: 60, enabledByDefault: true },
  { id: "open-meteo", name: "Open-Meteo Forecast API", organization: "Open-Meteo", category: "weather", status: "active", documentationUrl: "https://open-meteo.com/en/docs", endpoints: { forecast: "https://api.open-meteo.com/v1/forecast", geocoding: "https://geocoding-api.open-meteo.com/v1/search" }, requiresApiKey: false, attribution: "Weather data by Open-Meteo", licenseOrTermsUrl: "https://open-meteo.com/en/terms", refreshSeconds: 900, enabledByDefault: true },
  { id: "jpl-news", name: "JPL News", organization: "NASA Jet Propulsion Laboratory", category: "space", status: "active", documentationUrl: "https://www.jpl.nasa.gov/rss/", endpoints: { feed: "https://www.jpl.nasa.gov/feeds/news/" }, requiresApiKey: false, attribution: "NASA/JPL", licenseOrTermsUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/", refreshSeconds: 900, enabledByDefault: true },
  { id: "cneos-news", name: "CNEOS News", organization: "NASA/JPL Center for Near Earth Object Studies", category: "space", status: "active", documentationUrl: "https://cneos.jpl.nasa.gov/", endpoints: { feed: "https://cneos.jpl.nasa.gov/feed/news.xml" }, requiresApiKey: false, attribution: "NASA/JPL CNEOS", licenseOrTermsUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/", refreshSeconds: 1800, enabledByDefault: true },
  { id: "noaa-nhc", name: "NHC/CPHC Tropical Cyclones", organization: "NOAA National Hurricane Center", category: "cyclone", status: "active", documentationUrl: "https://www.nhc.noaa.gov/aboutrss.shtml", endpoints: { atlantic: "https://www.nhc.noaa.gov/gis-at.xml", easternPacific: "https://www.nhc.noaa.gov/gis-ep.xml", centralPacific: "https://www.nhc.noaa.gov/gis-cp.xml" }, requiresApiKey: false, attribution: "NOAA/National Hurricane Center", licenseOrTermsUrl: "https://www.weather.gov/disclaimer", refreshSeconds: 300, enabledByDefault: true, notes: "Experimental GIS feeds; not for life-threatening decisions." },
  { id: "who-emergencies", name: "WHO Disease Outbreak News", organization: "World Health Organization", category: "health", status: "planned", documentationUrl: "https://www.who.int/api/emergencies/diseaseoutbreaknews/sfhelp", endpoints: {}, requiresApiKey: false, attribution: "World Health Organization", licenseOrTermsUrl: "https://www.who.int/about/policies/publishing/copyright", refreshSeconds: 3600, enabledByDefault: false, notes: "An official Sitefinity API is documented, but its stable query/pagination contract has not yet been validated for ATLAS." },
  { id: "openaq-v3", name: "OpenAQ API v3", organization: "OpenAQ", category: "air-quality", status: "disabled", documentationUrl: "https://docs.openaq.org/api", endpoints: { api: "https://api.openaq.org/v3" }, requiresApiKey: true, environmentVariable: "OPENAQ_API_KEY", attribution: "OpenAQ", licenseOrTermsUrl: "https://docs.openaq.org/about/terms", refreshSeconds: 900, enabledByDefault: false, notes: "Disabled until a v3 X-API-Key is configured." },
  { id: "opensky", name: "OpenSky Network API", organization: "The OpenSky Network", category: "aviation", status: "disabled", documentationUrl: "https://openskynetwork.github.io/opensky-api/index.html", endpoints: { api: "https://opensky-network.org/api" }, requiresApiKey: true, environmentVariable: "OPENSKY_CLIENT_ID", attribution: "The OpenSky Network", licenseOrTermsUrl: "https://opensky-network.org/about/terms-of-use", refreshSeconds: 30, enabledByDefault: false, notes: "Disabled pending OAuth2 credentials and confirmation that usage terms fit deployment." },
] as const satisfies readonly AtlasDataSource[];

export function getDataSource(id: string): AtlasDataSource | undefined { return DATA_SOURCES.find((source) => source.id === id); }
export function getActiveDataSource(id: string): AtlasDataSource {
  const source = getDataSource(id);
  if (!source || source.status !== "active" || !source.enabledByDefault) throw new Error(`Data source ${id} is not active`);
  return source;
}
export function isDataSourceFetchable(source: AtlasDataSource): boolean {
  return source.status === "active" && source.enabledByDefault && Object.keys(source.endpoints).length > 0;
}
