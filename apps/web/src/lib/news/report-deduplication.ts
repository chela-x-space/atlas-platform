import type { DuplicateReason, NormalizedVerifiedReport } from "./provider-contract";

export type RemovedDuplicate = {
  readonly duplicateId: string;
  readonly retainedId: string;
  readonly reason: DuplicateReason;
};

function titleKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function reportNumber(title: string): string | null {
  return title.match(/\b(?:situation report|update|bulletin|report)\s*(?:no\.?|#)?\s*(\d+)\b/i)?.[1] ?? null;
}

export function deduplicateVerifiedReports(items: readonly NormalizedVerifiedReport[]): {
  reports: NormalizedVerifiedReport[];
  duplicates: RemovedDuplicate[];
} {
  const reports: NormalizedVerifiedReport[] = [];
  const duplicates: RemovedDuplicate[] = [];
  const byUrl = new Map<string, NormalizedVerifiedReport>();
  const byProviderId = new Map<string, NormalizedVerifiedReport>();
  const byTitleSourceWindow = new Map<string, NormalizedVerifiedReport>();
  const byFingerprint = new Map<string, NormalizedVerifiedReport>();

  const sorted = [...items].sort((a, b) =>
    Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id)
  );
  for (const item of sorted) {
    const hourWindow = Math.floor(Date.parse(item.publishedAt) / (6 * 60 * 60_000));
    const titleSourceKey = `${titleKey(item.title)}|${item.originalSource.toLowerCase()}|${hourWindow}`;
    const checks: Array<[NormalizedVerifiedReport | undefined, DuplicateReason]> = [
      [byUrl.get(item.canonicalUrl), "canonical_url"],
      [byProviderId.get(`${item.provider}:${item.rawProviderId}`), "provider_id"],
      [byTitleSourceWindow.get(titleSourceKey), "title_source_window"],
      [byFingerprint.get(item.contentFingerprint), "content_fingerprint"],
    ];
    const duplicate = checks.find(([match]) => {
      if (!match) return false;
      const leftNumber = reportNumber(match.title);
      const rightNumber = reportNumber(item.title);
      return !(leftNumber && rightNumber && leftNumber !== rightNumber);
    });
    if (duplicate?.[0]) {
      duplicates.push({ duplicateId: item.id, retainedId: duplicate[0].id, reason: duplicate[1] });
      continue;
    }
    reports.push(item);
    byUrl.set(item.canonicalUrl, item);
    byProviderId.set(`${item.provider}:${item.rawProviderId}`, item);
    byTitleSourceWindow.set(titleSourceKey, item);
    byFingerprint.set(item.contentFingerprint, item);
  }
  return { reports, duplicates };
}
