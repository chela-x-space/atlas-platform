export const MAP_LAYERS = Object.freeze([
  "earthquake", "volcano", "weather", "disaster", "conflict", "economy", "ai",
  "cyber", "aviation", "marine", "space", "energy", "health",
]);

export const MAP_PRIORITIES = Object.freeze(["critical", "high", "medium", "information"]);

export const PRIORITY_COLORS = Object.freeze({
  critical: "#ff4152",
  high: "#f4814b",
  medium: "#e8b849",
  information: "#4caad5",
});

const PRIORITY_SIZE = Object.freeze({ critical: 1.35, high: 1.15, medium: 1, information: 0.85 });

export function validCoordinates(event) {
  return Number.isFinite(event?.longitude) && Number.isFinite(event?.latitude) &&
    event.longitude >= -180 && event.longitude <= 180 &&
    event.latitude >= -90 && event.latitude <= 90;
}

export function markerSize(event) {
  if (event.category === "earthquake" && Number.isFinite(event?.magnitude)) {
    return Math.max(0.75, Math.min(1.65, event.magnitude / 5));
  }
  return PRIORITY_SIZE[event.priority] ?? PRIORITY_SIZE.information;
}

export function normalizeMapEvent(event) {
  if (!event || event.verified !== true || !validCoordinates(event) || !MAP_LAYERS.includes(event.category)) return null;
  return {
    ...event,
    markerSize: markerSize({
      ...event,
      magnitude: typeof event.magnitude === "number" ? event.magnitude : event.provenance?.magnitude,
    }),
  };
}

export function filterMapEvents(events, filters) {
  const country = filters.country.trim().toLowerCase();
  const provider = filters.provider.trim().toLowerCase();
  const category = filters.category;
  const from = filters.from ? Date.parse(`${filters.from}T00:00:00.000Z`) : null;
  const to = filters.to ? Date.parse(`${filters.to}T23:59:59.999Z`) : null;
  return events.filter((event) => {
    if (!filters.layers.includes(event.category)) return false;
    if (category && event.category !== category) return false;
    if (filters.priority && event.priority !== filters.priority) return false;
    if (country && !`${event.country ?? ""} ${event.region ?? ""}`.toLowerCase().includes(country)) return false;
    if (provider && !`${event.providerId} ${event.providerName}`.toLowerCase().includes(provider)) return false;
    const published = Date.parse(event.publishedAt);
    if (from !== null && published < from) return false;
    if (to !== null && published > to) return false;
    return true;
  });
}

export function eventsToGeoJson(events) {
  return {
    type: "FeatureCollection",
    features: events.map((event) => ({
      type: "Feature",
      id: event.canonicalId,
      geometry: { type: "Point", coordinates: [event.longitude, event.latitude] },
      properties: {
        canonicalId: event.canonicalId,
        category: event.category,
        priority: event.priority,
        markerSize: event.markerSize,
        pulse: event.priority === "critical" ? 1 : 0,
      },
    })),
  };
}

export function clusterExpansionTarget(currentZoom, expansionZoom) {
  return Math.max(currentZoom + 1, expansionZoom);
}

export function currentFilterCount(filters) {
  return (filters.layers.length !== MAP_LAYERS.length ? 1 : 0) +
    ["country", "provider", "category", "from", "to", "priority"].filter((key) => Boolean(filters[key])).length;
}
