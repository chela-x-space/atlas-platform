import type {
  AtlasCoordinates,
  AtlasEventCategory,
  AtlasSeverity,
  JsonValue,
} from "@/types/atlas-data";

export type TimelineItemType = "event" | "report" | "advisory";
export type TimelineVerificationStatus = "verified";

export type TimelineItem = {
  readonly id: string;
  readonly itemType: TimelineItemType;
  readonly title: string;
  readonly summary: string;
  readonly category: AtlasEventCategory;
  readonly sourceId: string;
  readonly sourceName: string;
  readonly sourceUrl: string | null;
  readonly occurredAt: string;
  readonly updatedAt: string;
  readonly ingestedAt: string;
  readonly location: string | null;
  readonly countries: readonly string[];
  readonly coordinates: AtlasCoordinates | null;
  readonly severity: AtlasSeverity | null;
  readonly status: string;
  readonly verificationStatus: TimelineVerificationStatus;
  readonly attribution: string;
  readonly stale: boolean;
  readonly relatedEventId: string | null;
  readonly relatedReportId: string | null;
  readonly metadata: Readonly<Record<string, JsonValue>>;
};

export type TimelineSourceStatus = {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly status:
    | "online"
    | "degraded"
    | "paused"
    | "disabled"
    | "configuration_required"
    | "rate_limited"
    | "unavailable";
  readonly stale: boolean;
  readonly itemCount: number;
  readonly checkedAt: string | null;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
};

export type TimelineResponse = {
  readonly items: readonly TimelineItem[];
  readonly total: number;
  readonly returned: number;
  readonly nextCursor: string | null;
  readonly fetchedAt: string;
  readonly activeSources: number;
  readonly staleSources: readonly string[];
  readonly partial: boolean;
  readonly sourceStatus: readonly TimelineSourceStatus[];
};

export type TimelineFilters = {
  readonly limit: number;
  readonly cursor: string | null;
  readonly categories: readonly string[];
  readonly sources: readonly string[];
  readonly itemTypes: readonly TimelineItemType[];
  readonly from: string | null;
  readonly to: string | null;
  readonly search: string;
};
