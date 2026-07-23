import { fetchJson } from "@/lib/http/fetch-json";
import { UpstreamError } from "@/lib/http/fetch-text";
import { withProviderCache } from "../provider-cache.mjs";
import type {
  NewsProvider,
  NewsProviderStatus,
  NormalizedVerifiedReport,
  ProviderFetchResult,
  ProviderHealth,
} from "../provider-contract";
import { normalizeVerifiedReport } from "../report-normalization";
import { isReliefWebResponse, type ReliefWebResponse } from "./reliefweb-schema.mjs";

export function parseReliefWebReports(value: ReliefWebResponse, fetchedAt: string): NormalizedVerifiedReport[] {
  return value.data.map((item) => {
    const fields = item.fields;
    const date = fields.date?.original ?? fields.date?.created ?? "";
    const source = fields.source?.[0]?.shortname ?? fields.source?.[0]?.name ?? "ReliefWeb information partner";
    const reliefWebUrl = fields.url_alias ?? fields.url ?? `https://reliefweb.int/node/${item.id}`;
    return normalizeVerifiedReport({
      canonicalUrl: reliefWebUrl,
      title: fields.title ?? "",
      summary: fields.body ?? "",
      provider: "reliefweb",
      originalSource: source,
      sourceUrl: reliefWebUrl,
      publishedAt: date,
      updatedAt: fields.date?.changed ?? date,
      fetchedAt,
      category: "news",
      countries: (fields.country ?? []).flatMap((entry) => entry.name ? [entry.name] : []),
      locations: [],
      disasterIds: (fields.disaster ?? []).map((entry) => String(entry.id ?? entry.name ?? "")).filter(Boolean),
      eventTypes: (fields.disaster_type ?? []).flatMap((entry) => entry.name ? [entry.name] : []),
      language: fields.language?.[0]?.name ?? "English",
      attribution: `ReliefWeb / ${source}`,
      rawProviderId: String(item.id),
    });
  }).filter((report) => report !== null);
}

const APPNAME = "atlas.chela-x.space";
const DOCUMENTATION = "https://apidoc.reliefweb.int/";
const CONFIGURATION = "ReliefWeb must pre-approve appname atlas.chela-x.space before production access.";

export class ReliefWebProvider implements NewsProvider {
  readonly id = "reliefweb";
  readonly name = "ReliefWeb";
  readonly providerType = "api" as const;
  readonly attribution = "ReliefWeb / UN OCHA and the named original information partner";
  readonly documentationUrl = DOCUMENTATION;
  readonly rateLimit = { requests: 1000, window: "day" as const, maxItemsPerRequest: 1000 };
  private checkedAt: string | null = null;
  private successfulAt: string | null = null;
  private currentErrorCode: string | null = null;
  private currentErrorMessage: string | null = null;

  get status() { return process.env.RELIEFWEB_APPNAME_APPROVED === "true" ? "online" as const : "configuration_required" as const; }
  get lastCheckedAt() { return this.checkedAt; }
  get lastSuccessfulAt() { return this.successfulAt; }
  get errorCode() { return this.currentErrorCode; }
  get errorMessage() { return this.currentErrorMessage; }

  private health(reportCount: number, status: NewsProviderStatus = this.status, stale = false): ProviderHealth {
    return {
      provider: this.id,
      name: this.name,
      status,
      lastCheckedAt: this.checkedAt,
      lastSuccessfulAt: this.successfulAt,
      stale,
      reportCount,
      errorCode: this.currentErrorCode,
      errorMessage: this.currentErrorMessage,
      configurationRequirement: status === "configuration_required" ? CONFIGURATION : null,
      attribution: this.attribution,
      documentationUrl: this.documentationUrl,
      rateLimit: this.rateLimit,
    };
  }

  private async request(url: string) {
    try {
      return await fetchJson(url, { timeoutMs: 8000, maxBytes: 1_000_000, revalidate: 1800, validate: isReliefWebResponse });
    } catch (error) {
      if (!(error instanceof UpstreamError) || (error.status < 500 && error.status !== 429)) throw error;
      return fetchJson(url, { timeoutMs: 8000, maxBytes: 1_000_000, revalidate: 1800, validate: isReliefWebResponse });
    }
  }

  async fetchReports(): Promise<ProviderFetchResult> {
    this.checkedAt = new Date().toISOString();
    if (this.status === "configuration_required") {
      this.currentErrorCode = "APPNAME_APPROVAL_REQUIRED";
      this.currentErrorMessage = CONFIGURATION;
      return { reports: [], health: this.health(0) };
    }
    return withProviderCache(this.id, 30 * 60_000, 6 * 60 * 60_000, async () => {
      const fields = [
        "title", "url", "url_alias", "body", "date", "source", "country",
        "disaster", "disaster_type", "format", "language", "headline",
      ].map((field) => `fields[include][]=${encodeURIComponent(field)}`).join("&");
      const url = `https://api.reliefweb.int/v2/reports?appname=${APPNAME}&limit=40&preset=latest&profile=full&${fields}`;
      const disasterReportsUrl = `https://api.reliefweb.int/v2/reports?appname=${APPNAME}&limit=20&preset=latest&profile=full&filter[field]=disaster&${fields}`;
      const disastersUrl = `https://api.reliefweb.int/v2/disasters?appname=${APPNAME}&limit=40&preset=latest&profile=full`;
      const [response, disasterReports] = await Promise.all([
        this.request(url),
        this.request(disasterReportsUrl),
        this.request(disastersUrl),
      ]);
      const reports = parseReliefWebReports({
        data: [...response.data.data, ...disasterReports.data.data],
      }, response.fetchedAt);
      this.successfulAt = response.fetchedAt;
      this.currentErrorCode = null;
      this.currentErrorMessage = null;
      return { reports, health: this.health(reports.length, "online") };
    });
  }

  async healthCheck(): Promise<ProviderHealth> {
    try { return (await this.fetchReports()).health; }
    catch (error) {
      this.checkedAt = new Date().toISOString();
      const rateLimited = error instanceof UpstreamError && error.status === 429;
      this.currentErrorCode = rateLimited ? "RATE_LIMITED" : "PROVIDER_UNAVAILABLE";
      this.currentErrorMessage = rateLimited ? "ReliefWeb request quota was reached" : "ReliefWeb is temporarily unavailable";
      return this.health(0, rateLimited ? "rate_limited" : "unavailable");
    }
  }
}
