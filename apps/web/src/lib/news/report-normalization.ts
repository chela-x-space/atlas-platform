import { createHash } from "node:crypto";
import type { AtlasEventCategory } from "@/types/atlas-data";
import { safeExternalUrl } from "@/lib/security/external-url.mjs";
import type { NormalizedVerifiedReport } from "./provider-contract";

export function fingerprint(...values: readonly string[]): string {
  return createHash("sha256").update(values.join("\u001f")).digest("hex");
}

export function canonicalizeReportUrl(value: string): string | null {
  const safe = safeExternalUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid|mc_)/i.test(key)) url.searchParams.delete(key);
  }
  return url.toString().replace(/\/$/, "");
}

export function isoDate(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

export function deterministicExcerpt(value: string, maximum = 500): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maximum) return normalized;
  const slice = normalized.slice(0, maximum + 1);
  const boundary = slice.lastIndexOf(" ");
  return `${slice.slice(0, boundary > maximum * 0.7 ? boundary : maximum).trim()}…`;
}

type ReportInput = Omit<
  NormalizedVerifiedReport,
  "id" | "canonicalUrl" | "contentFingerprint" | "verificationStatus" | "sourceCount"
> & { canonicalUrl: string };

export function normalizeVerifiedReport(input: ReportInput): NormalizedVerifiedReport | null {
  const canonicalUrl = canonicalizeReportUrl(input.canonicalUrl);
  const sourceUrl = canonicalizeReportUrl(input.sourceUrl);
  const publishedAt = isoDate(input.publishedAt);
  const updatedAt = isoDate(input.updatedAt);
  const fetchedAt = isoDate(input.fetchedAt);
  const title = input.title.replace(/\s+/g, " ").trim();
  const summary = deterministicExcerpt(input.summary);
  if (!canonicalUrl || !sourceUrl || !publishedAt || !updatedAt || !fetchedAt || !title) return null;
  const contentFingerprint = fingerprint(title.toLowerCase(), summary.toLowerCase(), input.originalSource);
  return {
    ...input,
    id: `${input.provider}-${fingerprint(input.rawProviderId, canonicalUrl).slice(0, 20)}`,
    canonicalUrl,
    sourceUrl,
    title,
    summary,
    publishedAt,
    updatedAt,
    fetchedAt,
    category: input.category as AtlasEventCategory,
    countries: [...new Set(input.countries)].sort(),
    locations: [...new Set(input.locations)].sort(),
    disasterIds: [...new Set(input.disasterIds)].sort(),
    eventTypes: [...new Set(input.eventTypes)].sort(),
    verificationStatus: "verified",
    sourceCount: 1,
    contentFingerprint,
  };
}
