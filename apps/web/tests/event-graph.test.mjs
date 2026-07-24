import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  filterGraph,
  generateGraph,
  graphForId,
  parseGraphQuery,
} from "../src/lib/graph/graph-logic.mjs";
import {
  normalizeEventTimelineItem,
  normalizeReportTimelineItem,
} from "../src/lib/timeline/timeline-logic.mjs";

const eventFixture = JSON.parse(await readFile(new URL("./fixtures/timeline-event.json", import.meta.url), "utf8"));
const reportFixture = JSON.parse(await readFile(new URL("./fixtures/timeline-report.json", import.meta.url), "utf8"));
const fetchedAt = "2026-07-23T11:10:00.000Z";

function fixtures() {
  const event = normalizeEventTimelineItem(eventFixture);
  const report = normalizeReportTimelineItem(reportFixture, fetchedAt);
  return { event, report };
}

test("creates exact canonical, provider, and verified region nodes and edges", () => {
  const { event, report } = fixtures();
  const graph = generateGraph([event, report]);
  assert.deepEqual(
    [...new Set(graph.nodes.map((node) => node.nodeType))].sort(),
    ["event", "location", "report", "source"],
  );
  assert.equal(graph.nodes.filter((node) => node.nodeType === "source").length, 2);
  assert.equal(graph.nodes.filter((node) => node.nodeType === "location").length, 1);
  assert.deepEqual(
    graph.edges.map((edge) => edge.edgeType).sort(),
    ["located_in", "originates_from", "published_by"],
  );
  assert.ok(graph.edges.every((edge) => edge.deterministic && edge.provenance.length));
});

test("graph output is reproducible and prevents duplicate nodes and edges", () => {
  const { event, report } = fixtures();
  const first = generateGraph([report, event, event]);
  const second = generateGraph([event, report, event]);
  assert.deepEqual(first, second);
  assert.equal(new Set(first.nodes.map((node) => node.id)).size, first.nodes.length);
  assert.equal(new Set(first.edges.map((edge) => edge.id)).size, first.edges.length);
  assert.equal(first.generatedAt, report.updatedAt);
});

test("provider isolation keeps official providers separate", () => {
  const { report } = fixtures();
  const esa = {
    ...report,
    id: "timeline:report:esa-fixture",
    relatedReportId: "esa-fixture",
    sourceId: "esa-rss",
    sourceName: "ESA Official RSS",
    sourceUrl: "https://www.esa.int/example/fixture",
    metadata: { ...report.metadata, sourceRecordId: "esa-fixture" },
  };
  const graph = generateGraph([report, esa]);
  const sources = graph.nodes.filter((node) => node.nodeType === "source");
  assert.deepEqual(sources.map((node) => node.canonicalId).sort(), ["esa-rss", "nasa-rss"]);
  assert.equal(graph.edges.filter((edge) => edge.edgeType === "published_by").length, 2);
});

test("links reports only through an exact relatedEventId", () => {
  const { event, report } = fixtures();
  const exactReport = { ...report, relatedEventId: event.relatedEventId };
  const graph = generateGraph([event, exactReport]);
  const edge = graph.edges.find((candidate) => candidate.edgeType === "reports_on");
  assert.equal(edge.ruleId, "related-event-id-exact-v1");
  assert.match(edge.reason, /exactly equals/);
});

test("ignores non-exact event groups and accepts exact provider identifiers", () => {
  const { event, report } = fixtures();
  const group = {
    id: "group-fixture",
    eventAnchor: { id: event.relatedEventId },
    relatedReports: [{
      id: report.relatedReportId,
      provider: report.sourceId,
      originalSource: report.sourceName,
      rawProviderId: report.relatedReportId,
      sourceUrl: report.sourceUrl,
      updatedAt: report.updatedAt,
    }],
    groupingReason: "Fixture exact provider identifier",
    confidence: "strong",
  };
  assert.equal(generateGraph([event, report], [group]).edges.some((edge) => edge.edgeType === "reports_on"), false);
  const exact = generateGraph([event, report], [{ ...group, confidence: "exact" }]);
  assert.equal(exact.edges.some((edge) => edge.ruleId === "exact-provider-identifier-v1"), true);
});

