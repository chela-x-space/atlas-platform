import { getAtlasDataHub } from "@/lib/data-hub";
import { getOfficialNews } from "@/lib/news/news-service";
import type { ProviderHealth } from "@/lib/news/provider-contract";
import type { AtlasEventSourceHealth } from "@/types/atlas-data";
import type {
  TimelineFilters,
  TimelineItem,
  TimelineResponse,
  TimelineSourceStatus,
} from "./timeline-contract";
import {
  deduplicateTimelineItems,
  filterTimelineItems,
  normalizeEventTimelineItem,
  normalizeReportTimelineItem,
  paginateTimelineItems,
  summarizeTimelineSources,
} from "./timeline-logic.mjs";

const EVENT_SOURCES = ["usgs-earthquakes", "noaa-nhc"] as const;
const REPORT_SOURCES = ["nasa-rss", "esa-rss"] as const;
const SOURCE_NAMES: Readonly<Record<string, string>> = {
  "usgs-earthquakes": "U.S. Geological Survey",
  "noaa-nhc": "NOAA National Hurricane Center",
  "nasa-rss": "NASA Official RSS",
  "esa-rss": "ESA Official RSS",
};

type AggregatedTimeline = {
  readonly items: TimelineItem[];
  readonly sourceStatus: TimelineSourceStatus[];
  readonly duplicateCount: number;
  readonly fetchedAt: string;
};

function eventSourceStatus(sourceId: string, health?: AtlasEventSourceHealth): TimelineSourceStatus {
  const status = health?.status === "healthy" ? "online" : health?.status ?? "unavailable";
  return {
    sourceId,
    sourceName: SOURCE_NAMES[sourceId] ?? sourceId,
    status,
    stale: false,
    itemCount: health?.itemCount ?? 0,
    checkedAt: health?.checkedAt ?? null,
    errorCode: health?.errorCode ?? (health ? null : "SOURCE_UNAVAILABLE"),
    errorMessage: health?.message ?? (health ? null : "Event source health was unavailable"),
  };
}

function reportSourceStatus(sourceId: string, health?: ProviderHealth): TimelineSourceStatus {
  return {
    sourceId,
    sourceName: health?.name ?? SOURCE_NAMES[sourceId] ?? sourceId,
    status: health?.status ?? "unavailable",
    stale: health?.stale ?? false,
    itemCount: health?.reportCount ?? 0,
    checkedAt: health?.lastCheckedAt ?? null,
    errorCode: health?.errorCode ?? (health ? null : "SOURCE_UNAVAILABLE"),
    errorMessage: health?.errorMessage ?? (health ? null : "News source health was unavailable"),
  };
}

export async function aggregateTimeline(): Promise<AggregatedTimeline> {
  const fetchedAt = new Date().toISOString();
  const hub = getAtlasDataHub();
  const [eventResult, reportResult] = await Promise.allSettled([
    (async () => {
      await hub.refreshSources();
      const page = await hub.queryEvents({ sourceIds: EVENT_SOURCES, limit: 500 });
      return { events: page.events, health: hub.getSourceHealth() };
    })(),
    getOfficialNews(),
  ]);

  const eventHealth = eventResult.status === "fulfilled" ? eventResult.value.health : [];
  const reportHealth = reportResult.status === "fulfilled" ? reportResult.value.sources : [];
  const sourceStatus = [
    ...EVENT_SOURCES.map((sourceId) =>
      eventSourceStatus(sourceId, eventHealth.find((health) => health.sourceId === sourceId))),
    ...REPORT_SOURCES.map((sourceId) =>
      reportSourceStatus(sourceId, reportHealth.find((health) => health.provider === sourceId))),
  ];
  const staleBySource = new Map(sourceStatus.map((source) => [source.sourceId, source.stale]));
  const eventItems = eventResult.status === "fulfilled"
    ? eventResult.value.events
      .map((event) => normalizeEventTimelineItem(event, staleBySource.get(event.sourceId) ?? false))
      .filter((item): item is TimelineItem => item !== null)
    : [];
  const reportItems = reportResult.status === "fulfilled"
    ? reportResult.value.items
      .filter((report) => REPORT_SOURCES.includes(report.sourceId as typeof REPORT_SOURCES[number]))
      .map((report) => normalizeReportTimelineItem(
        report,
        reportResult.value.fetchedAt,
        staleBySource.get(report.sourceId) ?? false,
      ))
      .filter((item): item is TimelineItem => item !== null)
    : [];
  const deduplicated = deduplicateTimelineItems([...eventItems, ...reportItems]);
  return {
    items: deduplicated.items,
    sourceStatus,
    duplicateCount: deduplicated.duplicates.length,
    fetchedAt,
  };
}

export async function getTimeline(filters: TimelineFilters): Promise<
  | { ok: true; response: TimelineResponse }
  | { ok: false; code: "INVALID_CURSOR"; message: string }
> {
  const aggregate = await aggregateTimeline();
  const filtered = filterTimelineItems(aggregate.items, filters);
  const page = paginateTimelineItems(filtered, filters.limit, filters.cursor);
  if (!page.ok) return { ok: false, code: page.error, message: "The timeline cursor is invalid" };
  const { activeSources, staleSources, partial } = summarizeTimelineSources(aggregate.sourceStatus);
  return {
    ok: true,
    response: {
      items: page.items,
      total: filtered.length,
      returned: page.items.length,
      nextCursor: page.nextCursor,
      fetchedAt: aggregate.fetchedAt,
      activeSources,
      staleSources,
      partial,
      sourceStatus: aggregate.sourceStatus,
    },
  };
}
