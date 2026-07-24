import { aggregateTimeline } from "@/lib/timeline/timeline-service";
import type {
  GraphFilters,
  GraphResponse,
} from "./graph-contract";
import {
  filterGraph,
  generateGraph,
  graphForId,
} from "./graph-logic.mjs";

type GlobalGraphData = {
  readonly snapshot: ReturnType<typeof generateGraph>;
  readonly aggregate: Awaited<ReturnType<typeof aggregateTimeline>>;
};

const GRAPH_CACHE_TTL_MS = 30_000;
let cachedGraph: { readonly data: GlobalGraphData; readonly expiresAt: number } | null = null;
let graphRequest: Promise<GlobalGraphData> | null = null;

async function getGlobalGraphData(): Promise<GlobalGraphData> {
  if (cachedGraph && Date.now() <= cachedGraph.expiresAt) return cachedGraph.data;
  if (graphRequest) return graphRequest;
  graphRequest = aggregateTimeline()
    .then((aggregate) => {
      const data = {
        snapshot: generateGraph(aggregate.items, aggregate.eventGroups),
        aggregate,
      };
      cachedGraph = { data, expiresAt: Date.now() + GRAPH_CACHE_TTL_MS };
      return data;
    })
    .finally(() => {
      graphRequest = null;
    });
  return graphRequest;
}

function responseMetadata(
  snapshot: ReturnType<typeof generateGraph>,
  aggregate: Awaited<ReturnType<typeof aggregateTimeline>>,
): GraphResponse {
  return {
    ...snapshot,
    partial: aggregate.sourceStatus.some((source) => source.status !== "online" || source.stale),
    sourceHealth: aggregate.sourceStatus,
  };
}

export async function getGraph(filters?: GraphFilters): Promise<GraphResponse> {
  const { aggregate, snapshot } = await getGlobalGraphData();
  const filtered = filters ? filterGraph(snapshot, filters) : snapshot;
  return responseMetadata(filtered, aggregate);
}

export async function getGraphById(rawId: unknown): Promise<
  | { readonly status: "found"; readonly response: GraphResponse }
  | { readonly status: "invalid"; readonly code: "INVALID_GRAPH_ID"; readonly message: string }
  | { readonly status: "not_found"; readonly code: "NOT_FOUND"; readonly message: string }
> {
  const { aggregate, snapshot } = await getGlobalGraphData();
  const result = graphForId(snapshot, rawId);
  if (!result.ok) {
    if (result.code === "NOT_FOUND") {
      return { status: "not_found", code: result.code, message: result.message };
    }
    return { status: "invalid", code: result.code, message: result.message };
  }
  return { status: "found", response: responseMetadata(result.snapshot, aggregate) };
}
