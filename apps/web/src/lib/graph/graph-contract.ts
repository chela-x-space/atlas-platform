import type {
  AtlasCoordinates,
  AtlasEventCategory,
  JsonValue,
} from "@/types/atlas-data";
import type { TimelineSourceStatus } from "@/lib/timeline/timeline-contract";

export const GRAPH_VERSION = "atlas-event-graph-v1" as const;

export type GraphNodeType = "event" | "report" | "advisory" | "location" | "source";
export type GraphEdgeType =
  | "reports_on"
  | "originates_from"
  | "located_in"
  | "published_by"
  | "updates"
  | "references"
  | "related_exact";

export type GraphProvenance = {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly sourceRecordId: string | null;
  readonly sourceUrl: string | null;
  readonly field: string;
  readonly value: JsonValue;
};

export type GraphNode = {
  readonly id: string;
  readonly nodeType: GraphNodeType;
  readonly canonicalId: string;
  readonly title: string;
  readonly sourceId: string | null;
  readonly sourceName: string | null;
  readonly category: AtlasEventCategory | null;
  readonly occurredAt: string | null;
  readonly updatedAt: string | null;
  readonly location: string | null;
  readonly coordinates: AtlasCoordinates | null;
  readonly metadata: Readonly<Record<string, JsonValue>>;
};

export type GraphEdge = {
  readonly id: string;
  readonly edgeType: GraphEdgeType;
  readonly fromNode: string;
  readonly toNode: string;
  readonly ruleId: string;
  readonly reason: string;
  readonly createdAt: string;
  readonly provenance: readonly GraphProvenance[];
  readonly deterministic: true;
};

export type GraphSnapshot = {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly generatedAt: string;
  readonly graphVersion: typeof GRAPH_VERSION;
};

export type GraphResponse = GraphSnapshot & {
  readonly partial: boolean;
  readonly sourceHealth: readonly TimelineSourceStatus[];
};

export type GraphFilters = {
  readonly nodeTypes: readonly GraphNodeType[];
  readonly edgeTypes: readonly GraphEdgeType[];
  readonly sources: readonly string[];
  readonly categories: readonly AtlasEventCategory[];
};
