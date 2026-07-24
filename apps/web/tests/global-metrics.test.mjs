import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  activityStatusForValue,
  calculateMetricsSnapshot,
  filterMetricsSnapshot,
  parseMetricsQuery,
} from "../src/lib/metrics/metrics-logic.mjs";

const generatedAt = "2026-07-24T12:00:00.000Z";

function item(overrides = {}) {
  return {
    id: "timeline:event:fixture",
    itemType: "event",
    title: "Fixture",
    summary: "Verified fixture",
    category: "earthquake",
    sourceId: "usgs-earthquakes",
    sourceName: "USGS",
    sourceUrl: "https://example.test/item",
    occurredAt: "2026-07-24T11:30:00.000Z",
    updatedAt: "2026-07-24T11:35:00.000Z",
    ingestedAt: "2026-07-24T11:36:00.000Z",
    location: "Fixture region",
    countries: [],
    coordinates: null,
    severity: "moderate",
    status: "active",
    verificationStatus: "verified",
    attribution: "Fixture",
    stale: false,
    relatedEventId: "event-fixture",
    relatedReportId: null,
    metadata: { magnitude: 4.5, sourceRecordId: "fixture" },
    ...overrides,
  };
}

function health(overrides = {}) {
  const base = [
    ["usgs-earthquakes", "USGS"],
    ["noaa-nhc", "NOAA/NHC"],
    ["nasa-rss", "NASA"],
    ["esa-rss", "ESA"],
  ];
  return base.map(([sourceId, sourceName]) => ({
    sourceId, sourceName, status: "online", stale: false, itemCount: 0,
    checkedAt: generatedAt, errorCode: null, errorMessage: null, ...overrides[sourceId],
  }));
}

function graph(overrides = {}) {
  return {
    nodes: [
      { id: "event", nodeType: "event" },
      { id: "source", nodeType: "source" },
      { id: "location", nodeType: "location" },
    ],
    edges: [{ id: "edge", edgeType: "located_in" }],
    generatedAt, graphVersion: "atlas-event-graph-v1", partial: false,
    sourceHealth: health(), ...overrides,
  };
}

function snapshot(items, sourceHealth = health(), graphValue = graph()) {
  return calculateMetricsSnapshot({ items, sourceHealth, graph: graphValue, generatedAt });
}

function metric(result, id) {
  return result.metrics.find((candidate) => candidate.id === id);
}

test("identical input and injected generatedAt produce identical stable output", () => {
  const inputs = [item(), item({ id: "report", itemType: "report", sourceId: "nasa-rss", sourceName: "NASA", category: "space", relatedEventId: null, relatedReportId: "report", metadata: {} })];
  assert.deepEqual(snapshot(inputs), snapshot([...inputs].reverse()));
  assert.deepEqual(snapshot(inputs).metrics.map(({ id }) => id), [...snapshot(inputs).metrics.map(({ id }) => id)].sort());
  assert.deepEqual(snapshot(inputs).activityIndex.components.map(({ id }) => id), ["earth-activity", "cyclone-activity", "space-activity"]);
});

test("inclusive 1h, 24h, and 7d boundaries use the one injected timestamp", () => {
  const inputs = [
    item({ id: "one-hour", occurredAt: "2026-07-24T11:00:00.000Z" }),
    item({ id: "one-hour-before", occurredAt: "2026-07-24T10:59:59.999Z" }),
    item({ id: "one-day", occurredAt: "2026-07-23T12:00:00.000Z" }),
    item({ id: "one-day-before", occurredAt: "2026-07-23T11:59:59.999Z" }),
    item({ id: "seven-days", occurredAt: "2026-07-17T12:00:00.000Z" }),
    item({ id: "future", occurredAt: "2026-07-24T12:00:00.001Z" }),
  ];
  const result = snapshot(inputs);
  assert.equal(metric(result, "global-events-1h").value, 1);
  assert.equal(metric(result, "global-events-24h").value, 3);
  assert.equal(metric(result, "global-events-7d").value, 5);
  assert.equal(result.inputSummary.windowBoundaries["24h"], "2026-07-23T12:00:00.000Z");
});

test("magnitude bands, invalid magnitude handling, and severity points are exact", () => {
  const magnitudes = [3.9, 4, 5, 6, 7, null, Number.NaN];
  const result = snapshot(magnitudes.map((magnitude, index) => item({
    id: `quake-${index}`,
    metadata: magnitude === null ? {} : { magnitude },
  })));
  assert.equal(metric(result, "earthquakes-24h").value, 7);
  assert.equal(metric(result, "earthquakes-magnitude-4-plus-24h").value, 4);
  assert.equal(metric(result, "earthquakes-magnitude-5-plus-24h").value, 3);
  assert.equal(metric(result, "earthquakes-magnitude-6-plus-24h").value, 2);
  assert.equal(metric(result, "strongest-earthquake-magnitude-24h").value, 7);
  assert.deepEqual(metric(result, "earthquakes-magnitude-4-plus-24h").breakdown, {
    below4: 1, magnitude4To4_9: 1, magnitude5To5_9: 1,
    magnitude6To6_9: 1, magnitude7Plus: 1, invalidOrMissing: 2,
  });
  const earth = result.activityIndex.components[0];
  assert.equal(earth.rawValue, 32.25);
  assert.equal(earth.normalizedValue, 32.25);
});

