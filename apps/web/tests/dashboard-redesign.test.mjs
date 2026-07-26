import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const dashboard = await read("../src/components/dashboard/AtlasDashboard.tsx");
const sidebar = await read("../src/components/dashboard/AtlasSidebar.tsx");
const mapPage = await read("../src/app/app/map/page.tsx");
const marketplace = await read("../src/app/(public)/marketplace/page.tsx");

test("homepage follows the situation-driven hierarchy without a map component", () => {
  const headings = [
    "GLOBAL SITUATION NOW",
    "TOP GLOBAL EVENTS",
    "HOT REGIONS",
    "CATEGORY INTELLIGENCE",
    "LATEST VERIFIED INTELLIGENCE",
  ];
  let previous = -1;
  for (const heading of headings) {
    const index = dashboard.indexOf(heading);
    assert.ok(index > previous, `${heading} must appear in hierarchy order`);
    previous = index;
  }
  assert.doesNotMatch(dashboard, /AtlasMap|GlobalOperationsMap|LIVE GLOBAL MAP/);
});

test("dedicated Map route remains wired to the canonical map component", () => {
  assert.match(mapPage, /GlobalOperationsMap/);
  assert.match(mapPage, /World Map/);
});

test("Marketplace is navigation-only and absent from homepage content", () => {
  assert.match(sidebar, /\["◈", "Marketplace"\]/);
  assert.doesNotMatch(dashboard, /Marketplace|products|price|checkout/i);
});

test("Marketplace placeholder renders only its coming-soon positioning", () => {
  assert.match(marketplace, /ATLAS Marketplace/);
  assert.match(marketplace, /Coming soon/);
  assert.match(marketplace, /Digital products, e-books/);
  assert.doesNotMatch(marketplace, /button|checkout|purchase|price/i);
});

test("dashboard exposes deterministic empty and unavailable states", () => {
  assert.match(dashboard, /No critical events detected/);
  assert.match(dashboard, /Awaiting verified intelligence/);
  assert.match(dashboard, /Data unavailable/);
  assert.doesNotMatch(dashboard, /count:\s*\d+/);
});

test("redesign does not modify or import public v1 routes", async () => {
  assert.doesNotMatch(dashboard, /\/api\/v1\//);
  assert.doesNotMatch(sidebar, /\/api\/v1\//);
});
