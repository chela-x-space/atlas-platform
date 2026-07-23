import type { AtlasEventCategory } from "@/types/atlas-data";
import { fetchText } from "@/lib/http/fetch-text";
import { parseRssOrAtom } from "@/lib/news/rss-parser.mjs";
import { deduplicateVerifiedReports } from "../report-deduplication";
import { withProviderCache } from "../provider-cache.mjs";
import type {
  NewsProvider,
  NewsProviderStatus,
  ProviderFetchResult,
  ProviderHealth,
} from "../provider-contract";
import { normalizeVerifiedReport } from "../report-normalization";

export type OfficialFeed = {
  readonly id: string;
  readonly url: string;
  readonly category: AtlasEventCategory;
};

type RssProviderOptions = {
  id: string;
  name: string;
  attribution: string;
  documentationUrl: string;
  feeds: readonly OfficialFeed[];
  ttlMs: number;
};

function reportCategory(providerId: string, fallback: AtlasEventCategory, title: string, summary: string): AtlasEventCategory {
  const text = `${title} ${summary}`.toLowerCase();
  if (providerId === "nasa-rss") {
    if (/\b(climate|global warming|sea level|greenhouse)\b/.test(text)) return "climate";
    if (/\b(technology|engineering|software|robotics|propulsion)\b/.test(text)) return "technology";
    if (/\b(science|research|discovery|telescope|astronomy)\b/.test(text)) return "science";
  }
  if (providerId === "esa-rss" && /\b(earth observation|copernicus|sentinel|earth from space)\b/.test(text)) {
    return "earth-observation";
  }
  return fallback;
}

function isImageArticle(value: string): boolean {
  try { return new URL(value).pathname.startsWith("/image-article/"); }
  catch { return false; }
}

export class RssNewsProvider implements NewsProvider {
  readonly providerType = "rss" as const;
  readonly rateLimit = {};
  private currentStatus: NewsProviderStatus = "online";
  private checkedAt: string | null = null;
  private successfulAt: string | null = null;
  private currentErrorCode: string | null = null;
  private currentErrorMessage: string | null = null;

  constructor(private readonly options: RssProviderOptions) {}
  get id() { return this.options.id; }
  get name() { return this.options.name; }
  get attribution() { return this.options.attribution; }
  get documentationUrl() { return this.options.documentationUrl; }
  get status() { return this.currentStatus; }
  get lastCheckedAt() { return this.checkedAt; }
  get lastSuccessfulAt() { return this.successfulAt; }
  get errorCode() { return this.currentErrorCode; }
  get errorMessage() { return this.currentErrorMessage; }

  private health(reportCount: number, stale = false): ProviderHealth {
    return {
      provider: this.id,
      name: this.name,
      status: this.currentStatus,
      lastCheckedAt: this.checkedAt,
      lastSuccessfulAt: this.successfulAt,
      stale,
      reportCount,
      errorCode: this.currentErrorCode,
      errorMessage: this.currentErrorMessage,
      configurationRequirement: null,
      attribution: this.attribution,
      documentationUrl: this.documentationUrl,
      rateLimit: this.rateLimit,
    };
  }

  async fetchReports(): Promise<ProviderFetchResult> {
    return withProviderCache(this.id, this.options.ttlMs, this.options.ttlMs * 4, async () => {
      this.checkedAt = new Date().toISOString();
      const results = await Promise.allSettled(this.options.feeds.map(async (feed) => {
        const response = await fetchText(feed.url, {
          timeoutMs: 8000,
          maxBytes: 1_000_000,
          acceptedContentTypes: ["application/rss+xml", "application/atom+xml", "application/xml", "text/xml"],
          revalidate: Math.floor(this.options.ttlMs / 1000),
        });
        return parseRssOrAtom(response.body, 25)
          .filter((item) => !isImageArticle(item.link))
          .map((item) =>
          normalizeVerifiedReport({
            canonicalUrl: item.link,
            title: item.title,
            summary: item.description,
            provider: this.id,
            originalSource: this.name,
            sourceUrl: item.link,
            publishedAt: item.publishedAt,
            updatedAt: item.publishedAt,
            fetchedAt: response.fetchedAt,
            category: reportCategory(this.id, feed.category, item.title, item.description),
            countries: [],
            locations: [],
            disasterIds: [],
            eventTypes: [],
            language: "en",
            attribution: this.attribution,
            rawProviderId: `${feed.id}:${item.link}`,
          })
        ).filter((report) => report !== null);
      }));
      const failures = results.filter((result) => result.status === "rejected").length;
      const reports = deduplicateVerifiedReports(
        results.flatMap((result) => result.status === "fulfilled" ? result.value : []),
      ).reports;
      this.currentStatus = failures === 0 ? "online" : reports.length > 0 ? "degraded" : "unavailable";
      this.successfulAt = reports.length > 0 ? this.checkedAt : this.successfulAt;
      this.currentErrorCode = failures ? "FEED_UNAVAILABLE" : null;
      this.currentErrorMessage = failures ? `${failures} official feed${failures === 1 ? "" : "s"} failed` : null;
      return { reports, health: this.health(reports.length) };
    });
  }

  async healthCheck(): Promise<ProviderHealth> {
    try { return (await this.fetchReports()).health; }
    catch {
      this.currentStatus = "unavailable";
      this.checkedAt = new Date().toISOString();
      this.currentErrorCode = "PROVIDER_UNAVAILABLE";
      this.currentErrorMessage = "Official feeds are temporarily unavailable";
      return this.health(0);
    }
  }
}
