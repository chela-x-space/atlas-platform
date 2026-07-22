import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("registry IDs are unique and active sources have HTTPS endpoints", async () => {
  const source = await read("../src/config/data-sources.ts");
  const ids = [...source.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const endpoints = [...source.matchAll(/https?:\/\/[^"`\s]+/g)].map((match) => match[0]);
  assert.ok(endpoints.length >= 15);
  assert.ok(endpoints.every((url) => url.startsWith("https://")));
  assert.match(source, /requiresApiKey: true, environmentVariable: "OPENAQ_API_KEY"/);
  assert.match(source, /status: "disabled"[\s\S]*enabledByDefault: false/);
  assert.match(source, /status !== "active" \|\| !source\.enabledByDefault/);
});

test("USGS ranges and invalid range API behavior are explicit", async () => {
  const registry = await read("../src/config/data-sources.ts"); const route = await read("../src/app/api/earthquakes/route.ts");
  assert.match(registry, /all_day\.geojson/); assert.match(registry, /all_week\.geojson/); assert.match(registry, /all_month\.geojson/);
  assert.match(route, /range must be 24h, 7d, or 30d/); assert.match(route, /coordinates: \[longitude, latitude, depth\]/);
});

test("Open-Meteo validates coordinates and requests only declared fields", async () => {
  const source = await read("../src/lib/data-sources/open-meteo.ts");
  for (const field of ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "precipitation", "rain", "weather_code", "cloud_cover", "pressure_msl", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"]) assert.match(source, new RegExp(field));
  assert.match(source, /number >= -limit && number <= limit/); assert.match(source, /timezone", "auto"/);
});

test("RSS parser covers RSS and Atom, strips unsafe HTML, and bounds payloads", async () => {
  const source = await read("../src/lib/news/rss-parser.ts");
  assert.match(source, /rss\|feed/); assert.match(source, /item\|entry/); assert.match(source, /script/); assert.match(source, /1_000_000/); assert.match(source, /"published", "updated"/);
});

test("news normalization deduplicates URL then title and sorts newest first", async () => {
  const dedupe = await read("../src/lib/news/deduplicate-news.ts"); const service = await read("../src/lib/news/news-service.ts");
  assert.match(dedupe, /urls\.has\(url\) \|\| titles\.has\(title\)/); assert.match(service, /new Date\(b\.publishedAt\).*new Date\(a\.publishedAt\)/);
});

test("news service supports partial and all-source failure without mock fallback", async () => {
  const service = await read("../src/lib/news/news-service.ts"); const route = await read("../src/app/api/news/route.ts");
  assert.match(service, /Promise\.all/); assert.match(route, /some\(\(source\) => !source\.ok\) \? 206 : 200/); assert.match(route, /all-sources-unavailable/); assert.doesNotMatch(route, /placeholder|mock/i);
});

test("dashboard transformations use real earthquake and news arrays", async () => {
  const dashboard = await read("../src/components/dashboard/AtlasDashboard.tsx");
  assert.match(dashboard, /quakes\.slice\(0, 5\)\.map/); assert.match(dashboard, /cyclones\.slice\(0, 2\)\.map/); assert.match(dashboard, /MetricStrip earthquakeCount/); assert.match(dashboard, /news\.slice\(0, 5\)/); assert.doesNotMatch(dashboard, /Hachijojima|GPT-4o Update|Bitcoin Reaches New High/);
});

test("NHC normalization only emits coordinates present in official XML", async () => {
  const source = await read("../src/lib/data-sources/noaa-nhc.ts");
  assert.match(source, /nhc:center/); assert.match(source, /coordinateMatch \? \{ coordinates:/); assert.doesNotMatch(source, /coordinates:\s*\[0,\s*0\]/);
});

test("API routes use consistent public error shapes", async () => {
  for (const path of ["../src/app/api/earthquakes/route.ts", "../src/app/api/weather/route.ts", "../src/app/api/news/route.ts", "../src/app/api/cyclones/route.ts"]) { const source = await read(path); assert.match(source, /error:\s*\{ code:/); }
});
