import type { GraphResponse } from "@/lib/graph/graph-contract";
import type { TimelineItem, TimelineSourceStatus } from "@/lib/timeline/timeline-contract";
import type { MetricsQuery, MetricsSnapshot } from "./metrics-contract";

export const METRICS_VERSION: "atlas-global-metrics-v1";
export const METRIC_IDS: readonly string[];
export function activityStatusForValue(value: number | null): import("./metrics-contract").MetricStatus;
export function calculateMetricsSnapshot(input: {
  readonly items: readonly TimelineItem[];
  readonly sourceHealth: readonly TimelineSourceStatus[];
  readonly graph: GraphResponse;
  readonly generatedAt: string;
}): MetricsSnapshot;
export function parseMetricsQuery(searchParams: URLSearchParams):
  | { ok: true; query: MetricsQuery }
  | { ok: false; code: "INVALID_PARAMETERS" | "INVALID_WINDOW" | "INVALID_METRIC"; message: string };
export function filterMetricsSnapshot(snapshot: MetricsSnapshot, query: MetricsQuery): MetricsSnapshot;
