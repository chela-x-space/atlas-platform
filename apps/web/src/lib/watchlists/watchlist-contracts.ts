import type {SearchDocument} from "@/lib/search/search-contracts";

export const WATCHLIST_VERSION = "atlas-watchlists-v1.5" as const;
export const WATCHLIST_TARGET_TYPES = ["entity","country","organization","category","provider","risk-level","search-query","location"] as const;
export type WatchlistTargetType = typeof WATCHLIST_TARGET_TYPES[number];
export type WatchlistTarget = {readonly type:WatchlistTargetType;readonly value:string};
export type Watchlist = {readonly id:string;readonly name:string;readonly enabled:boolean;readonly target:WatchlistTarget;readonly createdAt:string;readonly updatedAt:string;readonly lastMatchAt:string|null;readonly totalMatchCount:number};
export type AlertStatus = "NEW"|"READ"|"DISMISSED";
export type WatchlistMatch = {readonly id:string;readonly watchlistId:string;readonly canonicalId:string;readonly timestamp:string;readonly matchingReason:string;readonly status:AlertStatus;readonly document:SearchDocument};
export type WatchlistSummary = {readonly totalWatchlists:number;readonly enabledWatchlists:number;readonly totalAlerts:number;readonly newAlerts:number;readonly readAlerts:number;readonly dismissedAlerts:number;readonly latestMatchAt:string|null;readonly degraded:boolean;readonly warnings:readonly string[];readonly generatedAt:string};
export type WatchlistStatus = {readonly watchlistVersion:typeof WATCHLIST_VERSION;readonly ready:boolean;readonly storage:"process-local";readonly canonicalIndexReady:boolean;readonly indexedDocumentCount:number;readonly generatedAt:string;readonly degraded:boolean;readonly warnings:readonly string[]};
