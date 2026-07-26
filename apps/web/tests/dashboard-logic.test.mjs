import test from "node:test";
import assert from "node:assert/strict";
import {
  EARTHQUAKE_LAYER_IDS,
  earthquakeLayersVisible,
  feedForRange,
  filterEvents,
  hotRegions,
  marketRowsForTab,
  rankDashboardEvents,
  routeForMenu,
  situationCounts,
} from "../src/lib/dashboard-logic.mjs";

test("sidebar labels resolve only to valid configured routes", () => {
  assert.equal(routeForMenu("World Map"), "/app/map");
  assert.equal(routeForMenu("Intelligence Search"), "/app/search");
  assert.equal(routeForMenu("Knowledge Graph"), "/app/entities");
  assert.equal(routeForMenu("Global Risk"), "/app/risk");
  assert.equal(routeForMenu("Global Timeline"), "/app/timeline");
  assert.equal(routeForMenu("Source Center"), "/app/sources");
  assert.equal(routeForMenu("Reports"), "/app/reports");
  assert.equal(routeForMenu("Marketplace"), "/marketplace");
  assert.equal(routeForMenu("Volcano"), null);
});

test("situation summaries derive every count from canonical event severity", () => {
  const events = [
    { severity: "critical" },
    { severity: "high" },
    { severity: "moderate" },
    { severity: "low" },
    { severity: "info" },
    { severity: "unknown" },
  ];
  assert.deepEqual(situationCounts(events).map(({ label, count }) => [label, count]), [
    ["Critical", 1],
    ["High Impact", 1],
    ["Regional", 1],
    ["Monitoring", 3],
  ]);
  assert.deepEqual(situationCounts([]).map(({ count }) => count), [0, 0, 0, 0]);
});

test("top events use severity, confirmation, recency, then ID deterministically", () => {
  const events = [
    { id: "z", severity: "high", occurredAt: "2026-01-03T00:00:00Z", metadata: {} },
    { id: "b", severity: "critical", occurredAt: "2026-01-01T00:00:00Z", metadata: {} },
    { id: "a", severity: "critical", occurredAt: "2026-01-01T00:00:00Z", metadata: {} },
    { id: "confirmed", severity: "critical", occurredAt: "2025-01-01T00:00:00Z", metadata: { officialConfirmed: true } },
  ];
  assert.deepEqual(rankDashboardEvents(events).map(({ id }) => id), ["confirmed", "a", "b", "z"]);
  assert.deepEqual(events.map(({ id }) => id), ["z", "b", "a", "confirmed"]);
});

test("hot regions are data-derived and stably ranked", () => {
  const regions = hotRegions([
    { region: "Pacific", severity: "moderate" },
    { region: "Pacific", severity: "critical" },
    { region: "Atlantic", severity: "high" },
    { severity: "critical" },
  ]);
  assert.deepEqual(regions, [
    { name: "Pacific", count: 2, highestSeverity: "critical" },
    { name: "Atlantic", count: 1, highestSeverity: "high" },
  ]);
});

test("earthquake layer visibility follows the selected real layer", () => {
  assert.equal(earthquakeLayersVisible("All Layers"), true);
  assert.equal(earthquakeLayersVisible("Earthquake"), true);
  assert.equal(earthquakeLayersVisible("Weather"), false);
  assert.equal(EARTHQUAKE_LAYER_IDS.length, 4);
});

test("earthquake ranges map to USGS feeds and invalid input falls back", () => {
  assert.match(feedForRange("7d"), /all_week\.geojson$/);
  assert.match(feedForRange("30d"), /all_month\.geojson$/);
  assert.match(feedForRange("invalid"), /all_day\.geojson$/);
});

test("search filters visible event fields case-insensitively", () => {
  const events = [["10:15", "Earthquake", "Japan", "red"], ["10:20", "Flood", "China", "blue"]];
  assert.deepEqual(filterEvents(events, "japan"), [events[0]]);
  assert.deepEqual(filterEvents(events, "  FLOOD "), [events[1]]);
});

test("market tabs select distinct datasets", () => {
  const data = { Indices: [["S&P", "1", "+1%"]], Crypto: [["BTC", "2", "-1%"]] };
  assert.deepEqual(marketRowsForTab(data, "Crypto"), data.Crypto);
  assert.deepEqual(marketRowsForTab(data, "Missing"), data.Indices);
});