test("cyclone activity uses distinct active IDs and additional official updates", () => {
  const advisories = [
    item({ id: "storm-a-1", itemType: "advisory", category: "cyclone", sourceId: "noaa-nhc", sourceName: "NOAA", relatedEventId: "storm-a", metadata: {} }),
    item({ id: "storm-a-2", itemType: "advisory", category: "cyclone", sourceId: "noaa-nhc", sourceName: "NOAA", relatedEventId: "storm-a", updatedAt: "2026-07-24T11:45:00.000Z", metadata: {} }),
    item({ id: "storm-b", itemType: "advisory", category: "cyclone", sourceId: "noaa-nhc", sourceName: "NOAA", relatedEventId: "storm-b", status: "ended", metadata: {} }),
  ];
  const result = snapshot(advisories);
  assert.equal(metric(result, "active-cyclones").value, 1);
  assert.equal(metric(result, "cyclone-advisories-updated-24h").value, 3);
  const cyclone = result.activityIndex.components[1];
  assert.equal(cyclone.rawValue, 22);
  assert.equal(cyclone.breakdown.additionalUpdates, 1);
});

test("NASA and ESA report counts remain separate and contribute five points each", () => {
  const reports = [
    item({ id: "nasa", itemType: "report", category: "space", sourceId: "nasa-rss", sourceName: "NASA", relatedEventId: null, relatedReportId: "nasa", metadata: {} }),
    item({ id: "esa", itemType: "report", category: "science", sourceId: "esa-rss", sourceName: "ESA", relatedEventId: null, relatedReportId: "esa", metadata: {} }),
  ];
  const result = snapshot(reports);
  assert.equal(metric(result, "nasa-reports-24h").value, 1);
  assert.equal(metric(result, "esa-reports-24h").value, 1);
  assert.equal(metric(result, "space-science-reports-24h").value, 2);
  assert.equal(result.activityIndex.components[2].rawValue, 10);
});

test("source availability uses fixed weights, rounding, and denominator exclusions", () => {
  const sources = health({
    "noaa-nhc": { status: "degraded" },
    "nasa-rss": { status: "unavailable" },
    "esa-rss": { status: "configuration_required" },
  });
  const result = snapshot([], sources, graph({ sourceHealth: sources, partial: true }));
  assert.equal(metric(result, "provider-availability-percentage").value, 50);
  assert.equal(metric(result, "providers-operational").value, 1);
  assert.equal(metric(result, "providers-degraded").value, 1);
  assert.equal(metric(result, "providers-unavailable").value, 1);
  assert.equal(metric(result, "providers-configuration-required").value, 1);
  assert.equal(metric(result, "provider-availability-percentage").breakdown.activeExpected, 3);
  const third = health({
    "noaa-nhc": { status: "unavailable" },
    "nasa-rss": { status: "unavailable" },
  });
  assert.equal(metric(snapshot([], third), "provider-availability-percentage").value, 50);
});

test("no active expected providers returns null availability, never zero", () => {
  const sources = health({
    "usgs-earthquakes": { status: "configuration_required" },
    "noaa-nhc": { status: "disabled" },
    "nasa-rss": { status: "paused" },
    "esa-rss": { status: "configuration_required" },
  });
  const availability = metric(snapshot([], sources), "provider-availability-percentage");
  assert.equal(availability.value, null);
  assert.equal(availability.completeness, "unavailable");
});

test("Planet Activity Index formula, rounding, and status thresholds are deterministic", () => {
  const quake = (magnitude, index) => item({ id: `q-${index}`, metadata: { magnitude } });
  const report = item({ id: "nasa", itemType: "report", category: "space", sourceId: "nasa-rss", sourceName: "NASA", relatedEventId: null, relatedReportId: "nasa", metadata: {} });
  const result = snapshot([[3.9, 4, 5, 6, 7].map(quake), report].flat());
  assert.equal(result.activityIndex.value, 17.4);
  assert.equal(result.activityIndex.status, "normal");
  const elevated = snapshot(Array.from({ length: 50 }, (_, index) => quake(5, index)));
  assert.equal(elevated.activityIndex.value, 50);
  assert.equal(elevated.activityIndex.status, "high");
  assert.equal(activityStatusForValue(0), "normal");
  assert.equal(activityStatusForValue(24.9), "normal");
  assert.equal(activityStatusForValue(25), "elevated");
  assert.equal(activityStatusForValue(49.9), "elevated");
  assert.equal(activityStatusForValue(50), "high");
  assert.equal(activityStatusForValue(74.9), "high");
  assert.equal(activityStatusForValue(75), "high");
  assert.equal(activityStatusForValue(100), "high");
});

