import { getVerifiedGraphData } from "@/lib/graph/graph-service";
import type {
  SentimentQuery,
  SentimentSnapshot,
} from "./sentiment-contract";
import { calculateSentimentSnapshot } from "./sentiment-logic.mjs";

const SENTIMENT_CACHE_TTL_MS = 60_000;
const SENTIMENT_STALE_TTL_MS = 5 * 60_000;
const cache = new Map<string, {
  readonly snapshot: SentimentSnapshot;
  readonly expiresAt: number;
  readonly staleUntil: number;
}>();
const inFlight = new Map<string, Promise<SentimentSnapshot>>();

function cacheKey(query: SentimentQuery) {
  return `${query.window}|${query.source ?? "all"}`;
}

async function calculateLive(query: SentimentQuery): Promise<SentimentSnapshot> {
  const input = await getVerifiedGraphData();
  const generatedAt = new Date().toISOString();
  return calculateSentimentSnapshot({
    items: input.items,
    sourceHealth: input.graph.sourceHealth,
    generatedAt,
    window: query.window,
    source: query.source,
    limit: 50,
  });
}

export async function getSentiment(query: SentimentQuery): Promise<SentimentSnapshot> {
  const key = cacheKey(query);
  const existing = cache.get(key);
  if (existing && Date.now() <= existing.expiresAt) {
    return { ...existing.snapshot, recentRecords: existing.snapshot.recentRecords.slice(0, query.limit) };
  }
  const pending = inFlight.get(key);
  if (pending) {
    const snapshot = await pending;
    return { ...snapshot, recentRecords: snapshot.recentRecords.slice(0, query.limit) };
  }
  const request = calculateLive(query)
    .then((snapshot) => {
      cache.set(key, {
        snapshot,
        expiresAt: Date.now() + SENTIMENT_CACHE_TTL_MS,
        staleUntil: Date.now() + SENTIMENT_STALE_TTL_MS,
      });
      return snapshot;
    })
    .catch((error) => {
      const fallback = cache.get(key);
      if (fallback && Date.now() <= fallback.staleUntil) {
        return {
          ...fallback.snapshot,
          partial: true,
          stale: true,
          servedAt: new Date().toISOString(),
        };
      }
      throw error;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  const snapshot = await request;
  return { ...snapshot, recentRecords: snapshot.recentRecords.slice(0, query.limit) };
}
