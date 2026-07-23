import type {
  AtlasCoordinates,
  AtlasEventCategory,
  AtlasSeverity,
  JsonValue,
} from "@/types/atlas-data";
import type {
  TimelineItem,
  TimelineVerificationStatus,
} from "@/lib/timeline/timeline-contract";

export type EventDetailCanonicalType =
  | "operational_event"
  | "verified_report"
  | "advisory";

export type EventDetailProvenance = {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly sourceUrl: string | null;
  readonly attribution: string;
};

export type EventDetailRelatedReport = {
  readonly id: string;
  readonly title: string;
  readonly sourceId: string;
  readonly sourceName: string;
  readonly sourceUrl: string | null;
  readonly publishedAt: string;
  readonly attribution: string;
};

export type EventDetailSection =
  | "overview"
  | "location"
  | "map"
  | "source"
  | "related_reports"
  | "related_timeline"
  | "metadata";

export type EventDetail = {
  readonly id: string;
  readonly canonicalType: EventDetailCanonicalType;
  readonly title: string;
  readonly summary: string;
  readonly category: AtlasEventCategory;
  readonly eventType: string | null;
  readonly status: string;
  readonly severity: AtlasSeverity | null;
  readonly verificationStatus: TimelineVerificationStatus;
  readonly occurredAt: string;
  readonly updatedAt: string;
  readonly ingestedAt: string;
  readonly sourceId: string;
  readonly sourceName: string;
  readonly sourceUrl: string | null;
  readonly originalSource: string;
  readonly attribution: string;
  readonly stale: boolean;
  readonly location: string | null;
  readonly countries: readonly string[];
  readonly coordinates: AtlasCoordinates | null;
  readonly depthKilometers: number | null;
  readonly magnitude: number | null;
  readonly advisoryNumber: string | number | null;
  readonly relatedReports: readonly EventDetailRelatedReport[];
  readonly relatedTimelineItems: readonly TimelineItem[];
  readonly metadata: Readonly<Record<string, JsonValue>>;
  readonly provenance: Readonly<Record<string, EventDetailProvenance>>;
  readonly availableSections: readonly EventDetailSection[];
};

export type EventDetailSourceHealth = {
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
  readonly checkedAt: string | null;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly documentationUrl: string | null;
};

export type EventDetailError = {
  readonly sourceId: string | null;
  readonly code: string;
  readonly message: string;
};

export type EventDetailResponse = {
  readonly item: EventDetail;
  readonly relatedReports: readonly EventDetailRelatedReport[];
  readonly relatedTimelineItems: readonly TimelineItem[];
  readonly sourceHealth: readonly EventDetailSourceHealth[];
  readonly fetchedAt: string;
  readonly partial: boolean;
  readonly errors: readonly EventDetailError[];
};
