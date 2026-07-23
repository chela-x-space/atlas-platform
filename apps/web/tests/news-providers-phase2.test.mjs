import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseRssOrAtom } from "../src/lib/news/rss-parser.mjs";
import { isReliefWebResponse } from "../src/lib/news/providers/reliefweb-schema.mjs";
import { clearProviderCache, withProviderCache } from "../src/lib/news/provider-cache.mjs";

const fixture = (name) => readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("ReliefWeb fixture satisfies the guarded v2 response shape", async () => {
  const value = JSON.parse(await fixture("reliefweb-reports.json"));
  assert.equal(isReliefWebResponse(value), true);
  assert.equal(value.data[0].fields.source[0].shortname, "EHO");
  assert.equal(value.data[0].fields.disaster[0].id, 30);
});

test("malformed ReliefWeb responses are rejected", () => {
  assert.equal(isReliefWebResponse({ data: [{ id: 1 }] }), false);
  assert.equal(isReliefWebResponse({ data: "not-an-array" }), false);
  assert.equal(isReliefWebResponse(null), false);
});

test("official RSS fixture yields source text, link, and timestamp", async () => {
  const reports = parseRssOrAtom(await fixture("official-news.rss"));
  assert.equal(reports.length, 1);
  assert.equal(reports[0].title, "Mission technology update");
  assert.equal(reports[0].description, "A short source-supplied summary.…");
  assert.equal(reports[0].link, "https://www.nasa.gov/example/mission-technology-update/");
  assert.equal(reports[0].publishedAt, "2026-07-22T12:00:00.000Z");
});

test("malformed XML is rejected instead of partially accepted", async () => {
  const xml = await fixture("malformed-news.xml");
  assert.throws(() => parseRssOrAtom(xml), /Malformed/);
});

test("normalization rejects unsafe URLs and malformed dates", async () => {
  const normalization = await source("../src/lib/news/report-normalization.ts");
  assert.match(normalization, /safeExternalUrl/);
  assert.match(normalization, /Number\.isNaN/);
  assert.match(normalization, /if \(!canonicalUrl \|\| !sourceUrl \|\| !publishedAt/);
});

test("deduplication retains reason precedence and distinct numbered reports", async () => {
  const dedupe = await source("../src/lib/news/report-deduplication.ts");
  for (const reason of ["canonical_url", "provider_id", "title_source_window", "content_fingerprint"]) {
    assert.match(dedupe, new RegExp(`\"${reason}\"`));
  }
  assert.match(dedupe, /leftNumber && rightNumber && leftNumber !== rightNumber/);
});

test("grouping prioritizes identifiers and preserves standalone reports", async () => {
  const grouping = await source("../src/lib/news/event-grouping.ts");
  assert.match(grouping, /Shared canonical provider disaster identifier/);
  assert.match(grouping, /Report disaster identifier matches event anchor/);
  assert.match(grouping, /confidence: "standalone"/);
  assert.doesNotMatch(grouping, /country.*return.*exact/i);
});

test("provider orchestration uses allSettled for partial outage", async () => {
  const registry = await source("../src/lib/news/providers/provider-registry.ts");
  assert.match(registry, /Promise\.allSettled/);
  assert.match(registry, /status: "unavailable"/);
});

test("bounded cache exposes stale fallback and single flight", async () => {
  const cache = await source("../src/lib/news/provider-cache.mjs");
  assert.match(cache, /MAXIMUM_PROVIDERS = 12/);
  assert.match(cache, /inFlight/);
  clearProviderCache();
  let calls = 0;
  const healthy = { reports: [{ id: "cached" }], health: { status: "online", stale: false } };
  const first = await withProviderCache("test", 100, 1_000, async () => { calls += 1; return healthy; }, 1_000);
  const fresh = await withProviderCache("test", 100, 1_000, async () => { calls += 1; return healthy; }, 1_050);
  const stale = await withProviderCache("test", 100, 1_000, async () => { calls += 1; throw new Error("temporary outage"); }, 1_101);
  assert.equal(first.reports[0].id, "cached");
  assert.equal(fresh.reports[0].id, "cached");
  assert.equal(stale.health.status, "degraded");
  assert.equal(stale.health.stale, true);
  assert.equal(stale.health.errorCode, "STALE_CACHE");
  assert.equal(calls, 2);
});

test("zero-report response and provider health remain explicit", async () => {
  const relief = await source("../src/lib/news/providers/reliefweb-provider.ts");
  const healthRoute = await source("../src/app/api/source-health/route.ts");
  assert.match(relief, /reports: \[\]/);
  assert.match(relief, /configurationRequirement/);
  assert.match(healthRoute, /newsProviders/);
});

test("News page receives the server News API contract before hydration", async () => {
  const page = await source("../src/app/app/news/page.tsx");
  const client = await source("../src/app/app/news/NewsCenterClient.tsx");
  const service = await source("../src/lib/news/news-service.ts");
  assert.match(page, /dynamic = "force-dynamic"/);
  assert.match(page, /initialPayload = await getOfficialNews\(\)/);
  assert.match(page, /<NewsCenterClient initialPayload=\{initialPayload\}/);
  assert.match(client, /useState<NewsResponse \| null>\(initialPayload\)/);
  assert.match(client, /fetch\("\/api\/news", \{ signal: controller\.signal, cache: "no-store" \}\)/);
  for (const field of ["items", "eventGroups", "sources", "fetchedAt"]) {
    assert.match(service, new RegExp(`readonly ${field}`));
    assert.match(client, new RegExp(`${field}\\?`));
  }
});
