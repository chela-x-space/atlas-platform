import type { AtlasEvent, AtlasEventCategory } from "@/types/atlas-data";

export type NewsProviderStatus =
  | "online"
  | "degraded"
  | "paused"
  | "disabled"
  | "configuration_required"
  | "rate_limited"
  | "unavailable";

export type NewsProviderType = "api" | "rss" | "event-anchor";
export type VerificationStatus = "verified";
export type GroupingConfidence = "exact" | "strong" | "probable" | "standalone";
export type DuplicateReason = "canonical_url" | "provider_id" | "title_source_window" | "content_fingerprint";

export type NormalizedVerifiedReport = {
  readonly id: string;
  readonly canonicalUrl: string;
  readonly title: string;
  readonly summary: string;
  readonly provider: string;
  readonly originalSource: string;
  readonly sourceUrl: string;
  readonly publishedAt: string;
  readonly updatedAt: string;
  readonly fetchedAt: string;
  readonly category: AtlasEventCategory;
  readonly countries: readonly string[];
  readonly locations: readonly string[];
  readonly disasterIds: readonly string[];
  readonly eventTypes: readonly string[];
  readonly language: string;
  readonly attribution: string;
  readonly verificationStatus: VerificationStatus;
  readonly sourceCount: number;
  readonly rawProviderId: string;
  readonly contentFingerprint: string;
};

export type ProviderHealth = {
  readonly provider: string;
  readonly name: string;
  readonly status: NewsProviderStatus;
  readonly lastCheckedAt: string | null;
  readonly lastSuccessfulAt: string | null;
  readonly stale: boolean;
  readonly reportCount: number;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly configurationRequirement: string | null;
  readonly attribution: string;
  readonly documentationUrl: string;
  readonly rateLimit: {
    readonly requests?: number;
    readonly window?: "day" | "hour" | "minute";
    readonly maxItemsPerRequest?: number;
  };
};

export type ProviderFetchResult = {
  readonly reports: readonly NormalizedVerifiedReport[];
  readonly health: ProviderHealth;
};

export interface NewsProvider {
  readonly id: string;
  readonly name: string;
  readonly providerType: NewsProviderType;
  readonly status: NewsProviderStatus;
  readonly attribution: string;
  readonly documentationUrl: string;
  readonly lastCheckedAt: string | null;
  readonly lastSuccessfulAt: string | null;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly rateLimit: ProviderHealth["rateLimit"];
  fetchReports(): Promise<ProviderFetchResult>;
  healthCheck(): Promise<ProviderHealth>;
}

export type NewsEventGroup = {
  readonly id: string;
  readonly eventAnchor: AtlasEvent | null;
  readonly relatedReports: readonly NormalizedVerifiedReport[];
  readonly distinctSourceCount: number;
  readonly newestPublicationTime: string;
  readonly categories: readonly AtlasEventCategory[];
  readonly countries: readonly string[];
  readonly confidence: GroupingConfidence;
  readonly groupingReason: string;
};
