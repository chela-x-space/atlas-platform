export const MENU_ROUTES = Object.freeze({
  "Global Overview": "/app",
  "Intelligence Search": "/app/search",
  "Knowledge Graph": "/app/entities",
  Watchlists: "/app/watchlists",
  Alerts: "/app/alerts",
  Notifications: "/app/notifications",
  "World Map": "/app/map",
  "Global Risk": "/app/risk",
  "Global Metrics": "/app/metrics",
  "Source Sentiment": "/app/sentiment",
  "Global Timeline": "/app/timeline",
  "Breaking News": "/app/breaking",
  Earthquake: "/app/earthquake",
  "Weather & Climate": "/app/weather",
  "Economy & Markets": "/app/markets",
  "AI & Technology": "/app/ai",
  "Source Center": "/app/sources",
  Reports: "/app/reports",
  Marketplace: "/marketplace",
  Settings: "/app/settings",
  "About Atlas": "/about",
});

export const SEVERITY_RANK = Object.freeze({
  critical: 5,
  high: 4,
  moderate: 3,
  low: 2,
  info: 1,
  unknown: 0,
});

export const SITUATION_LEVELS = Object.freeze([
  Object.freeze({ key: "critical", label: "Critical", severities: Object.freeze(["critical"]) }),
  Object.freeze({ key: "high-impact", label: "High Impact", severities: Object.freeze(["high"]) }),
  Object.freeze({ key: "regional", label: "Regional", severities: Object.freeze(["moderate"]) }),
  Object.freeze({ key: "monitoring", label: "Monitoring", severities: Object.freeze(["low", "info", "unknown"]) }),
]);

function confirmationRank(event) {
  if (event?.metadata?.officialConfirmed === true) return 2;
  const confidence = event?.metadata?.sourceConfidence;
  return typeof confidence === "number" && Number.isFinite(confidence) ? confidence : 0;
}

export function compareDashboardEvents(left, right) {
  const severityDifference = (SEVERITY_RANK[right?.severity] ?? 0) - (SEVERITY_RANK[left?.severity] ?? 0);
  if (severityDifference) return severityDifference;
  const confirmationDifference = confirmationRank(right) - confirmationRank(left);
  if (confirmationDifference) return confirmationDifference;
  const recencyDifference = (Date.parse(right?.occurredAt) || 0) - (Date.parse(left?.occurredAt) || 0);
  if (recencyDifference) return recencyDifference;
  return String(left?.id ?? "").localeCompare(String(right?.id ?? ""));
}

export function rankDashboardEvents(events) {
  return [...events].sort(compareDashboardEvents);
}

export function situationCounts(events) {
  return SITUATION_LEVELS.map((level) => ({
    ...level,
    count: events.filter((event) => level.severities.includes(event.severity)).length,
  }));
}

export function hotRegions(events) {
  const regions = new Map();
  for (const event of events) {
    const name = typeof event.region === "string" ? event.region.trim() : "";
    if (!name) continue;
    const current = regions.get(name) ?? { name, count: 0, highestSeverity: "unknown" };
    current.count += 1;
    if ((SEVERITY_RANK[event.severity] ?? 0) > (SEVERITY_RANK[current.highestSeverity] ?? 0)) {
      current.highestSeverity = event.severity;
    }
    regions.set(name, current);
  }
  return [...regions.values()].sort((left, right) =>
    right.count - left.count ||
    (SEVERITY_RANK[right.highestSeverity] ?? 0) - (SEVERITY_RANK[left.highestSeverity] ?? 0) ||
    left.name.localeCompare(right.name),
  );
}

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
