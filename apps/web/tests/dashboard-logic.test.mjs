import test from "node:test";
import assert from "node:assert/strict";
import {
  EARTHQUAKE_LAYER_IDS,
  earthquakeLayersVisible,
  feedForRange,
  filterEvents,
  marketRowsForTab,
  routeForMenu,
} from "../src/lib/dashboard-logic.mjs";

test("sidebar labels resolve only to valid configured routes", () => {
  assert.equal(routeForMenu("World Map"), "/app/monitor");
  assert.equal(routeForMenu("Global Timeline"), "/app/timeline");
  assert.equal(routeForMenu("Source Center"), "/app/sources");
  assert.equal(routeForMenu("Volcano"), null);
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
