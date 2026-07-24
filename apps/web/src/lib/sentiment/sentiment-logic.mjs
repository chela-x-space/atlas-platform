import {
  SENTIMENT_LEXICON,
  SENTIMENT_LEXICON_ID,
  SENTIMENT_LEXICON_VERSION,
} from "./sentiment-lexicon.mjs";

export const SENTIMENT_VERSION = "atlas-global-sentiment-v1";
export const SENTIMENT_FORMULA_ID = "global-sentiment-index-v1";
export const SENTIMENT_FORMULA_VERSION = "1.0.0";
export const SENTIMENT_SOURCES = Object.freeze(["esa-rss", "nasa-rss", "noaa-nhc"]);
const WINDOWS = new Set(["1h", "24h", "7d"]);
const PARAMETERS = new Set(["window", "source", "limit"]);
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const NORMALIZATION_DIVISOR = 5;
const NEGATION_WINDOW = 3;
const COVERAGE_THRESHOLD = 80;
const FIELDS = ["title", "summary", "description", "advisoryText"];
const POSITIVE = new Map([...Object.entries(SENTIMENT_LEXICON.positive), ...Object.entries(SENTIMENT_LEXICON.strongPositive)]);
const NEGATIVE = new Map([...Object.entries(SENTIMENT_LEXICON.negative), ...Object.entries(SENTIMENT_LEXICON.strongNegative)]);
const INTENSIFIERS = new Set(SENTIMENT_LEXICON.intensifiers);
const NEGATIONS = new Set(SENTIMENT_LEXICON.negations);

function round(value, places) {
  const scale = 10 ** places;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos);/gi, (entity) => ({
      "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&apos;": "'",
    })[entity.toLowerCase()]);
}

export function normalizeSentimentText(value) {
  if (typeof value !== "string") return "";
  return decodeEntities(value.replace(/<[^>]*>/g, " "))
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}']+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function recordLanguage(item) {
  const language = item.metadata?.language;
  return typeof language === "string" && language.trim() ? language.toLowerCase() : "en";
}

function sourceRecordId(item) {
  const value = item.metadata?.sourceRecordId;
  return typeof value === "string" && value ? value : item.relatedEventId ?? item.relatedReportId ?? item.id;
}

function canonicalKey(item) {
  const stableId = item.itemType === "report" ? item.relatedReportId : item.relatedEventId;
  if (stableId) return `${item.sourceId}:canonical:${stableId}`;
  const nativeId = sourceRecordId(item);
  if (nativeId) return `${item.sourceId}:native:${nativeId}`;
  return `${item.sourceId}:fallback:${normalizeSentimentText(item.title)}:${item.occurredAt}`;
}

function textFields(item) {
  const candidates = {
    title: item.title,
    summary: item.summary,
    description: item.metadata?.description,
    advisoryText: item.metadata?.advisoryText,
  };
  const seen = new Set();
  return FIELDS.flatMap((field) => {
    const normalized = normalizeSentimentText(candidates[field]);
    if (!normalized || seen.has(normalized)) return [];
    seen.add(normalized);
    return [{ field, normalized }];
  });
}

export function labelSentimentScore(value) {
  if (value === null || !Number.isFinite(value)) return "unavailable";
  if (value <= -0.6) return "strongly_negative";
  if (value <= -0.2) return "negative";
  if (value < 0.2) return "neutral";
  if (value < 0.6) return "positive";
  return "strongly_positive";
}

export function labelGlobalSentiment(value) {
  if (value === null || !Number.isFinite(value)) return "unavailable";
  if (value <= -60) return "strongly_negative";
  if (value <= -20) return "negative";
  if (value < 20) return "neutral";
  if (value < 60) return "positive";
  return "strongly_positive";
}

export function scoreSentimentText(fields) {
  const tokenGroups = fields.map(({ normalized }) => normalized.split(" ").filter(Boolean));
  if (!tokenGroups.some((tokens) => tokens.length)) return null;
  const matchedPositiveTerms = [];
  const matchedNegativeTerms = [];
  const matchedIntensifiers = [];
  const matchedNegations = [];
  let positiveWeight = 0;
  let negativeWeight = 0;
  for (const tokens of tokenGroups) {
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      let weight = POSITIVE.get(token) ?? NEGATIVE.get(token);
      if (weight === undefined) continue;
      const intensified = index > 0 && INTENSIFIERS.has(tokens[index - 1]);
      if (intensified) {
        weight *= 1.5;
        matchedIntensifiers.push(tokens[index - 1]);
      }
      const preceding = tokens.slice(Math.max(0, index - NEGATION_WINDOW), index)
        .filter((candidate) => NEGATIONS.has(candidate));
      if (preceding.length) matchedNegations.push(...preceding);
      if (preceding.length % 2 === 1) weight *= -1;
      if (weight > 0) {
        positiveWeight += weight;
        matchedPositiveTerms.push(token);
      } else {
        negativeWeight += Math.abs(weight);
        matchedNegativeTerms.push(token);
      }
    }
  }
  const netScore = round(positiveWeight - negativeWeight, 2);
  const normalizedScore = round(Math.max(-1, Math.min(1, netScore / NORMALIZATION_DIVISOR)), 3);
  return {
    matchedPositiveTerms, matchedNegativeTerms, matchedIntensifiers, matchedNegations,
    positiveWeight: round(positiveWeight, 2), negativeWeight: round(negativeWeight, 2),
    netScore, normalizedScore, label: labelSentimentScore(normalizedScore),
  };
}

