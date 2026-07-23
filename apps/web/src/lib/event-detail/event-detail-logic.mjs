import { safeExternalUrl } from "../security/external-url.mjs";

const BLOCKED_KEYS = /(?:authorization|cache|cookie|credential|password|raw|secret|stack|token)/i;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,299}$/;

export function validateEventDetailId(value) {
  if (typeof value !== "string" || !ID_PATTERN.test(value) ||
      value.includes("..") || value.includes("/") || value.includes("\\") || value.includes("%")) {
    return { ok: false, code: "INVALID_EVENT_ID", message: "Invalid event detail ID" };
  }
  return { ok: true, id: value };
}

function safeValue(value) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const text = value.slice(0, 500);
    if (/^[a-z][a-z0-9+.-]*:/i.test(text) && !safeExternalUrl(text)) return undefined;
    return text;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).flatMap((item) => {
      const safe = safeValue(item);
      return safe === undefined || (typeof safe === "object" && safe !== null) ? [] : [safe];
    });
  }
  return undefined;
}

export function sanitizeDetailMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  const sanitized = {};
  for (const [key, value] of Object.entries(metadata).slice(0, 40)) {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(key) || BLOCKED_KEYS.test(key)) continue;
    const safe = safeValue(value);
    if (safe !== undefined) sanitized[key] = safe;
  }
  return sanitized;
}

export function hasValidDetailCoordinates(coordinates) {
  if (!coordinates || typeof coordinates !== "object") return false;
  const { longitude, latitude } = coordinates;
  return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 &&
    Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}

function canonicalReference(item) {
  return item.relatedEventId ?? item.relatedReportId;
}

export function resolveCanonicalTimelineItem(items, id) {
  const requested = items.find((item) =>
    item.id === id || item.relatedEventId === id || item.relatedReportId === id);
  if (!requested) return null;
  const reference = canonicalReference(requested);
  return [...items]
    .filter((item) => canonicalReference(item) === reference)
    .sort((left, right) =>
      Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || left.id.localeCompare(right.id))[0] ?? null;
}

export function exactRelatedReportIds(groups, item) {
  return [...new Set(groups.filter((group) => {
    if (group.confidence !== "exact") return false;
    if (item.relatedEventId) return group.eventAnchor?.id === item.relatedEventId;
    return group.relatedReports.some((report) => report.id === item.relatedReportId);
  }).flatMap((group) => group.relatedReports.map((report) => report.id))
    .filter((id) => id !== item.relatedReportId))];
}

export function createStaleDetailResponse(response, message) {
  const sourceHealth = response.sourceHealth.map((source) =>
    source.sourceId === response.item.sourceId
      ? {
          ...source,
          status: "unavailable",
          stale: true,
          errorCode: "STALE_CACHE_FALLBACK",
          errorMessage: message,
        }
      : source);
  return {
    ...response,
    item: {
      ...response.item,
      stale: true,
      relatedTimelineItems: response.item.relatedTimelineItems.map((item) => ({ ...item, stale: true })),
    },
    relatedTimelineItems: response.relatedTimelineItems.map((item) => ({ ...item, stale: true })),
    sourceHealth,
    fetchedAt: new Date().toISOString(),
    partial: true,
    errors: [
      ...response.errors,
      { sourceId: response.item.sourceId, code: "STALE_CACHE_FALLBACK", message },
    ],
  };
}
