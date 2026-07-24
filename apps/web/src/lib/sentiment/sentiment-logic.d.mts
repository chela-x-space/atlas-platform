import type { TimelineItem, TimelineSourceStatus } from "@/lib/timeline/timeline-contract";
import type { SentimentLabel, SentimentQuery, SentimentSnapshot, SentimentWindow } from "./sentiment-contract";
export const SENTIMENT_VERSION: "atlas-global-sentiment-v1";
export const SENTIMENT_FORMULA_ID: "global-sentiment-index-v1";
export const SENTIMENT_FORMULA_VERSION: "1.0.0";
export const SENTIMENT_SOURCES: readonly string[];
export function normalizeSentimentText(value: unknown): string;
export function labelSentimentScore(value: number | null): SentimentLabel;
export function labelGlobalSentiment(value: number | null): SentimentLabel;
export function scoreSentimentText(fields: readonly { field: string; normalized: string }[]): {
  matchedPositiveTerms: string[]; matchedNegativeTerms: string[]; matchedIntensifiers: string[]; matchedNegations: string[];
  positiveWeight: number; negativeWeight: number; netScore: number; normalizedScore: number; label: SentimentLabel;
} | null;
export function sentimentRecencyWeight(window: SentimentWindow, ageMs: number): number;
export function calculateSentimentSnapshot(input: {
  items: readonly TimelineItem[]; sourceHealth: readonly TimelineSourceStatus[];
  generatedAt: string; window?: SentimentWindow; source?: string | null; limit?: number;
}): SentimentSnapshot;
export function parseSentimentQuery(searchParams: URLSearchParams):
  | { ok: true; query: SentimentQuery }
  | { ok: false; code: "INVALID_PARAMETERS" | "INVALID_WINDOW" | "INVALID_SOURCE" | "INVALID_LIMIT"; message: string };
