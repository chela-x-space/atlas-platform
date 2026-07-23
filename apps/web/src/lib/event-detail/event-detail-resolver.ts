import { DATA_SOURCES } from "@/config/data-sources";
import { safeExternalUrl } from "@/lib/security/external-url.mjs";
import { aggregateTimeline } from "@/lib/timeline/timeline-service";
import type { TimelineItem } from "@/lib/timeline/timeline-contract";
import type {
  EventDetail,
  EventDetailError,
  EventDetailProvenance,
  EventDetailRelatedReport,
  EventDetailResponse,
  EventDetailSection,
  EventDetailSourceHealth,
} from "./event-detail-contract";
import {
  hasValidDetailCoordinates,
  createStaleDetailResponse,
  exactRelatedReportIds,
  resolveCanonicalTimelineItem,
  sanitizeDetailMetadata,
  validateEventDetailId,
} from "./event-detail-logic.mjs";

type DetailResolution =
  | { readonly status: "found"; readonly response: EventDetailResponse }
  | { readonly status: "invalid"; readonly code: "INVALID_EVENT_ID"; readonly message: string }
  | { readonly status: "not_found"; readonly code: "NOT_FOUND"; readonly message: string }
  | { readonly status: "unavailable"; readonly code: "EVENT_DETAIL_UNAVAILABLE"; readonly message: string };

type CacheEntry = {
  readonly response: EventDetailResponse;
  readonly expiresAt: number;
  readonly staleUntil: number;
};

const MAX_CACHE_ITEMS = 100;
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<DetailResolution>>();

function cacheTtl(sourceId: string) {
  return sourceId === "nasa-rss" || sourceId === "esa-rss" ? 15 * 60_000 : 60_000;
}

function putCache(key: string, response: EventDetailResponse) {
  if (cache.has(key)) cache.delete(key);
  const ttl = cacheTtl(response.item.sourceId);
  cache.set(key, { response, expiresAt: Date.now() + ttl, staleUntil: Date.now() + ttl + 60 * 60_000 });
  while (cache.size > MAX_CACHE_ITEMS) {
    const oldest = cache.keys().next().value as string | undefined;
    if (!oldest) break;
    cache.delete(oldest);
  }
}

function stringMetadata(item: TimelineItem, key: string): string | null {
  const value = item.metadata[key];
  return typeof value === "string" && value ? value : null;
}

