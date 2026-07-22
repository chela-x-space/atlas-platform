export type AtlasSeverity = "info" | "low" | "moderate" | "high" | "critical" | "unknown";

export type AtlasEvent = {
  id: string;
  category: string;
  title: string;
  summary: string;
  severity: AtlasSeverity;
  occurredAt: string;
  updatedAt: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  coordinates?: [longitude: number, latitude: number];
  altitudeMeters?: number;
  depthKilometers?: number;
  metadata: Record<string, unknown>;
  rawReference?: string;
};

export type AtlasNewsItem = {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  category: string;
  imageUrl?: string;
  author?: string;
  language?: string;
};

export type AtlasWeatherSnapshot = {
  location: string;
  coordinates: [longitude: number, latitude: number];
  observedAt: string;
  temperatureCelsius: number;
  apparentTemperatureCelsius: number;
  humidityPercent: number;
  precipitationMillimeters: number;
  weatherCode: number;
  cloudCoverPercent: number;
  pressureHpa: number;
  windSpeedKph: number;
  windDirectionDegrees: number;
  windGustKph: number;
  sourceId: string;
  sourceUrl: string;
};
