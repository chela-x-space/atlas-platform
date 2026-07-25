import type {SearchDocument} from "@/lib/search/search-contracts";
import type {Watchlist,WatchlistTarget,WatchlistMatch,WatchlistSummary} from "./watchlist-contracts";
export function matchWatchlist(document:SearchDocument,target:WatchlistTarget):string|null;
export function evaluateWatchlists(watchlists:readonly Watchlist[],index:{documents:readonly SearchDocument[];status:{generatedAt:string}},now?:string):WatchlistMatch[];
export function summarizeWatchlists(watchlists:readonly Watchlist[],alerts:readonly WatchlistMatch[],generatedAt:string,warnings?:readonly string[]):WatchlistSummary;
export function sortWatchlists(items:readonly Watchlist[]):Watchlist[];
