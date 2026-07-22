export type AtlasEventCategory = "earthquake" | "cyclone" | "weather" | "space" | "technology" | "news" | "health" | "wildfire" | "flood" | "volcano" | "conflict" | "aviation" | "marine" | "market" | "cyber" | "energy" | "unknown";
export type AtlasSeverity = "info" | "low" | "moderate" | "high" | "critical" | "unknown";
export type AtlasSourceHealthStatus = "healthy" | "degraded" | "unavailable" | "disabled";
export type AtlasSourceErrorCode = "TIMEOUT" | "HTTP_ERROR" | "INVALID_CONTENT_TYPE" | "RESPONSE_TOO_LARGE" | "INVALID_PAYLOAD" | "AUTH_REQUIRED" | "DISABLED" | "UNKNOWN";
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

/** WGS84 coordinates. Ordering is explicit: longitude, then latitude. */
export type AtlasCoordinates = { readonly longitude: number; readonly latitude: number; readonly altitudeMeters?: number; readonly depthKilometers?: number };
export type AtlasEvent = {
  readonly id: string; readonly fingerprint: string; readonly category: AtlasEventCategory; readonly type: string;
  readonly title: string; readonly summary: string; readonly severity: AtlasSeverity; readonly status: string;
  readonly occurredAt: string; readonly updatedAt: string; readonly ingestedAt: string; readonly expiresAt?: string;
  readonly sourceId: string; readonly sourceName: string; readonly sourceUrl?: string; readonly sourceItemId?: string;
  readonly coordinates?: AtlasCoordinates; readonly countryCode?: string; readonly region?: string;
  readonly tags: readonly string[]; readonly metadata: Readonly<Record<string, JsonValue>>; readonly attribution: string; readonly rawReference?: string;
};
export type AtlasEventSourceHealth = { readonly sourceId: string; readonly status: AtlasSourceHealthStatus; readonly checkedAt: string; readonly responseTimeMs?: number; readonly itemCount?: number; readonly errorCode?: AtlasSourceErrorCode; readonly message?: string };
export type AtlasEventSort = "occurredAt:desc" | "occurredAt:asc" | "updatedAt:desc" | "severity:desc";
export type AtlasEventQuery = { readonly categories?: readonly AtlasEventCategory[]; readonly severities?: readonly AtlasSeverity[]; readonly sourceIds?: readonly string[]; readonly search?: string; readonly occurredAfter?: string; readonly occurredBefore?: string; readonly latitude?: number; readonly longitude?: number; readonly radiusKilometers?: number; readonly limit?: number; readonly cursor?: string; readonly sort?: AtlasEventSort };
export type AtlasEventPage = { readonly events: readonly AtlasEvent[]; readonly nextCursor?: string; readonly total?: number; readonly generatedAt: string; readonly sourceHealth: readonly AtlasEventSourceHealth[] };
export type AtlasMetric = { readonly status: "available"; readonly value: number; readonly unit: string; readonly sourceIds: readonly string[] } | { readonly status: "unavailable" | "not-computed" | "integration-pending"; readonly reason: string };
export type AtlasDashboardSnapshot = { readonly generatedAt: string; readonly metrics: Readonly<Record<string, AtlasMetric>>; readonly strongestEarthquake: AtlasEvent | null; readonly recentEarthquakes: readonly AtlasEvent[]; readonly activeCyclones: readonly AtlasEvent[]; readonly timelineEvents: readonly AtlasEvent[]; readonly technologyNews: readonly AtlasEvent[]; readonly breakingItems: readonly AtlasEvent[]; readonly sourceHealth: readonly AtlasEventSourceHealth[]; readonly unavailableMetrics: readonly string[] };
export type AtlasNewsItem = { id:string;title:string;summary:string;publishedAt:string;sourceId:string;sourceName:string;sourceUrl?:string;category:string;imageUrl?:string;author?:string;language?:string };

// Legacy weather contract retained for the coordinate-inspection endpoint.
export type AtlasWeatherSnapshot = { location: string; coordinates: [longitude: number, latitude: number]; observedAt: string; temperatureCelsius: number; apparentTemperatureCelsius: number; humidityPercent: number; precipitationMillimeters: number; weatherCode: number; cloudCoverPercent: number; pressureHpa: number; windSpeedKph: number; windDirectionDegrees: number; windGustKph: number; sourceId: string; sourceUrl: string };
