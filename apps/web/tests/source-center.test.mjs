import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  filterSourceProviders,
  sourceProviderStatistics,
} from "../src/lib/source-health/source-center-logic.mjs";

function provider(overrides) {
  return {
    id: "provider",
    name: "Provider",
    organization: "Official agency",
    category: "news",
    status: "online",
    reports: 0,
    lastSuccess: null,
    lastChecked: null,
    latencyMs: null,
    coverage: "Global",
    license: { label: "Provider terms", url: "https://example.test/terms" },
    attribution: "Official agency",
    documentationUrl: "https://example.test/docs",
    notes: "",
    stale: false,
    errorCode: null,
    ...overrides,
  };
}

const providers = [
  provider({ id: "nasa-rss", name: "NASA News", organization: "NASA", reports: 17, attribution: "NASA", coverage: "Global NASA publications" }),
  provider({ id: "esa-rss", name: "ESA News", organization: "ESA", reports: 9, license: { label: "ESA terms", url: "https://esa.test/terms" } }),
  provider({ id: "reliefweb", name: "ReliefWeb", status: "configuration_required" }),
  provider({ id: "jpl-news", name: "JPL News", status: "disabled" }),
  provider({ id: "who", name: "WHO Emergencies", status: "paused" }),
  provider({ id: "limited", name: "Limited Feed", status: "rate_limited" }),
  provider({ id: "usgs", name: "USGS", status: "unavailable" }),
];

test("source center searches governance and coverage fields", () => {
  assert.deepEqual(filterSourceProviders(providers, "nasa publications", "all").map(({ id }) => id), ["nasa-rss"]);
  assert.deepEqual(filterSourceProviders(providers, "ESA TERMS", "all").map(({ id }) => id), ["esa-rss"]);
  assert.deepEqual(filterSourceProviders(providers, "official agency", "online").map(({ id }) => id), ["esa-rss"]);
});

test("source center filters every supported provider status", () => {
  for (const status of ["online", "paused", "disabled", "configuration_required", "rate_limited", "unavailable"]) {
    assert.ok(filterSourceProviders(providers, "", status).every((item) => item.status === status));
  }
});

test("source center statistics separate offline and configuration states", () => {
  assert.deepEqual(sourceProviderStatistics(providers), {
    online: 2,
    offline: 4,
    configurationRequired: 1,
    totalReports: 26,
  });
});

test("source health API exposes the unified provider contract", async () => {
  const route = await readFile(new URL("../src/app/api/source-health/route.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../src/app/app/sources/page.tsx", import.meta.url), "utf8");
  const operations = await readFile(new URL("../src/lib/source-health/source-operations.ts", import.meta.url), "utf8");

  assert.match(route, /providers:\s*buildSourceOperationsProviders/);
  assert.match(operations, /DATA_SOURCES/);
  assert.match(page, /fetch\("\/api\/source-health"/);
  for (const column of ["Provider", "Status", "Reports", "Last Success", "Last Checked", "Latency", "Coverage", "License", "Attribution", "Documentation", "Notes"]) {
    assert.match(page, new RegExp(`"${column}"`));
  }
});