function numberMetadata(item: TimelineItem, key: string): number | null {
  const value = item.metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function canonicalReference(item: TimelineItem) {
  return item.relatedEventId ?? item.relatedReportId;
}

function relatedReportFromTimeline(item: TimelineItem): EventDetailRelatedReport {
  return {
    id: item.relatedReportId!,
    title: item.title,
    sourceId: item.sourceId,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    publishedAt: item.occurredAt,
    attribution: item.attribution,
  };
}

function buildDetailResponse(
  canonicalItem: TimelineItem,
  aggregate: Awaited<ReturnType<typeof aggregateTimeline>>,
): EventDetailResponse {
  const canonicalId = canonicalReference(canonicalItem)!;
  const relatedReportIds = new Set(exactRelatedReportIds(aggregate.eventGroups, canonicalItem));
  const relatedReports = aggregate.items
    .filter((item) => item.relatedReportId && relatedReportIds.has(item.relatedReportId))
    .map(relatedReportFromTimeline)
    .sort((left, right) =>
      Date.parse(right.publishedAt) - Date.parse(left.publishedAt) || left.id.localeCompare(right.id));
  const exactTimelineReferences = new Set<string>([canonicalId, ...relatedReportIds]);
  const relatedTimelineItems = aggregate.items
    .filter((item) => {
      const reference = canonicalReference(item);
      return reference !== null && exactTimelineReferences.has(reference);
    })
    .sort((left, right) =>
      Date.parse(left.occurredAt) - Date.parse(right.occurredAt) || left.id.localeCompare(right.id));
  const metadata = sanitizeDetailMetadata(canonicalItem.metadata);
  const sourceHealth: EventDetailSourceHealth[] = aggregate.sourceStatus.map((source) => {
    const definition = DATA_SOURCES.find((candidate) => candidate.id === source.sourceId);
    return {
      sourceId: source.sourceId,
      sourceName: source.sourceName,
      status: source.status,
      stale: source.stale,
      checkedAt: source.checkedAt,
      errorCode: source.errorCode,
      errorMessage: source.errorMessage,
      documentationUrl: safeExternalUrl(definition?.documentationUrl) ?? null,
    };
  });
  const errors: EventDetailError[] = sourceHealth
    .filter((source) => source.status !== "online" || source.stale)
    .map((source) => ({
      sourceId: source.sourceId,
      code: source.errorCode ?? (source.stale ? "STALE_SOURCE" : source.status.toUpperCase()),
      message: source.errorMessage ?? `${source.sourceName} is ${source.stale ? "stale" : source.status}`,
    }));
  const commonProvenance: EventDetailProvenance = {
    sourceId: canonicalItem.sourceId,
    sourceName: canonicalItem.sourceName,
    sourceUrl: canonicalItem.sourceUrl,
    attribution: canonicalItem.attribution,
  };
  const provenance = Object.fromEntries([
    "title", "summary", "category", "eventType", "status", "severity", "occurredAt",
    "updatedAt", "location", "countries", "coordinates", "depthKilometers",
    "magnitude", "advisoryNumber",
  ].map((field) => [field, commonProvenance]));
  const coordinates = hasValidDetailCoordinates(canonicalItem.coordinates)
    ? canonicalItem.coordinates
    : null;
  const magnitude = numberMetadata(canonicalItem, "magnitude");
  const advisoryValue = canonicalItem.metadata.advisoryNumber;
  const advisoryNumber = typeof advisoryValue === "string" || typeof advisoryValue === "number"
    ? advisoryValue
    : null;
  const hasLocation = Boolean(
    canonicalItem.location || canonicalItem.countries.length || coordinates ||
    magnitude !== null || advisoryNumber !== null,
  );
  const availableSections: EventDetailSection[] = [
    "overview",
    ...(hasLocation ? ["location" as const] : []),
    ...(coordinates ? ["map" as const] : []),
    "source",
    ...(relatedReports.length ? ["related_reports" as const] : []),
    ...(relatedTimelineItems.length ? ["related_timeline" as const] : []),
    ...(Object.keys(metadata).length ? ["metadata" as const] : []),
  ];
  const item: EventDetail = {
    id: canonicalId,
    canonicalType: canonicalItem.itemType === "report"
      ? "verified_report"
      : canonicalItem.itemType === "advisory"
        ? "advisory"
        : "operational_event",
    title: canonicalItem.title,
    summary: canonicalItem.summary,
    category: canonicalItem.category,
    eventType: stringMetadata(canonicalItem, "eventType") ??
      (Array.isArray(canonicalItem.metadata.eventTypes) &&
        typeof canonicalItem.metadata.eventTypes[0] === "string"
        ? canonicalItem.metadata.eventTypes[0]
        : null),
    status: canonicalItem.status,
    severity: canonicalItem.severity,
    verificationStatus: canonicalItem.verificationStatus,
    occurredAt: canonicalItem.occurredAt,
    updatedAt: canonicalItem.updatedAt,
    ingestedAt: canonicalItem.ingestedAt,
    sourceId: canonicalItem.sourceId,
    sourceName: canonicalItem.sourceName,
    sourceUrl: canonicalItem.sourceUrl,
    originalSource: stringMetadata(canonicalItem, "originalSource") ?? canonicalItem.sourceName,
    attribution: canonicalItem.attribution,
    stale: canonicalItem.stale,
    location: canonicalItem.location,
    countries: canonicalItem.countries,
    coordinates,
    depthKilometers: coordinates?.depthKilometers ?? null,
    magnitude,
    advisoryNumber,
    relatedReports,
    relatedTimelineItems,
    metadata,
    provenance,
    availableSections,
  };
  return {
    item,
    relatedReports,
    relatedTimelineItems,
    sourceHealth,
    fetchedAt: aggregate.fetchedAt,
    partial: aggregate.sourceStatus.some((source) => source.status !== "online" || source.stale),
    errors,
  };
}

async function resolveUncached(id: string, staleEntry?: CacheEntry): Promise<DetailResolution> {
  try {
    const aggregate = await aggregateTimeline();
    const requested = aggregate.items.find((item) =>
      item.id === id || item.relatedEventId === id || item.relatedReportId === id);
    if (!requested) {
      const cachedSource = staleEntry && aggregate.sourceStatus.find(
        (source) => source.sourceId === staleEntry.response.item.sourceId,
      );
      if (staleEntry && Date.now() <= staleEntry.staleUntil &&
          cachedSource && cachedSource.status !== "online") {
        return {
          status: "found",
          response: createStaleDetailResponse(staleEntry.response, cachedSource.errorMessage ?? "The source is temporarily unavailable"),
        };
      }
      return { status: "not_found", code: "NOT_FOUND", message: "Event not found" };
    }
    const canonicalItem = resolveCanonicalTimelineItem(aggregate.items, id)!;
    const response = buildDetailResponse(canonicalItem, aggregate);
    putCache(id, response);
    putCache(response.item.id, response);
    for (const item of response.relatedTimelineItems) {
      if (canonicalReference(item) === response.item.id) putCache(item.id, response);
    }
    return { status: "found", response };
  } catch {
    if (staleEntry && Date.now() <= staleEntry.staleUntil) {
      return {
        status: "found",
        response: createStaleDetailResponse(staleEntry.response, "Live detail refresh failed; cached sourced data is shown"),
      };
    }
    return {
      status: "unavailable",
      code: "EVENT_DETAIL_UNAVAILABLE",
      message: "Event detail is temporarily unavailable",
    };
  }
}

export async function resolveEventDetail(rawId: unknown): Promise<DetailResolution> {
  const validated = validateEventDetailId(rawId);
  if (!validated.ok) return { status: "invalid", code: validated.code, message: validated.message };
  const existing = cache.get(validated.id);
  if (existing && Date.now() <= existing.expiresAt) return { status: "found", response: existing.response };
  const pending = inFlight.get(validated.id);
  if (pending) return pending;
  const request = resolveUncached(validated.id, existing).finally(() => inFlight.delete(validated.id));
  inFlight.set(validated.id, request);
  return request;
}
