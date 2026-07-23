import { DATA_SOURCES, isDataSourceFetchable } from "@/config/data-sources";
import { fetchText } from "@/lib/http/fetch-text";
import type { AtlasNewsItem } from "@/types/atlas-data";
import { deduplicateNews } from "./deduplicate-news";
import { normalizeNewsItem } from "./normalize-news";
import { parseRssOrAtom } from "./rss-parser";

export type SourceHealth = { sourceId: string; sourceName: string; url: string; ok: boolean; fetchedAt: string; itemCount: number; error?: "timeout" | "unavailable" | "invalid-upstream-data" | "disabled" };

export async function getOfficialNews(): Promise<{ items: AtlasNewsItem[]; sources: SourceHealth[]; fetchedAt: string }> {
  const configuredSources = DATA_SOURCES.filter((source) => source.category === "space");
  const settled = await Promise.all(configuredSources.map(async (source) => {
    const url = (source.endpoints as Readonly<Record<string, string>>).feed;
    if (!isDataSourceFetchable(source)) {
      return {
        items: [] as AtlasNewsItem[],
        health: {
          sourceId: source.id,
          sourceName: source.name,
          url,
          ok: false,
          fetchedAt: new Date().toISOString(),
          itemCount: 0,
          error: "disabled",
        } satisfies SourceHealth,
      };
    }
    try {
      const response = await fetchText(url, { timeoutMs: 8000, maxBytes: 1_000_000, acceptedContentTypes: ["xml", "rss", "atom", "text/plain"], revalidate: source.refreshSeconds });
      const items = parseRssOrAtom(response.body, 25).map((item) => normalizeNewsItem(item, source));
      return { items, health: { sourceId: source.id, sourceName: source.name, url, ok: true, fetchedAt: response.fetchedAt, itemCount: items.length } satisfies SourceHealth };
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error && error.code === "timeout" ? "timeout" : error && typeof error === "object" && "code" in error && error.code === "invalid-upstream-data" ? "invalid-upstream-data" : "unavailable";
      return { items: [] as AtlasNewsItem[], health: { sourceId: source.id, sourceName: source.name, url, ok: false, fetchedAt: new Date().toISOString(), itemCount: 0, error: code } satisfies SourceHealth };
    }
  }));
  const items = deduplicateNews(settled.flatMap((result) => result.items)).sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf());
  return { items, sources: settled.map((result) => result.health), fetchedAt: new Date().toISOString() };
}

export const OFFICIAL_NEWS_SOURCE_IDS: readonly string[] = DATA_SOURCES
  .filter((source) => source.category === "space")
  .map((source) => source.id);
