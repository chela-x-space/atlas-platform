import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createStaleDetailResponse,
  exactRelatedReportIds,
  hasValidDetailCoordinates,
  resolveCanonicalTimelineItem,
  sanitizeDetailMetadata,
  validateEventDetailId,
} from "../src/lib/event-detail/event-detail-logic.mjs";
import {
  normalizeEventTimelineItem,
  normalizeReportTimelineItem,
} from "../src/lib/timeline/timeline-logic.mjs";

const event = JSON.parse(await readFile(new URL("./fixtures/timeline-event.json", import.meta.url), "utf8"));
const report = JSON.parse(await readFile(new URL("./fixtures/timeline-report.json", import.meta.url), "utf8"));
const fetchedAt = "2026-07-23T11:10:00.000Z";
const usgs = normalizeEventTimelineItem(event);
const nhc = normalizeEventTimelineItem({
  ...event,
  id: "evt_nhc_fixture",
  sourceItemId: "al012026-advisory-4",
  category: "cyclone",
  type: "cyclone advisory",
  title: "Tropical Storm Fixture Advisory Number 4",
  summary: "Official NHC fixture advisory.",
  sourceId: "noaa-nhc",
  sourceName: "NOAA National Hurricane Center",
  sourceUrl: "https://www.nhc.noaa.gov/text/refresh/MIATCPAT1+shtml/",
  region: "Atlantic",
  coordinates: { longitude: -60, latitude: 20 },
  metadata: { basin: "Atlantic", stormName: "Fixture", advisoryNumber: "4" },
  attribution: "NOAA/National Hurricane Center",
});
const nasa = normalizeReportTimelineItem(report, fetchedAt);
const esa = normalizeReportTimelineItem({
  ...report,
  id: "esa-rss-fixture",
  sourceId: "esa-rss",
  sourceName: "ESA Official RSS",
  originalSource: "European Space Agency",
  sourceUrl: "https://www.esa.int/example/fixture",
  canonicalUrl: "https://www.esa.int/example/fixture",
  attribution: "European Space Agency (ESA)",
}, fetchedAt);
const items = [usgs, nhc, nasa, esa];

test("resolves USGS and NOAA/NHC operational IDs exactly", () => {
  assert.equal(resolveCanonicalTimelineItem(items, event.id).relatedEventId, event.id);
  assert.equal(resolveCanonicalTimelineItem(items, "evt_nhc_fixture").itemType, "advisory");
});

test("resolves NASA and ESA verified report IDs exactly", () => {
  assert.equal(resolveCanonicalTimelineItem(items, report.id).sourceId, "nasa-rss");
  assert.equal(resolveCanonicalTimelineItem(items, "esa-rss-fixture").sourceId, "esa-rss");
});

test("resolves a timeline item ID to its canonical underlying record", () => {
  assert.equal(resolveCanonicalTimelineItem(items, usgs.id).relatedEventId, event.id);
  assert.equal(resolveCanonicalTimelineItem(items, nasa.id).relatedReportId, report.id);
});

test("unknown exact IDs do not silently fall back", () => {
  assert.equal(resolveCanonicalTimelineItem(items, "unknown-id"), null);
});

test("validates IDs and rejects traversal, malformed encodings, and excessive length", () => {
  assert.equal(validateEventDetailId(event.id).ok, true);
  assert.equal(validateEventDetailId("../event").ok, false);
  assert.equal(validateEventDetailId("event%2Fsecret").ok, false);
  assert.equal(validateEventDetailId(`evt_${"a".repeat(400)}`).ok, false);
});

test("unsafe source URLs are rejected before detail resolution", () => {
  assert.equal(normalizeReportTimelineItem({
    ...report,
    sourceUrl: "javascript:alert(1)",
    canonicalUrl: "file:///secret",
  }, fetchedAt), null);
});

test("map contract renders only for valid source coordinates", () => {
  assert.equal(hasValidDetailCoordinates(null), false);
  assert.equal(hasValidDetailCoordinates({ longitude: 181, latitude: 0 }), false);
  assert.equal(hasValidDetailCoordinates(usgs.coordinates), true);
  assert.equal(nasa.coordinates, null);
});

test("only exact news groups produce related report IDs", () => {
  const exact = {
    confidence: "exact",
    eventAnchor: { id: event.id },
    relatedReports: [{ id: report.id }, { id: "esa-rss-fixture" }],
  };
  const probable = {
    confidence: "probable",
    eventAnchor: { id: event.id },
    relatedReports: [{ id: "unrelated-report" }],
  };
  assert.deepEqual(exactRelatedReportIds([exact, probable], usgs).sort(), [report.id, "esa-rss-fixture"].sort());
  assert.deepEqual(exactRelatedReportIds([probable], usgs), []);
});

test("stale fallback labels the item and partial provider outage", () => {
  const response = {
    item: {
      id: event.id,
      sourceId: "usgs-earthquakes",
      stale: false,
      relatedTimelineItems: [usgs],
    },
    relatedReports: [],
    relatedTimelineItems: [usgs],
    sourceHealth: [{
      sourceId: "usgs-earthquakes",
      status: "online",
      stale: false,
      errorCode: null,
      errorMessage: null,
    }],
    errors: [],
    partial: false,
    fetchedAt,
  };
  const stale = createStaleDetailResponse(response, "Fixture outage");
  assert.equal(stale.item.stale, true);
  assert.equal(stale.partial, true);
  assert.equal(stale.sourceHealth[0].status, "unavailable");
  assert.equal(stale.errors[0].code, "STALE_CACHE_FALLBACK");
});

test("metadata sanitization excludes secrets, stack traces, cache keys, and unsafe URLs", () => {
  assert.deepEqual(sanitizeDetailMetadata({
    magnitude: 5.2,
    alert: "green",
    stack: "internal trace",
    apiToken: "secret",
    cacheKey: "private",
    unsafeUrl: "javascript:alert(1)",
    officialUrl: "https://earthquake.usgs.gov/example",
  }), {
    magnitude: 5.2,
    alert: "green",
    officialUrl: "https://earthquake.usgs.gov/example",
  });
});

test("original source and official link survive report normalization", () => {
  assert.equal(nasa.metadata.originalSource, report.originalSource);
  assert.equal(nasa.sourceUrl, report.sourceUrl);
});

test("detail API and page implement stable 400, 404, map, metadata, and link contracts", async () => {
  const route = await readFile(new URL("../src/app/api/events/[id]/route.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../src/app/app/events/[id]/page.tsx", import.meta.url), "utf8");
  const notFound = await readFile(new URL("../src/app/app/events/[id]/not-found.tsx", import.meta.url), "utf8");
  const resolver = await readFile(new URL("../src/lib/event-detail/event-detail-resolver.ts", import.meta.url), "utf8");
  assert.match(route, /status:\s*400/);
  assert.match(route, /status:\s*404/);
  assert.match(route, /resolveEventDetail/);
  assert.match(page, /item\.coordinates && item\.availableSections\.includes\("map"\)/);
  assert.match(page, /Open official source/);
  assert.match(page, /generateMetadata/);
  assert.match(notFound, /Event not found/);
  assert.match(resolver, /MAX_CACHE_ITEMS = 100/);
  assert.match(resolver, /inFlight/);
});
