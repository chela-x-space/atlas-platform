import type { NewsProvider, ProviderFetchResult, ProviderHealth } from "../provider-contract";
import { ReliefWebProvider } from "./reliefweb-provider";
import { RssNewsProvider } from "./rss-news-provider";

const nasa = new RssNewsProvider({
  id: "nasa-rss",
  name: "NASA",
  attribution: "National Aeronautics and Space Administration (NASA)",
  documentationUrl: "https://www.nasa.gov/rss-feeds/",
  ttlMs: 15 * 60_000,
  feeds: [
    { id: "news-releases", url: "https://www.nasa.gov/news-release/feed/", category: "space" },
    { id: "recent", url: "https://www.nasa.gov/feed/", category: "space" },
    { id: "technology", url: "https://www.nasa.gov/technology/feed/", category: "technology" },
  ],
});

const esa = new RssNewsProvider({
  id: "esa-rss",
  name: "European Space Agency",
  attribution: "European Space Agency (ESA)",
  documentationUrl: "https://www.esa.int/rssfeed/Our_Activities",
  ttlMs: 30 * 60_000,
  feeds: [
    { id: "our-activities", url: "https://www.esa.int/rssfeed/Our_Activities", category: "space" },
  ],
});

export const newsProviders: readonly NewsProvider[] = [
  new ReliefWebProvider(),
  nasa,
  esa,
];

export async function fetchAllNewsProviders(
  providers: readonly NewsProvider[] = newsProviders,
): Promise<{ results: ProviderFetchResult[]; health: ProviderHealth[] }> {
  const settled = await Promise.allSettled(providers.map((provider) => provider.fetchReports()));
  const results: ProviderFetchResult[] = [];
  const health: ProviderHealth[] = [];
  for (let index = 0; index < settled.length; index += 1) {
    const result = settled[index];
    const provider = providers[index];
    if (result.status === "fulfilled") {
      results.push(result.value);
      health.push(result.value.health);
    } else {
      const checked = new Date().toISOString();
      health.push({
        provider: provider.id,
        name: provider.name,
        status: "unavailable",
        lastCheckedAt: checked,
        lastSuccessfulAt: provider.lastSuccessfulAt,
        stale: false,
        reportCount: 0,
        errorCode: "PROVIDER_UNAVAILABLE",
        errorMessage: "Provider request failed",
        configurationRequirement: null,
        attribution: provider.attribution,
        documentationUrl: provider.documentationUrl,
        rateLimit: provider.rateLimit,
      });
    }
  }
  return { results, health };
}
