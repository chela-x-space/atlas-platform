import { safeExternalUrl } from "../security/external-url.mjs";

const ITEM_TYPES = new Set(["event", "report", "advisory"]);
const SOURCES = new Set(["usgs-earthquakes", "noaa-nhc", "nasa-rss", "esa-rss"]);
const CATEGORIES = new Set([
  "earthquake", "cyclone", "weather", "climate", "space", "science",
  "earth-observation", "technology", "news", "health", "wildfire", "flood",
  "volcano", "conflict", "aviation", "marine", "market", "cyber", "energy", "unknown",
]);
const PARAMETERS = new Set(["limit", "cursor", "category", "source", "itemType", "from", "to", "search"]);
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;
const TITLE_WINDOW_MS = 5 * 60 * 1000;

function validInstant(value) {
  return typeof value === "string" && value.length <= 64 && Number.isFinite(Date.parse(value));
}

function values(value) {
  return value ? [...new Set(value.split(",").map((part) => part.trim()).filter(Boolean))] : [];
}

function safeMetadata(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function normalizeEventTimelineItem(event, stale = false) {
  if (!event || !validInstant(event.occurredAt) || !validInstant(event.updatedAt) || !validInstant(event.ingestedAt)) return null;
  if (typeof event.id !== "string" || typeof event.title !== "string" || !event.title.trim()) return null;
  const sourceUrl = event.sourceUrl === undefined ? null : safeExternalUrl(event.sourceUrl);
  if (event.sourceUrl !== undefined && !sourceUrl) return null;
  const advisory = event.sourceId === "noaa-nhc" && event.category === "cyclone";
  return {
    id: `timeline:event:${event.id}:${event.updatedAt}`,
    itemType: advisory ? "advisory" : "event",
    title: event.title,
    summary: event.summary,
    category: event.category,
    sourceId: event.sourceId,
    sourceName: event.sourceName,
    sourceUrl,
    occurredAt: event.occurredAt,
    updatedAt: event.updatedAt,
    ingestedAt: event.ingestedAt,
    location: event.region ?? null,
    countries: event.countryCode ? [event.countryCode] : [],
    coordinates: event.coordinates ?? null,
    severity: event.severity ?? null,
    status: event.status,
    verificationStatus: "verified",
    attribution: event.attribution,
    stale: Boolean(stale),
    relatedEventId: event.id,
    relatedReportId: null,
    metadata: {
      ...safeMetadata(event.metadata),
      sourceRecordId: event.sourceItemId ?? event.id,
      eventType: event.type,
    },
  };
}

export function normalizeReportTimelineItem(report, fetchedAt, stale = false) {
  if (!report || !validInstant(report.publishedAt) || !validInstant(report.updatedAt ?? report.publishedAt) || !validInstant(fetchedAt)) return null;
  if (typeof report.id !== "string" || typeof report.title !== "string" || !report.title.trim()) return null;
  const sourceUrl = safeExternalUrl(report.sourceUrl) ?? safeExternalUrl(report.canonicalUrl);
  if (!sourceUrl) return null;
  return {
    id: `timeline:report:${report.id}`,
    itemType: "report",
    title: report.title,
    summary: report.summary,
    category: report.category,
    sourceId: report.sourceId,
    sourceName: report.sourceName,
    sourceUrl,
    occurredAt: report.publishedAt,
    updatedAt: report.updatedAt ?? report.publishedAt,
    ingestedAt: fetchedAt,
    location: null,
    countries: Array.isArray(report.countries) ? report.countries : [],
    coordinates: null,
    severity: null,
    status: "published",
    verificationStatus: "verified",
    attribution: report.attribution ?? report.sourceName,
    stale: Boolean(stale),
    relatedEventId: null,
    relatedReportId: report.id,
    metadata: {
      sourceRecordId: report.id,
      canonicalUrl: report.canonicalUrl ?? sourceUrl,
      originalSource: report.originalSource ?? report.sourceName,
      language: report.language ?? "und",
      eventTypes: Array.isArray(report.eventTypes) ? report.eventTypes : [],
    },
  };
}

export function sortTimelineItems(items) {
  return [...items].sort((left, right) =>
    Date.parse(right.occurredAt) - Date.parse(left.occurredAt) || left.id.localeCompare(right.id));
}

function normalizedTitle(value) {
  return value.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function deduplicateTimelineItems(input) {
  const items = [];
  const duplicates = [];
  const ids = new Map();
  const urls = new Map();
  const records = new Map();
  const fallback = [];
  for (const item of sortTimelineItems(input)) {
    const canonicalUrl = typeof item.metadata.canonicalUrl === "string" ? item.metadata.canonicalUrl : item.sourceUrl;
    const recordId = typeof item.metadata.sourceRecordId === "string" ? item.metadata.sourceRecordId : null;
    let retained;
    let reason;
    if (ids.has(item.id)) {
      retained = ids.get(item.id);
      reason = "exact_id";
    } else if (canonicalUrl && urls.has(canonicalUrl)) {
      const candidate = urls.get(canonicalUrl);
      const distinctRevision = candidate.itemType !== "report" && item.itemType !== "report" &&
        (candidate.occurredAt !== item.occurredAt || candidate.updatedAt !== item.updatedAt);
      if (!distinctRevision) {
        retained = candidate;
        reason = "canonical_url";
      }
    }
    if (!retained && recordId && records.has(`${item.sourceId}:${recordId}`)) {
      const candidate = records.get(`${item.sourceId}:${recordId}`);
      const distinctRevision = candidate.itemType !== "report" && item.itemType !== "report" &&
        (candidate.occurredAt !== item.occurredAt || candidate.updatedAt !== item.updatedAt);
      if (!distinctRevision) {
        retained = candidate;
        reason = "provider_record_id";
      }
    }
    if (!retained) {
      const title = normalizedTitle(item.title);
      retained = fallback.find((candidate) =>
        candidate.sourceId === item.sourceId &&
        candidate.itemType === item.itemType &&
        normalizedTitle(candidate.title) === title &&
        (item.itemType === "report"
          ? Math.abs(Date.parse(candidate.occurredAt) - Date.parse(item.occurredAt)) <= TITLE_WINDOW_MS
          : candidate.occurredAt === item.occurredAt && candidate.updatedAt === item.updatedAt));
      if (retained) reason = "title_time_window";
    }
    if (retained && reason) {
      duplicates.push({ duplicateId: item.id, retainedId: retained.id, reason });
      continue;
    }
    items.push(item);
    ids.set(item.id, item);
    if (canonicalUrl) urls.set(canonicalUrl, item);
    if (recordId) records.set(`${item.sourceId}:${recordId}`, item);
    fallback.push(item);
  }
  return { items, duplicates };
}

export function filterTimelineItems(items, filters) {
  const search = filters.search.trim().toLowerCase();
  return sortTimelineItems(items).filter((item) => {
    if (filters.categories.length && !filters.categories.includes(item.category)) return false;
    if (filters.sources.length && !filters.sources.includes(item.sourceId)) return false;
    if (filters.itemTypes.length && !filters.itemTypes.includes(item.itemType)) return false;
    if (filters.from && Date.parse(item.occurredAt) < Date.parse(filters.from)) return false;
    if (filters.to && Date.parse(item.occurredAt) > Date.parse(filters.to)) return false;
    if (search && ![
      item.title, item.summary, item.sourceName, item.sourceId, item.category,
      item.location ?? "", ...item.countries, item.attribution,
    ].join(" ").toLowerCase().includes(search)) return false;
    return true;
  });
}

function encodeCursor(item) {
  return Buffer.from(JSON.stringify({ occurredAt: item.occurredAt, id: item.id })).toString("base64url");
}

function decodeCursor(cursor) {
  try {
    if (typeof cursor !== "string" || !cursor || cursor.length > 500) return null;
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    return validInstant(value.occurredAt) && typeof value.id === "string" ? value : null;
  } catch {
    return null;
  }
}

export function paginateTimelineItems(items, limit, cursor) {
  const ordered = sortTimelineItems(items);
  let start = 0;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) return { ok: false, error: "INVALID_CURSOR" };
    const index = ordered.findIndex((item) => item.id === decoded.id && item.occurredAt === decoded.occurredAt);
    if (index < 0) return { ok: false, error: "INVALID_CURSOR" };
    start = index + 1;
  }
  const page = ordered.slice(start, start + limit);
  const hasMore = start + page.length < ordered.length;
  return { ok: true, items: page, nextCursor: hasMore && page.length ? encodeCursor(page.at(-1)) : null };
}

