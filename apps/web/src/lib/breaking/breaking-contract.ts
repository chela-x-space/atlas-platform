import type { TechnologyProvider } from "@/lib/ai-radar/ai-radar-contract";
import type { TimelineSourceStatus } from "@/lib/timeline/timeline-contract";

export const BREAKING_VERSION = "atlas-breaking-news-v1" as const;
export type BreakingCategory = "earthquake"|"weather"|"volcano"|"disaster"|"conflict"|"economy"|"ai"|"cyber"|"space"|"health"|"marine"|"aviation"|"energy";
export type BreakingPriority = "critical"|"high"|"medium"|"information";
export type BreakingEvent = {
  readonly canonicalId:string; readonly category:BreakingCategory; readonly priority:BreakingPriority;
  readonly title:string; readonly providerId:string; readonly providerName:string;
  readonly country:string|null; readonly region:string|null; readonly latitude:number|null; readonly longitude:number|null;
  readonly publishedAt:string; readonly updatedAt:string; readonly verified:true; readonly sourceUrl:string;
  readonly relatedTimelineEvent:string|null; readonly eventDetailUrl:string|null; readonly timelineUrl:string;
  readonly graphUrl:string|null; readonly provenance:{readonly providerId:string;readonly sourceUrl:string;readonly attribution:string;readonly sourceRecordId:string};
};
export type BreakingProviderHealth = {
  readonly providerId:string;readonly providerName:string;readonly status:"operational"|"degraded"|"unavailable"|"configuration_required"|"disabled";
  readonly stale:boolean;readonly itemCount:number;readonly checkedAt:string|null;readonly message:string|null;
};
export type BreakingStatus = {readonly earthquakes:number;readonly storms:number;readonly aiReleases:number;readonly spaceEvents:number};
export type BreakingSnapshot = {
  readonly breakingVersion:typeof BREAKING_VERSION;readonly generatedAt:string;readonly servedAt?:string;
  readonly partial:boolean;readonly stale:boolean;readonly providerCount:number;readonly activeBreakingEvents:number;
  readonly status:BreakingStatus;readonly events:readonly BreakingEvent[];readonly providers:readonly BreakingProviderHealth[];
  readonly inputSummary:{readonly timelineRecords:number;readonly aiReleases:number;readonly excludedRecords:number;readonly duplicateRecords:number};
};
export type BreakingInputs={readonly timelineItems:readonly import("@/lib/timeline/timeline-contract").TimelineItem[];readonly timelineProviders:readonly TimelineSourceStatus[];readonly aiReleases:readonly import("@/lib/ai-radar/ai-radar-contract").TechnologyRelease[];readonly aiProviders:readonly TechnologyProvider[]};
export type BreakingFilters={readonly categories:readonly BreakingCategory[];readonly priorities:readonly BreakingPriority[];readonly country:string;readonly provider:string;readonly limit:number};
