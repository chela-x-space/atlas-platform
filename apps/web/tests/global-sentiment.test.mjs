import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  calculateSentimentSnapshot,
  labelGlobalSentiment,
  labelSentimentScore,
  normalizeSentimentText,
  parseSentimentQuery,
  scoreSentimentText,
  sentimentRecencyWeight,
} from "../src/lib/sentiment/sentiment-logic.mjs";

const generatedAt = "2026-07-24T12:00:00.000Z";

function item(overrides = {}) {
  return {
    id: "timeline:report:fixture",
    itemType: "report",
    title: "Operations improved successfully",
    summary: "Systems are stable and operational.",
    category: "space",
    sourceId: "nasa-rss",
    sourceName: "NASA",
    sourceUrl: "https://example.test/report",
    occurredAt: "2026-07-24T11:00:00.000Z",
    updatedAt: "2026-07-24T11:00:00.000Z",
    ingestedAt: "2026-07-24T11:05:00.000Z",
    location: null,
    countries: [],
    coordinates: null,
    severity: null,
    status: "published",
    verificationStatus: "verified",
    attribution: "NASA fixture attribution",
    stale: false,
    relatedEventId: null,
    relatedReportId: "report-fixture",
    metadata: { language: "en", sourceRecordId: "report-fixture" },
    ...overrides,
  };
}

function health(overrides = {}) {
  return [
    ["esa-rss", "ESA"], ["nasa-rss", "NASA"],
    ["noaa-nhc", "NOAA/NHC"], ["usgs-earthquakes", "USGS"],
  ].map(([sourceId, sourceName]) => ({
    sourceId, sourceName, status: "online", stale: false, itemCount: 1,
    checkedAt: generatedAt, errorCode: null, errorMessage: null,
    ...overrides[sourceId],
  }));
}

function snapshot(items, options = {}) {
  return calculateSentimentSnapshot({
    items,
    sourceHealth: options.sourceHealth ?? health(),
    generatedAt,
    window: options.window ?? "24h",
    source: options.source ?? null,
    limit: options.limit ?? 20,
  });
}

test("identical normalized inputs and generatedAt produce identical stable output", () => {
  const inputs = [item(), item({ id: "esa", sourceId: "esa-rss", sourceName: "ESA", relatedReportId: "esa", metadata: { language: "en", sourceRecordId: "esa" } })];
  assert.deepEqual(snapshot(inputs), snapshot([...inputs].reverse()));
  assert.deepEqual(snapshot(inputs).sourceBreakdown.map(({ sourceId }) => sourceId), ["esa-rss", "nasa-rss", "noaa-nhc"]);
});

test("normalization is Unicode, punctuation, HTML, entity, and whitespace safe", () => {
  assert.equal(normalizeSentimentText("  <p>IMPROVED&nbsp;— very\u00a0stable!</p>  "), "improved very stable");
  assert.equal(normalizeSentimentText("ＦＡＩＬＵＲＥ... resolved"), "failure resolved");
  assert.equal(normalizeSentimentText("damage&#33;\n\noperational"), "damage operational");
});

test("positive, negative, and strong terms use explicit weights", () => {
  const result = scoreSentimentText([{ field: "title", normalized: "improved breakthrough damage catastrophic" }]);
  assert.equal(result.positiveWeight, 3);
  assert.equal(result.negativeWeight, 3);
  assert.equal(result.netScore, 0);
  assert.equal(result.label, "neutral");
  assert.deepEqual(result.matchedPositiveTerms, ["improved", "breakthrough"]);
  assert.deepEqual(result.matchedNegativeTerms, ["damage", "catastrophic"]);
});

test("intensifier affects only the immediately following eligible term", () => {
  const immediate = scoreSentimentText([{ field: "title", normalized: "very severe" }]);
  const separated = scoreSentimentText([{ field: "title", normalized: "very system severe" }]);
  assert.equal(immediate.negativeWeight, 1.5);
  assert.deepEqual(immediate.matchedIntensifiers, ["very"]);
  assert.equal(separated.negativeWeight, 1);
});

test("odd negation count reverses sign and even multiple negations preserve sign", () => {
  const odd = scoreSentimentText([{ field: "title", normalized: "not severe" }]);
  const even = scoreSentimentText([{ field: "title", normalized: "not never severe" }]);
  assert.equal(odd.positiveWeight, 1);
  assert.deepEqual(odd.matchedNegations, ["not"]);
  assert.equal(even.negativeWeight, 1);
  assert.deepEqual(even.matchedNegations, ["not", "never"]);
});

