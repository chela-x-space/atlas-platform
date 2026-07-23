import {
  DATA_SOURCES,
  getDataSourceDisabledReason,
  type AtlasDataSource,
} from "@/config/data-sources";
import type { ProviderHealth } from "@/lib/news/provider-contract";
import type { AtlasEventSourceHealth } from "@/types/atlas-data";

export type SourceOperationsStatus =
  | "online"
  | "paused"
  | "disabled"
  | "configuration_required"
  | "rate_limited"
  | "unavailable";

export type SourceOperationsProvider = {
  readonly id: string;
  readonly name: string;
  readonly organization: string;
  readonly category: string;
  readonly status: SourceOperationsStatus;
  readonly reports: number;
  readonly lastSuccess: string | null;
  readonly lastChecked: string | null;
  readonly latencyMs: number | null;
  readonly coverage: string;
  readonly license: { readonly label: string; readonly url: string | null };
  readonly attribution: string;
  readonly documentationUrl: string;
  readonly notes: string;
  readonly stale: boolean;
  readonly errorCode: string | null;
};

const COVERAGE: Readonly<Record<string, string>> = {
  "usgs-earthquakes": "Global earthquakes; completeness varies by region and magnitude",
  "open-meteo": "Global point weather forecasts; deployment terms apply",
  reliefweb: "Global humanitarian reports and disaster metadata",
  "nasa-rss": "Global NASA agency publications",
  "esa-rss": "Global ESA missions and activities",
  "jpl-news": "Global JPL mission publications",
  "cneos-news": "Global near-Earth object publications",
  "noaa-nhc": "Atlantic and eastern/central Pacific cyclone basins",
  "who-emergencies": "Global health emergencies, pending verified integration",
  "openaq-v3": "Global participating air-quality monitoring locations",
  opensky: "Sensor-dependent global aviation coverage",
};

function registryStatus(source: AtlasDataSource): SourceOperationsStatus {
  if (source.status === "configuration_required") return "configuration_required";
  if (source.status === "planned") return "paused";
  if (source.status === "unavailable") return "unavailable";
  if (source.status === "disabled" || !source.enabledByDefault) return "disabled";
  return "online";
}

function eventStatus(
  source: AtlasDataSource,
  health: AtlasEventSourceHealth | undefined,
): SourceOperationsStatus {
  if (source.status === "planned") return "paused";
  if (source.status === "configuration_required") return "configuration_required";
  if (!health) return registryStatus(source);
  if (health.status === "healthy" || health.status === "degraded") return "online";
  if (health.status === "unavailable") return "unavailable";
  return "disabled";
}

function newsStatus(status: ProviderHealth["status"]): SourceOperationsStatus {
  if (status === "online" || status === "degraded") return "online";
  return status;
}

function licenseLabel(source: AtlasDataSource): string {
  if (!source.licenseOrTermsUrl) return "Not documented";
  if (source.id === "open-meteo") return "CC BY 4.0 / service terms";
  if (source.id === "reliefweb") return "API terms / source copyright";
  if (source.organization.includes("NASA") || source.id === "nasa-rss") return "NASA media and attribution terms";
  if (source.id === "esa-rss") return "ESA terms and conditions";
  if (source.organization.includes("U.S.") || source.organization.includes("NOAA")) return "U.S. government / product terms";
  return "Provider terms";
}

export function buildSourceOperationsProviders(
  eventHealth: readonly AtlasEventSourceHealth[],
  newsHealth: readonly ProviderHealth[],
  sources: readonly AtlasDataSource[] = DATA_SOURCES,
): SourceOperationsProvider[] {
  const events = new Map(eventHealth.map((health) => [health.sourceId, health]));
  const news = new Map(newsHealth.map((health) => [health.provider, health]));

  return sources.map((source) => {
    const event = events.get(source.id);
    const publication = news.get(source.id);
    const status = publication ? newsStatus(publication.status) : eventStatus(source, event);
    const disabledReason = getDataSourceDisabledReason(source);
    const healthNote = publication?.errorMessage ?? event?.message ?? null;
    return {
      id: source.id,
      name: source.name,
      organization: source.organization,
      category: source.category,
      status,
      reports: publication?.reportCount ?? event?.itemCount ?? 0,
      lastSuccess: publication?.lastSuccessfulAt ??
        (event && (event.status === "healthy" || event.status === "degraded") ? event.checkedAt : null),
      lastChecked: publication?.lastCheckedAt ?? event?.checkedAt ?? null,
      latencyMs: event?.responseTimeMs ?? null,
      coverage: COVERAGE[source.id] ?? "Provider-defined coverage",
      license: { label: licenseLabel(source), url: source.licenseOrTermsUrl ?? null },
      attribution: source.attribution,
      documentationUrl: source.documentationUrl,
      notes: [source.notes, healthNote, !healthNote ? disabledReason : null]
        .filter((note, index, values): note is string => Boolean(note) && values.indexOf(note) === index)
        .join(" "),
      stale: publication?.stale ?? false,
      errorCode: publication?.errorCode ?? event?.errorCode ?? null,
    };
  }).sort((left, right) => left.name.localeCompare(right.name));
}

