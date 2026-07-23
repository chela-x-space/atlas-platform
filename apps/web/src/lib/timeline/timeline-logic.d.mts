import type { AtlasEvent, AtlasNewsItem } from "@/types/atlas-data";
import type {
  TimelineFilters,
  TimelineItem,
  TimelineSourceStatus,
} from "./timeline-contract";

export type TimelineDuplicate = {
  readonly duplicateId: string;
  readonly retainedId: string;
  readonly reason: "exact_id" | "canonical_url" | "provider_record_id" | "title_time_window";
};

export function normalizeEventTimelineItem(event: AtlasEvent, stale?: boolean): TimelineItem | null;
export function normalizeReportTimelineItem(
  report: AtlasNewsItem,
  fetchedAt: string,
  stale?: boolean,
): TimelineItem | null;
export function sortTimelineItems(items: readonly TimelineItem[]): TimelineItem[];
export function deduplicateTimelineItems(items: readonly TimelineItem[]): {
  items: TimelineItem[];
  duplicates: TimelineDuplicate[];
};
export function filterTimelineItems(items: readonly TimelineItem[], filters: TimelineFilters): TimelineItem[];
export function paginateTimelineItems(
  items: readonly TimelineItem[],
  limit: number,
  cursor: string | null,
): { ok: true; items: TimelineItem[]; nextCursor: string | null } | { ok: false; error: "INVALID_CURSOR" };
export function summarizeTimelineSources(sources: readonly TimelineSourceStatus[]): {
  activeSources: number;
  staleSources: string[];
  partial: boolean;
};
export function parseTimelineQuery(searchParams: URLSearchParams):
  | { ok: true; filters: TimelineFilters }
  | { ok: false; code: "INVALID_PARAMETERS"; message: string };