test("zero recognized terms is neutral but no eligible text is unscored", () => {
  const neutral = snapshot([item({ title: "Mission update", summary: "Team published results." })]);
  assert.equal(neutral.recentRecords[0].normalizedScore, 0);
  assert.equal(neutral.recentRecords[0].label, "neutral");
  const unscored = snapshot([item({ title: "", summary: "", metadata: { language: "en", sourceRecordId: "empty" }, relatedReportId: "empty" })]);
  assert.equal(unscored.recentRecords[0].normalizedScore, null);
  assert.equal(unscored.index.value, null);
  assert.equal(unscored.index.completeness, "unavailable");
});

test("explicit non-English language is unsupported and never neutral", () => {
  const result = snapshot([item({ metadata: { language: "fr", sourceRecordId: "fr" }, relatedReportId: "fr", title: "stable", summary: "operational" })]);
  assert.equal(result.recentRecords[0].label, "unavailable");
  assert.equal(result.index.coverage.unsupportedLanguageRecords, 1);
  assert.equal(result.index.scoredRecordCount, 0);
});

test("structured USGS magnitude and location labels are not eligible prose", () => {
  const result = snapshot([item({
    id: "usgs",
    sourceId: "usgs-earthquakes",
    sourceName: "USGS",
    itemType: "event",
    relatedEventId: "usgs",
    relatedReportId: null,
    title: "M 4.2 earthquake — 10 km north of Example",
    summary: "M 4.2 - 10 km north of Example",
    metadata: { sourceRecordId: "usgs" },
  })]);
  assert.equal(result.index.eligibleRecordCount, 0);
  assert.equal(result.index.value, null);
});

test("canonical duplicate exclusion prevents repeated records from biasing index", () => {
  const original = item({ id: "a-original" });
  const duplicate = item({ id: "z-duplicate", title: "Catastrophic failure" });
  const result = snapshot([original, duplicate]);
  assert.equal(result.index.coverage.eligibleRecords, 2);
  assert.equal(result.index.coverage.uniqueRecords, 1);
  assert.equal(result.index.coverage.duplicatesExcluded, 1);
  assert.ok(result.index.value > 0);
});

test("recency weights are fixed for 1h, 24h, and 7d quartiles", () => {
  for (const [window, total] of [["1h", 60 * 60_000], ["24h", 24 * 60 * 60_000], ["7d", 7 * 24 * 60 * 60_000]]) {
    assert.equal(sentimentRecencyWeight(window, total * 0.25), 1);
    assert.equal(sentimentRecencyWeight(window, total * 0.25 + 1), 0.85);
    assert.equal(sentimentRecencyWeight(window, total * 0.5 + 1), 0.7);
    assert.equal(sentimentRecencyWeight(window, total * 0.75 + 1), 0.55);
  }
});

test("1h, 24h, and 7d boundaries are inclusive and future records excluded", () => {
  for (const [window, boundary] of [
    ["1h", "2026-07-24T11:00:00.000Z"],
    ["24h", "2026-07-23T12:00:00.000Z"],
    ["7d", "2026-07-17T12:00:00.000Z"],
  ]) {
    const result = snapshot([
      item({ id: `${window}-boundary`, relatedReportId: `${window}-boundary`, metadata: { language: "en", sourceRecordId: `${window}-boundary` }, occurredAt: boundary }),
      item({ id: `${window}-future`, relatedReportId: `${window}-future`, metadata: { language: "en", sourceRecordId: `${window}-future` }, occurredAt: "2026-07-24T12:00:00.001Z" }),
    ], { window });
    assert.equal(result.inputSummary.recordsInWindow, 1);
    assert.equal(result.inputSummary.windowStart, boundary);
  }
});

test("global formula applies recency, normalization, and one-decimal rounding", () => {
  const result = snapshot([
    item({ id: "recent-positive", relatedReportId: "recent-positive", metadata: { language: "en", sourceRecordId: "recent-positive" }, title: "breakthrough", summary: "", occurredAt: "2026-07-24T11:00:00.000Z" }),
    item({ id: "old-negative", relatedReportId: "old-negative", metadata: { language: "en", sourceRecordId: "old-negative" }, title: "catastrophic", summary: "", occurredAt: "2026-07-23T13:00:00.000Z" }),
  ]);
  // (+0.4 × 1.0 + -0.4 × 0.55) / 1.55 × 100 = 11.6
  assert.equal(result.index.value, 11.6);
  assert.equal(result.index.status, "neutral");
});

test("record and global label thresholds are exact", () => {
  assert.equal(labelSentimentScore(-1), "strongly_negative");
  assert.equal(labelSentimentScore(-0.6), "strongly_negative");
  assert.equal(labelSentimentScore(-0.59), "negative");
  assert.equal(labelSentimentScore(-0.2), "negative");
  assert.equal(labelSentimentScore(0.19), "neutral");
  assert.equal(labelSentimentScore(0.2), "positive");
  assert.equal(labelSentimentScore(0.6), "strongly_positive");
  assert.equal(labelGlobalSentiment(-60), "strongly_negative");
  assert.equal(labelGlobalSentiment(-59.9), "negative");
  assert.equal(labelGlobalSentiment(-20), "negative");
  assert.equal(labelGlobalSentiment(19.9), "neutral");
  assert.equal(labelGlobalSentiment(20), "positive");
  assert.equal(labelGlobalSentiment(60), "strongly_positive");
});

