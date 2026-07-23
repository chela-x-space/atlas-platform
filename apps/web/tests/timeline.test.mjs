import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  deduplicateTimelineItems,
  filterTimelineItems,
  normalizeEventTimelineItem,
  normalizeReportTimelineItem,
  paginateTimelineItems,
  parseTimelineQuery,
  sortTimelineItems,
  summarizeTimelineSources,
} from "../src/lib/timeline/timeline-logic.mjs";

const event = JSON.parse(await readFile(new URL("./fixtures/timeline-event.json", import.meta.url), "utf8"));
const report = JSON.parse(await readFile(new URL("./fixtures/timeline-report.json", import.meta.url), "utf8"));
const fetchedAt = "2026-07-23T11:10:00.000Z";

function filters(overrides = {}) {
  return {
    limit: 25,
    cursor: null,
    categories: [],
    sources: [],
    itemTypes: [],
    from: null,
    to: null,
    search: "",
    ...overrides,
  };
}

test("normalizes verified events without fabricating fields", () => {
  const item = normalizeEventTimelineItem(event);
  assert.equal(item.itemType, "event");
  assert.equal(item.relatedEventId, event.id);
  assert.equal(item.relatedReportId, null);
  assert.deepEqual(item.coordinates, event.coordinates);
  assert.equal(item.location, event.region);
  assert.equal(item.severity, event.severity);
  assert.equal(item.attribution, event.attribution);
});

test("normalizes verified reports with null spatial and severity values", () => {
  const item = normalizeReportTimelineItem(report, fetchedAt);
  assert.equal(item.itemType, "report");
  assert.equal(item.relatedReportId, report.id);
  assert.equal(item.location, null);
  assert.equal(item.coordinates, null);
  assert.equal(item.severity, null);
  assert.equal(item.sourceUrl, report.sourceUrl);
});

test("rejects invalid timestamps and unsafe report URLs", () => {
  assert.equal(normalizeEventTimelineItem({ ...event, occurredAt: "not-a-date" }), null);
  assert.equal(normalizeReportTimelineItem({ ...report, sourceUrl: "javascript:alert(1)", canonicalUrl: "" }, fetchedAt), null);
});

test("orders newest first with stable item-ID tie breaking", () => {
  const eventItem = normalizeEventTimelineItem(event);
  const reportItem = normalizeReportTimelineItem(report, fetchedAt);
  const tied = { ...reportItem, id: "timeline:report:aaa", occurredAt: eventItem.occurredAt };
  assert.deepEqual(sortTimelineItems([eventItem, reportItem]).map(({ id }) => id), [reportItem.id, eventItem.id]);
  assert.deepEqual(sortTimelineItems([eventItem, tied]).map(({ id }) => id), [eventItem.id, tied.id]);
});

test("filters by category, source, item type, date range, and search", () => {
  const items = [normalizeEventTimelineItem(event), normalizeReportTimelineItem(report, fetchedAt)];
  assert.deepEqual(filterTimelineItems(items, filters({ categories: ["earthquake"] })).map(({ sourceId }) => sourceId), ["usgs-earthquakes"]);
  assert.deepEqual(filterTimelineItems(items, filters({ sources: ["nasa-rss"] })).map(({ sourceId }) => sourceId), ["nasa-rss"]);
  assert.deepEqual(filterTimelineItems(items, filters({ itemTypes: ["report"] })).map(({ sourceId }) => sourceId), ["nasa-rss"]);
  assert.equal(filterTimelineItems(items, filters({ from: "2026-07-23T10:30:00.000Z", to: "2026-07-23T11:30:00.000Z" })).length, 1);
  assert.equal(filterTimelineItems(items, filters({ search: "test region" })).length, 1);
});

test("paginates deterministically and rejects invalid cursors", () => {
  const base = normalizeEventTimelineItem(event);
  const items = [0, 1, 2].map((offset) => ({
    ...base,
    id: `${base.id}-${offset}`,
    occurredAt: `2026-07-23T10:0${2 - offset}:00.000Z`,
  }));
  const first = paginateTimelineItems(items, 2, null);
  assert.equal(first.ok, true);
  assert.equal(first.items.length, 2);
  assert.ok(first.nextCursor);
  const second = paginateTimelineItems(items, 2, first.nextCursor);
  assert.equal(second.ok, true);
  assert.equal(second.items.length, 1);
  assert.equal(second.nextCursor, null);
  assert.deepEqual(paginateTimelineItems(items, 2, "bad-cursor"), { ok: false, error: "INVALID_CURSOR" });
});

test("query validation rejects malformed dates and invalid cursors", () => {
  assert.equal(parseTimelineQuery(new URLSearchParams("from=yesterday")).ok, false);
  assert.equal(parseTimelineQuery(new URLSearchParams("from=2026-07-24T00:00:00Z&to=2026-07-23T00:00:00Z")).ok, false);
  assert.equal(parseTimelineQuery(new URLSearchParams("cursor=")).ok, false);
  assert.equal(parseTimelineQuery(new URLSearchParams("limit=101")).ok, false);
});

test("deduplicates exact records but preserves operational revisions and separate agencies", () => {
  const first = normalizeEventTimelineItem(event);
  const revision = normalizeEventTimelineItem({
    ...event,
    updatedAt: "2026-07-23T10:06:00.000Z",
    metadata: { magnitude: 5.3 },
  });
  const nasa = normalizeReportTimelineItem(report, fetchedAt);
  const esa = normalizeReportTimelineItem({
    ...report,
    id: "esa-rss-fixture",
    sourceId: "esa-rss",
    sourceName: "ESA Official RSS",
    sourceUrl: "https://www.esa.int/example/fixture",
    canonicalUrl: "https://www.esa.int/example/fixture",
  }, fetchedAt);
  const result = deduplicateTimelineItems([first, first, revision, nasa, esa]);
  assert.equal(result.items.length, 4);
  assert.equal(result.duplicates.length, 1);
  assert.equal(result.duplicates[0].reason, "exact_id");
});

test("source summary reports partial outages, staleness, and active-source accuracy", () => {
  const sources = [
    { sourceId: "usgs-earthquakes", status: "online", stale: false },
    { sourceId: "noaa-nhc", status: "unavailable", stale: false },
    { sourceId: "nasa-rss", status: "degraded", stale: true },
    { sourceId: "esa-rss", status: "online", stale: false },
  ];
  assert.deepEqual(summarizeTimelineSources(sources), {
    activeSources: 3,
    staleSources: ["nasa-rss"],
    partial: true,
  });
});

test("zero-result filtering remains a successful empty result", () => {
  const items = [normalizeEventTimelineItem(event), normalizeReportTimelineItem(report, fetchedAt)];
  assert.deepEqual(filterTimelineItems(items, filters({ search: "no such verified activity" })), []);
});

test("timeline API and page expose the production contract", async () => {
  const route = await readFile(new URL("../src/app/api/timeline/route.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../src/app/app/timeline/page.tsx", import.meta.url), "utf8");
  const service = await readFile(new URL("../src/lib/timeline/timeline-service.ts", import.meta.url), "utf8");
  assert.match(route, /parseTimelineQuery/);
  assert.match(route, /Cache-Control": "no-store"/);
  assert.match(service, /Promise\.allSettled/);
  assert.match(service, /usgs-earthquakes/);
  assert.match(service, /nasa-rss/);
  assert.match(page, /Global Timeline/);
  assert.match(page, /nextCursor/);
  assert.match(page, /Original source/);
});