export function summarizeTimelineSources(sources) {
  return {
    activeSources: sources.filter((source) => source.status === "online" || source.status === "degraded").length,
    staleSources: sources.filter((source) => source.stale).map((source) => source.sourceId),
    partial: sources.some((source) => source.status !== "online" || source.stale),
  };
}

export function parseTimelineQuery(searchParams) {
  for (const key of searchParams.keys()) {
    if (!PARAMETERS.has(key)) return { ok: false, code: "INVALID_PARAMETERS", message: `Unsupported parameter: ${key}` };
  }
  const limitValue = searchParams.get("limit");
  const limit = limitValue === null ? DEFAULT_LIMIT : Number(limitValue);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return { ok: false, code: "INVALID_PARAMETERS", message: `limit must be an integer from 1 to ${MAX_LIMIT}` };
  }
  const categories = values(searchParams.get("category"));
  const sources = values(searchParams.get("source"));
  const itemTypes = values(searchParams.get("itemType"));
  if (categories.some((value) => !CATEGORIES.has(value))) return { ok: false, code: "INVALID_PARAMETERS", message: "category contains an unsupported value" };
  if (sources.some((value) => !SOURCES.has(value))) return { ok: false, code: "INVALID_PARAMETERS", message: "source contains an unsupported value" };
  if (itemTypes.some((value) => !ITEM_TYPES.has(value))) return { ok: false, code: "INVALID_PARAMETERS", message: "itemType contains an unsupported value" };
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from && !validInstant(from)) return { ok: false, code: "INVALID_PARAMETERS", message: "from must be a valid timestamp" };
  if (to && !validInstant(to)) return { ok: false, code: "INVALID_PARAMETERS", message: "to must be a valid timestamp" };
  if (from && to && Date.parse(from) > Date.parse(to)) return { ok: false, code: "INVALID_PARAMETERS", message: "from must not be later than to" };
  const search = searchParams.get("search") ?? "";
  if (search.length > 200) return { ok: false, code: "INVALID_PARAMETERS", message: "search must be 200 characters or fewer" };
  const cursor = searchParams.get("cursor");
  if (cursor !== null && (!cursor || cursor.length > 500)) return { ok: false, code: "INVALID_PARAMETERS", message: "cursor is invalid" };
  return {
    ok: true,
    filters: { limit, cursor, categories, sources, itemTypes, from, to, search },
  };
}