test("source breakdown, coverage, and complete state are transparent", () => {
  const result = snapshot([
    item(),
    item({ id: "esa", sourceId: "esa-rss", sourceName: "ESA", relatedReportId: "esa", metadata: { language: "en", sourceRecordId: "esa" }, title: "severe warning", summary: "" }),
  ]);
  assert.equal(result.index.coverage.percentage, 100);
  assert.equal(result.index.coverage.respondingProviders, 3);
  assert.equal(result.index.completeness, "complete");
  assert.equal(result.sourceBreakdown.find(({ sourceId }) => sourceId === "nasa-rss").scoredRecordCount, 1);
  assert.equal(result.sourceBreakdown.find(({ sourceId }) => sourceId === "esa-rss").negativeCount, 1);
});

test("degraded or unavailable providers preserve scores and mark partial", () => {
  const sourceHealth = health({ "noaa-nhc": { status: "degraded" }, "esa-rss": { status: "unavailable" } });
  const result = snapshot([item()], { sourceHealth });
  assert.notEqual(result.index.value, null);
  assert.equal(result.partial, true);
  assert.equal(result.index.completeness, "partial");
  assert.equal(result.index.coverage.degradedProviders, 1);
  assert.equal(result.index.coverage.unavailableProviders, 1);
});

test("no scored records returns unavailable null instead of fabricated zero", () => {
  const result = snapshot([]);
  assert.equal(result.index.value, null);
  assert.equal(result.index.status, "unavailable");
  assert.equal(result.index.completeness, "unavailable");
  assert.equal(result.index.coverage.percentage, null);
});

test("query validation bounds window, source, and limit", () => {
  assert.equal(parseSentimentQuery(new URLSearchParams("window=invalid")).code, "INVALID_WINDOW");
  assert.equal(parseSentimentQuery(new URLSearchParams("source=unknown")).code, "INVALID_SOURCE");
  assert.equal(parseSentimentQuery(new URLSearchParams("limit=0")).code, "INVALID_LIMIT");
  assert.equal(parseSentimentQuery(new URLSearchParams("limit=51")).code, "INVALID_LIMIT");
  assert.equal(parseSentimentQuery(new URLSearchParams("extra=true")).code, "INVALID_PARAMETERS");
  assert.deepEqual(parseSentimentQuery(new URLSearchParams("window=7d&source=esa-rss&limit=5")), {
    ok: true, query: { window: "7d", source: "esa-rss", limit: 5 },
  });
});

test("stable recent ordering and source attribution are preserved", () => {
  const result = snapshot([
    item({ id: "b", relatedReportId: "b", metadata: { language: "en", sourceRecordId: "b" } }),
    item({ id: "a", relatedReportId: "a", metadata: { language: "en", sourceRecordId: "a" } }),
  ]);
  assert.deepEqual(result.recentRecords.map(({ recordId }) => recordId), ["a", "b"]);
  assert.equal(result.recentRecords[0].provenance.attribution, "NASA fixture attribution");
  assert.equal(result.recentRecords[0].provenance.sourceUrl, "https://example.test/report");
});

test("service, API, page, dashboard, stale state, and documentation expose the contract", async () => {
  const service = await readFile(new URL("../src/lib/sentiment/sentiment-service.ts", import.meta.url), "utf8");
  const api = await readFile(new URL("../src/app/api/sentiment/route.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../src/app/app/sentiment/page.tsx", import.meta.url), "utf8");
  const dashboard = await readFile(new URL("../src/components/sentiment/DashboardSentiment.tsx", import.meta.url), "utf8");
  const docs = await readFile(new URL("../../../docs/ATLAS-GLOBAL-SENTIMENT.md", import.meta.url), "utf8");
  assert.match(service, /SENTIMENT_CACHE_TTL_MS = 60_000/);
  assert.match(service, /stale: true/);
  assert.match(api, /parseSentimentQuery/);
  assert.match(api, /snapshot\.partial \? 206 : 200/);
  assert.match(page, /does not measure public opinion, human emotion, or predicted impact/);
  assert.match(dashboard, /No eligible verified text available/);
  assert.doesNotMatch(dashboard, /Integration pending/);
  assert.match(docs, /No LLM is used for sentiment classification/);
  assert.match(docs, /Missing sources are never\s+estimated/);
});
