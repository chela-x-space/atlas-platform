import type { JsonValue } from "@/types/atlas-data";
import type { EventDetailResponse } from "./event-detail-contract";
import type { NewsEventGroup } from "@/lib/news/provider-contract";
import type { TimelineItem } from "@/lib/timeline/timeline-contract";

export function validateEventDetailId(id: unknown):
  | { ok: true; id: string }
  | { ok: false; code: "INVALID_EVENT_ID"; message: string };
export function sanitizeDetailMetadata(
  metadata: unknown,
): Readonly<Record<string, JsonValue>>;
export function hasValidDetailCoordinates(
  coordinates: unknown,
): coordinates is { longitude: number; latitude: number };
export function resolveCanonicalTimelineItem(
  items: readonly TimelineItem[],
  id: string,
): TimelineItem | null;
export function exactRelatedReportIds(
  groups: readonly NewsEventGroup[],
  item: TimelineItem,
): string[];
export function createStaleDetailResponse(
  response: EventDetailResponse,
  message: string,
): EventDetailResponse;
