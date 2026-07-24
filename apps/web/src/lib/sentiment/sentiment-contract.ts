import type { TimelineSourceStatus } from "@/lib/timeline/timeline-contract";

export const SENTIMENT_VERSION = "atlas-global-sentiment-v1" as const;
export type SentimentLabel = "strongly_negative" | "negative" | "neutral" | "positive" | "strongly_positive" | "unavailable";
export type SentimentCompleteness = "complete" | "partial" | "unavailable";
export type SentimentWindow = "1h" | "24h" | "7d";

export type SentimentProvenance = {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly sourceUrl: string | null;
  readonly attribution: string;
  readonly sourceRecordId: string;
  readonly textFields: readonly string[];
};

export type SentimentRecordResult = {
  readonly recordId: string;
  readonly sourceId: string;
  readonly canonicalType: "event" | "report" | "advisory";
  readonly title: string;
  readonly publishedAt: string;
  readonly analyzedFields: readonly string[];
  readonly matchedPositiveTerms: readonly string[];
  readonly matchedNegativeTerms: readonly string[];
  readonly matchedIntensifiers: readonly string[];
  readonly matchedNegations: readonly string[];
  readonly positiveWeight: number;
  readonly negativeWeight: number;
  readonly netScore: number;
  readonly normalizedScore: number | null;
  readonly recencyWeight: number;
  readonly label: SentimentLabel;
  readonly language: string;
  readonly provenance: SentimentProvenance;
};

export type SourceSentimentBreakdown = {
  readonly sourceId: string;
  readonly recordCount: number;
  readonly scoredRecordCount: number;
  readonly positiveCount: number;
  readonly neutralCount: number;
  readonly negativeCount: number;
  readonly unsupportedLanguageCount: number;
  readonly averageScore: number | null;
  readonly weightedContribution: number | null;
  readonly completeness: SentimentCompleteness;
  readonly limitations: readonly string[];
};

export type SentimentCoverage = {
  readonly percentage: number | null;
  readonly eligibleRecords: number;
  readonly uniqueRecords: number;
  readonly scoredRecords: number;
  readonly unscoredRecords: number;
  readonly unsupportedLanguageRecords: number;
  readonly duplicatesExcluded: number;
  readonly respondingProviders: number;
  readonly degradedProviders: number;
  readonly unavailableProviders: number;
};

export type GlobalSentimentIndex = {
  readonly id: "global-sentiment-index";
  readonly label: "Verified source-text sentiment";
  readonly value: number | null;
  readonly minimum: -100;
  readonly maximum: 100;
  readonly status: SentimentLabel;
  readonly completeness: SentimentCompleteness;
  readonly window: SentimentWindow;
  readonly formulaId: "global-sentiment-index-v1";
  readonly formulaVersion: "1.0.0";
  readonly lexiconId: "atlas-official-text-en";
  readonly lexiconVersion: "1.0.0";
  readonly generatedAt: string;
  readonly eligibleRecordCount: number;
  readonly scoredRecordCount: number;
  readonly unscoredRecordCount: number;
  readonly sourceIds: readonly string[];
  readonly sourceBreakdown: readonly SourceSentimentBreakdown[];
  readonly distribution: Readonly<Record<SentimentLabel, number>>;
  readonly coverage: SentimentCoverage;
  readonly provenance: readonly SentimentProvenance[];
  readonly limitations: readonly string[];
  readonly explanation: string;
};

export type SentimentInputSummary = {
  readonly totalVerifiedRecords: number;
  readonly recordsInWindow: number;
  readonly eligibleRecords: number;
  readonly uniqueRecords: number;
  readonly duplicatesExcluded: number;
  readonly unsupportedLanguageRecords: number;
  readonly unscoredRecords: number;
  readonly windowStart: string;
  readonly analyzedFields: readonly ["title", "summary", "description", "advisoryText"];
};

export type SentimentSnapshot = {
  readonly sentimentVersion: typeof SENTIMENT_VERSION;
  readonly generatedAt: string;
  readonly servedAt?: string;
  readonly partial: boolean;
  readonly stale: boolean;
  readonly sourceHealth: readonly TimelineSourceStatus[];
  readonly inputSummary: SentimentInputSummary;
  readonly index: GlobalSentimentIndex;
  readonly sourceBreakdown: readonly SourceSentimentBreakdown[];
  readonly recentRecords: readonly SentimentRecordResult[];
};

export type SentimentQuery = {
  readonly window: SentimentWindow;
  readonly source: string | null;
  readonly limit: number;
};