test("partial NOAA, NASA, and ESA data preserve verified values and identify incompleteness", () => {
  const inputs = [
    item({ id: "storm", itemType: "advisory", category: "cyclone", sourceId: "noaa-nhc", sourceName: "NOAA", relatedEventId: "storm", metadata: {} }),
    item({ id: "nasa", itemType: "report", category: "space", sourceId: "nasa-rss", sourceName: "NASA", relatedEventId: null, relatedReportId: "nasa", metadata: {} }),
  ];
  for (const sourceId of ["noaa-nhc", "nasa-rss", "esa-rss"]) {
    const sources = health({ [sourceId]: { status: "unavailable" } });
    const result = snapshot(inputs, sources, graph({ sourceHealth: sources, partial: true }));
    assert.equal(result.partial, true);
    assert.equal(result.activityIndex.completeness, "partial");
  }
  const esaMissing = snapshot(inputs, health({ "esa-rss": { status: "unavailable" } }));
  assert.equal(metric(esaMissing, "space-science-reports-24h").value, 1);
  assert.equal(metric(esaMissing, "space-science-reports-24h").completeness, "partial");
});

test("all activity components unavailable returns a null unavailable index", () => {
  const sources = health(Object.fromEntries(["usgs-earthquakes","noaa-nhc","nasa-rss","esa-rss"].map((id) => [id, { status: "unavailable" }])));
  const result = snapshot([], sources, graph({ sourceHealth: sources, partial: true }));
  assert.equal(result.activityIndex.value, null);
  assert.equal(result.activityIndex.completeness, "unavailable");
  assert.equal(result.activityIndex.status, "unavailable");
});

test("graph coverage comes directly from graph snapshot counts and types", () => {
  const graphValue = graph({
    nodes: [{ id: "a", nodeType: "event" }, { id: "b", nodeType: "advisory" }, { id: "c", nodeType: "report" }, { id: "d", nodeType: "source" }, { id: "e", nodeType: "location" }],
    edges: [{ id: "1", edgeType: "located_in" }, { id: "2", edgeType: "published_by" }],
  });
  const result = snapshot([], health(), graphValue);
  assert.equal(metric(result, "graph-total-nodes").value, 5);
  assert.equal(metric(result, "graph-total-edges").value, 2);
  assert.equal(metric(result, "graph-events-represented").value, 2);
  assert.equal(metric(result, "graph-sources-represented").value, 1);
  assert.equal(metric(result, "graph-locations-represented").value, 1);
});

test("duplicate exact timeline IDs are counted once", () => {
  const duplicate = item();
  const result = snapshot([duplicate, duplicate]);
  assert.equal(metric(result, "global-events-24h").value, 1);
  assert.equal(result.inputSummary.verifiedTimelineItems, 2);
  assert.equal(result.inputSummary.uniqueTimelineItems, 1);
});

test("API query validation and filtering reject unknown values", () => {
  assert.equal(parseMetricsQuery(new URLSearchParams("window=invalid")).code, "INVALID_WINDOW");
  assert.equal(parseMetricsQuery(new URLSearchParams("metric=made-up")).code, "INVALID_METRIC");
  assert.equal(parseMetricsQuery(new URLSearchParams("extra=true")).code, "INVALID_PARAMETERS");
  const parsed = parseMetricsQuery(new URLSearchParams("window=24h&metric=earthquakes-24h"));
  assert.equal(parsed.ok, true);
  const filtered = filterMetricsSnapshot(snapshot([item()]), parsed.query);
  assert.deepEqual(filtered.metrics.map(({ id }) => id), ["earthquakes-24h"]);
  const index = parseMetricsQuery(new URLSearchParams("metric=planet-activity-index"));
  assert.equal(index.ok, true);
  assert.equal(filterMetricsSnapshot(snapshot([item()]), index.query).activityIndex.id, "planet-activity-index");
});

test("API, page, dashboard, cache, and documentation expose the production contract", async () => {
  const api = await readFile(new URL("../src/app/api/metrics/route.ts", import.meta.url), "utf8");
  const service = await readFile(new URL("../src/lib/metrics/metrics-service.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../src/app/app/metrics/page.tsx", import.meta.url), "utf8");
  const dashboard = await readFile(new URL("../src/components/metrics/GlobalMetricsCompact.tsx", import.meta.url), "utf8");
  const docs = await readFile(new URL("../../../docs/ATLAS-GLOBAL-METRICS.md", import.meta.url), "utf8");
  assert.match(api, /parseMetricsQuery/);
  assert.match(api, /snapshot\.partial \? 206 : 200/);
  assert.match(service, /METRICS_CACHE_TTL_MS = 60_000/);
  assert.match(service, /stale: true/);
  assert.match(page, /not predicted impact or risk/);
  assert.match(dashboard, /Global events · 24h/);
  assert.match(docs, /does not predict damage, impact, casualties, or future events/);
});