function windowMilliseconds(window) {
  return window === "1h" ? 60 * 60_000 : window === "24h" ? 24 * 60 * 60_000 : 7 * 24 * 60 * 60_000;
}

export function sentimentRecencyWeight(window, ageMs) {
  const fraction = ageMs / windowMilliseconds(window);
  if (fraction <= 0.25) return 1;
  if (fraction <= 0.5) return 0.85;
  if (fraction <= 0.75) return 0.7;
  return 0.55;
}

function sourceState(source) {
  if (!source || source.status === "unavailable" || source.status === "disabled" || source.status === "configuration_required") return "unavailable";
  if (source.status !== "online" || source.stale) return "partial";
  return "complete";
}

function sourceBreakdown(sourceId, records, sourceHealth, globalWeightSum) {
  const sourceRecords = records.filter((record) => record.sourceId === sourceId);
  const scored = sourceRecords.filter((record) => record.normalizedScore !== null);
  const unsupported = sourceRecords
    .filter((record) => record.language !== "und" && record.language !== "en" && !record.language.startsWith("en-"))
    .length;
  const weighted = scored.reduce((sum, record) => sum + record.normalizedScore * record.recencyWeight, 0);
  const state = sourceState(sourceHealth.find((source) => source.sourceId === sourceId));
  const completeness = !scored.length ? "unavailable" : state === "complete" && unsupported === 0 ? "complete" : "partial";
  return {
    sourceId, recordCount: sourceRecords.length, scoredRecordCount: scored.length,
    positiveCount: scored.filter((record) => record.normalizedScore >= 0.2).length,
    neutralCount: scored.filter((record) => record.normalizedScore > -0.2 && record.normalizedScore < 0.2).length,
    negativeCount: scored.filter((record) => record.normalizedScore <= -0.2).length,
    unsupportedLanguageCount: unsupported,
    averageScore: scored.length ? round(scored.reduce((sum, record) => sum + record.normalizedScore, 0) / scored.length * 100, 1) : null,
    weightedContribution: globalWeightSum ? round(weighted / globalWeightSum * 100, 1) : null,
    completeness,
    limitations: [
      "English-only exact lexicon; no translation or semantic inference.",
      ...(state !== "complete" ? ["Provider coverage is incomplete."] : []),
    ],
  };
}

