export const MENU_ROUTES = Object.freeze({
  "Global Overview": "/app",
  "World Map": "/app/monitor",
  "Global Timeline": "/app/timeline",
  "Breaking News": "/app/news",
  Earthquake: "/app/earthquake",
  "Weather & Climate": "/app/weather",
  "Economy & Markets": "/app/markets",
  "AI & Technology": "/app/ai",
  "Source Center": "/app/sources",
  Settings: "/app/settings",
  "About Atlas": "/about",
});

export const EARTHQUAKE_FEEDS = Object.freeze({
  "24h": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
  "7d": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
  "30d": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",
});

export const EARTHQUAKE_LAYER_IDS = Object.freeze([
  "earthquake-clusters",
  "earthquake-cluster-count",
  "earthquake-points",
  "earthquake-pulse",
]);

export function routeForMenu(label) {
  return MENU_ROUTES[label] ?? null;
}

export function feedForRange(range) {
  return EARTHQUAKE_FEEDS[range] ?? EARTHQUAKE_FEEDS["24h"];
}

export function earthquakeLayersVisible(activeLayer) {
  return activeLayer === "All Layers" || activeLayer === "Earthquake";
}

export function filterEvents(events, query) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return events;
  return events.filter((event) =>
    event.slice(0, 3).join(" ").toLocaleLowerCase().includes(normalized),
  );
}

export function marketRowsForTab(datasets, tab) {
  return datasets[tab] ?? datasets.Indices ?? [];
}
