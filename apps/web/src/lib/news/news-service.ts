import { getAtlasDataHub } from "@/lib/data-hub";
import type { AtlasEvent, AtlasNewsItem } from "@/types/atlas-data";
import { groupVerifiedReports } from "./event-grouping";
import type { NewsEventGroup, ProviderHealth } from "./provider-contract";
import { deduplicateVerifiedReports } from "./report-deduplication";
import { fetchAllNewsProviders } from "./providers/provider-registry";

export type NewsSnapshot = {
  readonly items: AtlasNewsItem[];
  readonly eventGroups: NewsEventGroup[];
  readonly sources: ProviderHealth[];
  readonly fetchedAt: string;
  readonly duplicateCount: number;
  readonly anchorStatus: "available" | "unavailable";
};

async function getEventAnchors(): Promise<{ events: readonly AtlasEvent[]; status: "available" | "unavailable" }> {
  try {
    const hub = getAtlasDataHub();
    await hub.refreshSources();
    const page = await hub.queryEvents({ categories: ["earthquake", "cyclone"], limit: 500 });
    return { events: page.events, status: "available" };
  } catch {
    return { events: [], status: "unavailable" };
  }
}

export async function getOfficialNews(): Promise<NewsSnapshot> {
  const [{ results, health }, anchors] = await Promise.all([
    fetchAllNewsProviders(),
    getEventAnchors(),
  ]);
  const deduplicated = deduplicateVerifiedReports(results.flatMap((result) => result.reports));
  const eventGroups = groupVerifiedReports(deduplicated.reports, anchors.events);
  const providerNames = new Map(health.map((source) => [source.provider, source.name]));
  const items: AtlasNewsItem[] = deduplicated.reports.map((report) => ({
    id: report.id,
    title: report.title,
    summary: report.summary,
    publishedAt: report.publishedAt,
    updatedAt: report.updatedAt,
    sourceId: report.provider,
    sourceName: providerNames.get(report.provider) ?? report.provider,
    originalSource: report.originalSource,
    sourceUrl: report.sourceUrl,
    canonicalUrl: report.canonicalUrl,
    category: report.category,
    language: report.language,
    attribution: report.attribution,
    countries: report.countries,
    eventTypes: report.eventTypes,
    verificationStatus: report.verificationStatus,
  })).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  return {
    items,
    eventGroups,
    sources: health,
    fetchedAt: new Date().toISOString(),
    duplicateCount: deduplicated.duplicates.length,
    anchorStatus: anchors.status,
  };
}

export const OFFICIAL_NEWS_SOURCE_IDS: readonly string[] = ["reliefweb", "nasa-rss", "esa-rss"];