export function calculateSentimentSnapshot({ items, sourceHealth, generatedAt, window = "24h", source = null, limit = DEFAULT_LIMIT }) {
  if (!Number.isFinite(Date.parse(generatedAt))) throw new TypeError("generatedAt must be a valid timestamp");
  if (!WINDOWS.has(window)) throw new TypeError("window is invalid");
  const generatedMs = Date.parse(generatedAt);
  const startMs = generatedMs - windowMilliseconds(window);
  const expectedSources = source ? [source] : [...SENTIMENT_SOURCES];
  const verified = items.filter((item) => item?.verificationStatus === "verified" && expectedSources.includes(item.sourceId));
  const inWindow = verified.filter((item) => {
    const published = Date.parse(item.occurredAt);
    return Number.isFinite(published) && published >= startMs && published <= generatedMs;
  });
  const unique = new Map();
  let duplicatesExcluded = 0;
  for (const item of [...inWindow].sort((a, b) => a.id.localeCompare(b.id))) {
    const key = canonicalKey(item);
    if (unique.has(key)) duplicatesExcluded += 1;
    else unique.set(key, item);
  }
  const records = [...unique.values()].map((item) => {
    const fields = textFields(item);
    const language = recordLanguage(item);
    const supported = language === "und" || language === "en" || language.startsWith("en-");
    const score = supported && fields.length ? scoreSentimentText(fields) : null;
    const publishedMs = Date.parse(item.occurredAt);
    const recencyWeight = sentimentRecencyWeight(window, generatedMs - publishedMs);
    return {
      recordId: sourceRecordId(item), sourceId: item.sourceId, canonicalType: item.itemType,
      title: item.title, publishedAt: item.occurredAt, analyzedFields: fields.map(({ field }) => field),
      matchedPositiveTerms: score?.matchedPositiveTerms ?? [],
      matchedNegativeTerms: score?.matchedNegativeTerms ?? [],
      matchedIntensifiers: score?.matchedIntensifiers ?? [],
      matchedNegations: score?.matchedNegations ?? [],
      positiveWeight: score?.positiveWeight ?? 0, negativeWeight: score?.negativeWeight ?? 0,
      netScore: score?.netScore ?? 0, normalizedScore: score?.normalizedScore ?? null,
      recencyWeight, label: score?.label ?? "unavailable", language,
      provenance: {
        sourceId: item.sourceId, sourceName: item.sourceName, sourceUrl: item.sourceUrl,
        attribution: item.attribution, sourceRecordId: sourceRecordId(item),
        textFields: fields.map(({ field }) => field),
      },
    };
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.recordId.localeCompare(b.recordId));
  const scored = records.filter((record) => record.normalizedScore !== null);
  const unsupportedLanguageRecords = records
    .filter((record) => record.language !== "und" && record.language !== "en" && !record.language.startsWith("en-"))
    .length;
  const unscoredRecords = records.length - scored.length;
  const weightSum = scored.reduce((sum, record) => sum + record.recencyWeight, 0);
  const weightedScore = scored.reduce((sum, record) => sum + record.normalizedScore * record.recencyWeight, 0);
  const value = weightSum ? round(weightedScore / weightSum * 100, 1) : null;
  const coveragePercentage = records.length ? round(scored.length / records.length * 100, 1) : null;
  const health = expectedSources.map((sourceId) => sourceHealth.find((entry) => entry.sourceId === sourceId)).filter(Boolean);
  const respondingProviders = health.filter((entry) => entry.status === "online" || entry.status === "degraded").length;
  const degradedProviders = health.filter((entry) => entry.status === "degraded" || entry.stale).length;
  const unavailableProviders = expectedSources.length - respondingProviders;
  const completeness = !scored.length ? "unavailable"
    : degradedProviders || unavailableProviders || coveragePercentage < COVERAGE_THRESHOLD ? "partial" : "complete";
  const breakdown = expectedSources.map((sourceId) => sourceBreakdown(sourceId, records, sourceHealth, weightSum))
    .sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  const distribution = Object.fromEntries(["strongly_negative", "negative", "neutral", "positive", "strongly_positive", "unavailable"]
    .map((label) => [label, records.filter((record) => record.label === label).length]));
  const coverage = {
    percentage: coveragePercentage, eligibleRecords: inWindow.length, uniqueRecords: records.length,
    scoredRecords: scored.length, unscoredRecords, unsupportedLanguageRecords, duplicatesExcluded,
    respondingProviders, degradedProviders, unavailableProviders,
  };
  const index = {
    id: "global-sentiment-index", label: "Verified source-text sentiment",
    value, minimum: -100, maximum: 100, status: labelGlobalSentiment(value), completeness,
    window, formulaId: SENTIMENT_FORMULA_ID, formulaVersion: SENTIMENT_FORMULA_VERSION,
    lexiconId: SENTIMENT_LEXICON_ID, lexiconVersion: SENTIMENT_LEXICON_VERSION,
    generatedAt, eligibleRecordCount: inWindow.length, scoredRecordCount: scored.length,
    unscoredRecordCount: unscoredRecords, sourceIds: expectedSources,
    sourceBreakdown: breakdown, distribution, coverage,
    provenance: records.map((record) => record.provenance),
    limitations: [
      "English-only exact lexicon; non-English records are unscored.",
      "Text tone is not public opinion, emotion, impact, or risk.",
      "Missing provider records are never estimated.",
    ],
    explanation: "This index measures the tone of eligible verified source text. It does not measure public opinion, human emotion, or predicted impact.",
  };
  return {
    sentimentVersion: SENTIMENT_VERSION, generatedAt, partial: completeness !== "complete",
    stale: false, sourceHealth: [...health].sort((a, b) => a.sourceId.localeCompare(b.sourceId)),
    inputSummary: {
      totalVerifiedRecords: verified.length, recordsInWindow: inWindow.length,
      eligibleRecords: inWindow.length, uniqueRecords: records.length, duplicatesExcluded,
      unsupportedLanguageRecords, unscoredRecords, windowStart: new Date(startMs).toISOString(),
      analyzedFields: FIELDS,
    },
    index, sourceBreakdown: breakdown, recentRecords: records.slice(0, limit),
  };
}

export function parseSentimentQuery(searchParams) {
  for (const key of searchParams.keys()) {
    if (!PARAMETERS.has(key)) return { ok: false, code: "INVALID_PARAMETERS", message: `Unsupported parameter: ${key}` };
  }
  const window = searchParams.get("window") ?? "24h";
  const source = searchParams.get("source");
  const rawLimit = searchParams.get("limit");
  const limit = rawLimit === null ? DEFAULT_LIMIT : Number(rawLimit);
  if (!WINDOWS.has(window)) return { ok: false, code: "INVALID_WINDOW", message: "window must be one of: 1h, 24h, 7d" };
  if (source !== null && !SENTIMENT_SOURCES.includes(source)) return { ok: false, code: "INVALID_SOURCE", message: "source is not supported" };
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return { ok: false, code: "INVALID_LIMIT", message: `limit must be an integer from 1 to ${MAX_LIMIT}` };
  return { ok: true, query: { window, source, limit } };
}
