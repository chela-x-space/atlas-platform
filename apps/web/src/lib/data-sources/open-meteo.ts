import { getActiveDataSource } from "@/config/data-sources";
import { fetchJson, } from "@/lib/http/fetch-json";
import type { AtlasWeatherSnapshot } from "@/types/atlas-data";

const FIELDS = ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "precipitation", "rain", "weather_code", "cloud_cover", "pressure_msl", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"] as const;
type Current = Record<(typeof FIELDS)[number], number> & { time: string };
type Payload = { latitude: number; longitude: number; timezone: string; current: Current };
export function parseCoordinate(value: string | null, kind: "latitude" | "longitude"): number | null {
  if (value === null || value.trim() === "") return null;
  const number = Number(value); const limit = kind === "latitude" ? 90 : 180;
  return Number.isFinite(number) && number >= -limit && number <= limit ? number : null;
}
function isPayload(value: unknown): value is Payload {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Payload>;
  return typeof item.latitude === "number" && typeof item.longitude === "number" && !!item.current && typeof item.current.time === "string" && FIELDS.every((field) => typeof item.current?.[field] === "number");
}
export async function getWeather(latitude: number, longitude: number): Promise<{ snapshot: AtlasWeatherSnapshot; fetchedAt: string; attribution: string }> {
  const source = getActiveDataSource("open-meteo");
  const apiKey = process.env.OPEN_METEO_API_KEY;
  const url = new URL(apiKey ? source.endpoints.customerForecast : source.endpoints.forecast);
  url.searchParams.set("latitude", String(latitude)); url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", FIELDS.join(",")); url.searchParams.set("timezone", "UTC");
  if (apiKey) url.searchParams.set("apikey", apiKey);
  const { data, fetchedAt } = await fetchJson(url.toString(), { timeoutMs: 8000, maxBytes: 200_000, revalidate: source.refreshSeconds, validate: isPayload });
  const c = data.current;
  const observedAt = new Date(`${c.time}${/[zZ]|[+-]\d\d:\d\d$/.test(c.time) ? "" : "Z"}`).toISOString();
  const publicSourceUrl = new URL(url); publicSourceUrl.searchParams.delete("apikey");
  return { fetchedAt, attribution: source.attribution, snapshot: { location: `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)} (${data.timezone})`, coordinates: [data.longitude, data.latitude], observedAt, temperatureCelsius: c.temperature_2m, apparentTemperatureCelsius: c.apparent_temperature, humidityPercent: c.relative_humidity_2m, precipitationMillimeters: c.precipitation, weatherCode: c.weather_code, cloudCoverPercent: c.cloud_cover, pressureHpa: c.pressure_msl, windSpeedKph: c.wind_speed_10m, windDirectionDegrees: c.wind_direction_10m, windGustKph: c.wind_gusts_10m, sourceId: source.id, sourceUrl: publicSourceUrl.toString() } };
}
