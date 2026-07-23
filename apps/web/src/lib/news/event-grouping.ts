import { createHash } from "node:crypto";
import type { AtlasEvent } from "@/types/atlas-data";
import type {
  GroupingConfidence,
  NewsEventGroup,
  NormalizedVerifiedReport,
} from "./provider-contract";

const STOP = new Set(["and", "for", "from", "into", "new", "news", "report", "the", "with"]);
function terms(value: string): Set<string> {
  return new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((term) => term.length > 3 && !STOP.has(term)));
}
function overlap(left: string, right: string): number {
  const a = terms(left);
  const b = terms(right);
  if (!a.size || !b.size) return 0;
  let count = 0;
  for (const term of a) if (b.has(term)) count += 1;
  return count / Math.min(a.size, b.size);
}
function intersects(left: readonly string[], right: readonly string[]): boolean {
  const normalized = new Set(left.map((value) => value.toLowerCase()));
  return right.some((value) => normalized.has(value.toLowerCase()));
}
function groupId(seed: string): string {
  return `news-group-${createHash("sha256").update(seed).digest("hex").slice(0, 18)}`;
}

type Match = { confidence: GroupingConfidence; reason: string; score: number };

function reportMatch(left: NormalizedVerifiedReport, right: NormalizedVerifiedReport): Match | null {
  if (intersects(left.disasterIds, right.disasterIds)) {
    return { confidence: "exact", reason: "Shared canonical provider disaster identifier", score: 4 };
  }
  const days = Math.abs(Date.parse(left.publishedAt) - Date.parse(right.publishedAt)) / 86_400_000;
  const text = overlap(left.title, right.title);
  const eventType = intersects(left.eventTypes, right.eventTypes);
  const location = intersects([...left.locations, ...left.countries], [...right.locations, ...right.countries]);
  if (days <= 14 && text >= 0.72 && (eventType || location)) {
    return { confidence: "strong", reason: "Shared event terms, place or type, and publication window", score: 3 };
  }
  if (days <= 7 && text >= 0.82) {
    return { confidence: "probable", reason: "High title similarity within a bounded time window", score: 2 };
  }
  return null;
}

function anchorMatch(report: NormalizedVerifiedReport, event: AtlasEvent): Match | null {
  if (report.disasterIds.includes(event.sourceItemId ?? "") || report.disasterIds.includes(event.id)) {
    return { confidence: "exact", reason: "Report disaster identifier matches event anchor", score: 4 };
  }
  const days = Math.abs(Date.parse(report.publishedAt) - Date.parse(event.occurredAt)) / 86_400_000;
  const text = overlap(`${report.title} ${report.eventTypes.join(" ")}`, `${event.title} ${event.type}`);
  const location = report.locations.some((place) => event.region?.toLowerCase().includes(place.toLowerCase()));
  const country = report.countries.some((value) =>
    value.toLowerCase() === event.countryCode?.toLowerCase() ||
    event.region?.toLowerCase().includes(value.toLowerCase())
  );
  if (days <= 7 && text >= 0.55 && (location || country)) {
    return { confidence: "strong", reason: "Event type/title, location, and time window match", score: 3 };
  }
  if (days <= 3 && text >= 0.78) {
    return { confidence: "probable", reason: "Title terms and time window suggest a possible event anchor", score: 2 };
  }
  return null;
}

export function groupVerifiedReports(
  reports: readonly NormalizedVerifiedReport[],
  events: readonly AtlasEvent[],
): NewsEventGroup[] {
  const mutable: Array<{
    reports: NormalizedVerifiedReport[];
    anchor: AtlasEvent | null;
    confidence: GroupingConfidence;
    reason: string;
    score: number;
  }> = [];
  const sorted = [...reports].sort((a, b) =>
    Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id)
  );

  for (const report of sorted) {
    let bestGroup: { index: number; match: Match } | null = null;
    for (let index = 0; index < mutable.length; index += 1) {
      const match = reportMatch(report, mutable[index].reports[0]);
      if (match && (!bestGroup || match.score > bestGroup.match.score)) bestGroup = { index, match };
    }
    if (bestGroup) {
      const group = mutable[bestGroup.index];
      group.reports.push(report);
      if (bestGroup.match.score > group.score) {
        group.confidence = bestGroup.match.confidence;
        group.reason = bestGroup.match.reason;
        group.score = bestGroup.match.score;
      }
    } else {
      mutable.push({ reports: [report], anchor: null, confidence: "standalone", reason: "No deterministic event match", score: 1 });
    }
  }

  for (const group of mutable) {
    let best: { event: AtlasEvent; match: Match } | null = null;
    for (const report of group.reports) {
      for (const event of events) {
        const match = anchorMatch(report, event);
        if (match && (!best || match.score > best.match.score)) best = { event, match };
      }
    }
    if (best) {
      group.anchor = best.event;
      group.confidence = best.match.confidence;
      group.reason = best.match.reason;
      group.score = best.match.score;
    }
  }

  return mutable.map((group) => ({
    id: groupId(group.anchor?.id ?? group.reports.map((report) => report.id).sort().join("|")),
    eventAnchor: group.anchor,
    relatedReports: group.reports,
    distinctSourceCount: new Set(group.reports.map((report) => report.originalSource)).size,
    newestPublicationTime: group.reports[0].publishedAt,
    categories: [...new Set(group.reports.map((report) => report.category))].sort(),
    countries: [...new Set(group.reports.flatMap((report) => report.countries))].sort(),
    confidence: group.confidence,
    groupingReason: group.reason,
  })).sort((a, b) =>
    Date.parse(b.newestPublicationTime) - Date.parse(a.newestPublicationTime) || a.id.localeCompare(b.id)
  );
}
