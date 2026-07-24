import { getGraphDataForMetrics } from "@/lib/graph/graph-service";
import type {
  MetricsQuery,
  MetricsSnapshot,
} from "./metrics-contract";
import {
  calculateMetricsSnapshot,
  filterMetricsSnapshot,
} from "./metrics-logic.mjs";

const METRICS_CACHE_TTL_MS = 60_000;
const METRICS_STALE_TTL_MS = 5 * 60_000;
let cached: {
  readonly snapshot: MetricsSnapshot;
  readonly expiresAt: number;
  readonly staleUntil: number;
} | null = null;
let inFlight: Promise<MetricsSnapshot> | null = null;

async function calculateLiveSnapshot(): Promise<MetricsSnapshot> {
  const input = await getGraphDataForMetrics();
  const generatedAt = new Date().toISOString();
  return calculateMetricsSnapshot({
    items: input.items,
    sourceHealth: input.graph.sourceHealth,
    graph: input.graph,
    generatedAt,
  });
}

async function getSnapshot(): Promise<MetricsSnapshot> {
  const now = Date.now();
  if (cached && now <= cached.expiresAt) return cached.snapshot;
  if (inFlight) return inFlight;
  inFlight = calculateLiveSnapshot()
    .then((snapshot) => {
      cached = {
        snapshot,
        expiresAt: Date.now() + METRICS_CACHE_TTL_MS,
        staleUntil: Date.now() + METRICS_STALE_TTL_MS,
      };
      return snapshot;
    })
    .catch((error) => {
      if (cached && Date.now() <= cached.staleUntil) {
        return {
          ...cached.snapshot,
          partial: true,
          stale: true,
          servedAt: new Date().toISOString(),
        };
      }
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export async function getMetrics(query?: MetricsQuery): Promise<MetricsSnapshot> {
  const snapshot = await getSnapshot();
  return query ? filterMetricsSnapshot(snapshot, query) : snapshot;
}
