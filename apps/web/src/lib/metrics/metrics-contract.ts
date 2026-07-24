import type { JsonValue } from "@/types/atlas-data";
import type { TimelineSourceStatus } from "@/lib/timeline/timeline-contract";

export const METRICS_VERSION = "atlas-global-metrics-v1" as const;
export type MetricStatus = "normal" | "elevated" | "high" | "unavailable" | "partial";
export type MetricCompleteness = "complete" | "partial" | "unavailable";
export type MetricWindow = "1h" | "24h" | "7d";

export type MetricProvenance = {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly status: string;
  readonly stale: boolean;
  readonly inputCount: number;
};

export type GlobalMetric = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly value: number | null;
  readonly unit: string;
  readonly status: MetricStatus;
  readonly completeness: MetricCompleteness;
  readonly window: MetricWindow | null;
  readonly formulaId: string;
  readonly formulaVersion: "1.0.0";
  readonly generatedAt: string;
  readonly inputCount: number;
  readonly sourceIds: readonly string[];
  readonly provenance: readonly MetricProvenance[];
  readonly breakdown: Readonly<Record<string, JsonValue>>;
  readonly limitations: readonly string[];
};

export type ActivityComponent = {
  readonly id: "earth-activity" | "cyclone-activity" | "space-activity";
  readonly label: string;
  readonly rawValue: number | null;
  readonly normalizedValue: number | null;
  readonly weight: number;
  readonly contribution: number | null;
  readonly sourceIds: readonly string[];
  readonly completeness: MetricCompleteness;
  readonly breakdown: Readonly<Record<string, JsonValue>>;
  readonly limitations: readonly string[];
};

export type ActivityIndex = {
  readonly id: "planet-activity-index";
  readonly value: number | null;
  readonly maximum: 100;
  readonly status: MetricStatus;
  readonly formulaId: "planet-activity-index-v1";
  readonly formulaVersion: "1.0.0";
  readonly components: readonly ActivityComponent[];
  readonly completeness: MetricCompleteness;
  readonly explanation: string;
};

export type MetricsInputSummary = {
  readonly verifiedTimelineItems: number;
  readonly uniqueTimelineItems: number;
  readonly eventRecords: number;
  readonly reportRecords: number;
  readonly graphNodes: number;
  readonly graphEdges: number;
  readonly windowBoundaries: {
    readonly "1h": string;
    readonly "24h": string;
    readonly "7d": string;
  };
};

export type MetricsSnapshot = {
  readonly metricsVersion: typeof METRICS_VERSION;
  readonly generatedAt: string;
  readonly servedAt?: string;
  readonly partial: boolean;
  readonly stale: boolean;
  readonly sourceHealth: readonly TimelineSourceStatus[];
  readonly metrics: readonly GlobalMetric[];
  readonly activityIndex: ActivityIndex;
  readonly inputSummary: MetricsInputSummary;
};

export type MetricsQuery = {
  readonly window: MetricWindow | null;
  readonly metric: string | null;
};