test("links event history by exact ID and official timestamps without merging events", () => {
  const { event } = fixtures();
  const revision = {
    ...event,
    id: `${event.id}:revision`,
    updatedAt: "2026-07-23T10:06:00.000Z",
    title: "Official revised earthquake record",
  };
  const separate = {
    ...event,
    id: `${event.id}:separate`,
    relatedEventId: "evt_usgs_separate",
    updatedAt: "2026-07-23T10:07:00.000Z",
  };
  const graph = generateGraph([revision, separate, event]);
  const updates = graph.edges.filter((edge) => edge.edgeType === "updates");
  assert.equal(updates.length, 2);
  assert.equal(graph.nodes.filter((node) => node.nodeType === "event" && node.canonicalId === "evt_usgs_separate").length, 1);
  assert.deepEqual(
    updates.map((edge) => edge.createdAt).sort(),
    [event.updatedAt, revision.updatedAt],
  );
});

test("region nodes require verified source location and preserve exact coordinates", () => {
  const { event } = fixtures();
  const withoutLocation = { ...event, location: null };
  assert.equal(generateGraph([withoutLocation]).nodes.some((node) => node.nodeType === "location"), false);
  const location = generateGraph([event]).nodes.find((node) => node.nodeType === "location");
  assert.deepEqual(location.coordinates, event.coordinates);
  assert.equal(location.location, event.location);
});

test("filters nodes and edges without leaving dangling relationships", () => {
  const { event, report } = fixtures();
  const graph = generateGraph([event, report]);
  const filtered = filterGraph(graph, {
    nodeTypes: ["event"],
    edgeTypes: [],
    sources: ["usgs-earthquakes"],
    categories: ["earthquake"],
  });
  assert.equal(filtered.nodes.length, 1);
  assert.equal(filtered.edges.length, 0);
});

test("graph query and detail ID validation reject unsupported input", () => {
  assert.equal(parseGraphQuery(new URLSearchParams("nodeType=planet")).ok, false);
  assert.equal(parseGraphQuery(new URLSearchParams("edgeType=similar_to")).ok, false);
  assert.equal(parseGraphQuery(new URLSearchParams("source=unknown")).ok, false);
  assert.equal(parseGraphQuery(new URLSearchParams("extra=true")).ok, false);
  assert.equal(parseGraphQuery(new URLSearchParams("nodeType=event&edgeType=updates")).ok, true);
  const { event } = fixtures();
  const graph = generateGraph([event]);
  const detail = graphForId(graph, event.relatedEventId);
  assert.equal(detail.ok, true);
  assert.deepEqual(detail.snapshot.nodes.map((node) => node.nodeType).sort(), ["event", "location", "source"]);
  assert.deepEqual(graphForId(graph, "not present"), {
    ok: false,
    code: "INVALID_GRAPH_ID",
    message: "Graph id is invalid",
  });
  assert.equal(graphForId(graph, "not-present").code, "NOT_FOUND");
});

test("partial outage metadata is preserved by the graph service contract", async () => {
  const service = await readFile(new URL("../src/lib/graph/graph-service.ts", import.meta.url), "utf8");
  assert.match(service, /status !== "online" \|\| source\.stale/);
  assert.match(service, /sourceHealth: aggregate\.sourceStatus/);
});

test("graph APIs and responsive page expose the production contract", async () => {
  const api = await readFile(new URL("../src/app/api/graph/route.ts", import.meta.url), "utf8");
  const detailApi = await readFile(new URL("../src/app/api/graph/[id]/route.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../src/app/app/graph/[id]/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/app/app/dashboard.css", import.meta.url), "utf8");
  assert.match(api, /parseGraphQuery/);
  assert.match(api, /response\.partial \? 206 : 200/);
  assert.match(detailApi, /getGraphById/);
  assert.match(page, /ATLAS DETERMINISTIC EVENT GRAPH/);
  assert.match(page, /Rule and provenance/);
  assert.match(css, /event-graph-map/);
  assert.match(css, /event-graph-map \{ display: flex; flex-direction: column/);
});
