import type { NewsEventGroup } from "@/lib/news/provider-contract";
import type { TimelineItem } from "@/lib/timeline/timeline-contract";
import type {
  GraphFilters,
  GraphSnapshot,
} from "./graph-contract";

export const GRAPH_VERSION: "atlas-event-graph-v1";
export const GRAPH_NODE_TYPES: readonly string[];
export const GRAPH_EDGE_TYPES: readonly string[];
export function generateGraph(items: readonly TimelineItem[], eventGroups?: readonly NewsEventGroup[]): GraphSnapshot;
export function parseGraphQuery(searchParams: URLSearchParams):
  | { ok: true; filters: GraphFilters }
  | { ok: false; code: "INVALID_PARAMETERS"; message: string };
export function filterGraph(snapshot: GraphSnapshot, filters: GraphFilters): GraphSnapshot;
export function graphForId(snapshot: GraphSnapshot, rawId: unknown):
  | { ok: true; snapshot: GraphSnapshot }
  | { ok: false; code: "INVALID_GRAPH_ID" | "NOT_FOUND"; message: string };
