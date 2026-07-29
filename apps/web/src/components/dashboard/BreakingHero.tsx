import Link from "next/link";

import { useI18n } from "@/lib/i18n/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { safeExternalUrl } from "@/lib/security/external-url.mjs";
import type { AtlasEvidenceMedia, AtlasEvent, AtlasSeverity } from "@/types/atlas-data";

const HERO_MEDIA_TYPES = new Set([
  "OFFICIAL_IMAGE",
  "SATELLITE_IMAGE",
  "MAP",
  "CHART",
  "GRAPH",
  "INFOGRAPHIC",
  "SCREENSHOT",
]);

const severityMessage: Record<AtlasSeverity, MessageKey> = {
  critical: "severity.critical",
  high: "severity.highImpact",
  moderate: "severity.regional",
  low: "severity.low",
  info: "severity.monitoring",
  unknown: "severity.monitoring",
};

const categoryMessages: Partial<Record<string, MessageKey>> = {
  earthquake: "enum.earthquake", volcano: "enum.volcano", weather: "enum.weather",
  disaster: "enum.disaster", conflict: "enum.conflict", economy: "enum.economy",
  market: "enum.markets", markets: "enum.markets", technology: "enum.aiTechnology",
  cyber: "enum.cybersecurity", cybersecurity: "enum.cybersecurity", aviation: "enum.aviation",
  marine: "enum.marine", space: "enum.space", energy: "enum.energy", health: "enum.health",
};

function safeMediaUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

export function HeroSkeleton() {
  const { t } = useI18n();
  return (
    <section className="intelligence-hero hero-skeleton" aria-label={t("hero.loading")} aria-busy="true">
      <div className="hero-skeleton-media" />
      <div className="hero-skeleton-copy">
        <span />
        <strong />
        <strong />
        <p />
        <div />
      </div>
    </section>
  );
}

export function BreakingHero({
  event,
  media,
  breaking,
}: {
  event: AtlasEvent;
  media?: AtlasEvidenceMedia;
  breaking: boolean;
}) {
  const { formatDateTime, t } = useI18n();
  const sourceUrl = safeExternalUrl(event.sourceUrl);
  const mediaUrl = media && HERO_MEDIA_TYPES.has(media.mediaType)
    ? safeMediaUrl(media.thumbnailUrl ?? media.displayUrl)
    : null;
  const categoryMessage = categoryMessages[event.category];
  const detailsUrl = `/app/events/${encodeURIComponent(event.id)}`;

  return (
    <article className={`intelligence-hero severity-${event.severity}${mediaUrl ? " has-media" : " no-media"}`}>
      {media && mediaUrl ? (
        <figure className="intelligence-hero-media">
          {/* eslint-disable-next-line @next/next/no-img-element -- Safe Evidence Media remains provider-hosted and is not mirrored. */}
          <img src={mediaUrl} alt={media.caption} fetchPriority="high" />
          <figcaption>
            <span>{media.attribution}</span>
            <span>{media.licenseSummary}</span>
          </figcaption>
        </figure>
      ) : null}

      <div className="intelligence-hero-copy">
        <header>
          <span className={`hero-eyebrow${breaking ? " breaking" : ""}`}>
            {t(breaking ? "hero.breaking" : "hero.topIntelligence")}
          </span>
          <span className="severity-chip">
            <i aria-hidden="true" />
            {t(severityMessage[event.severity])}
          </span>
        </header>

        <div>
          <p className="hero-kicker">{t("hero.latestVerifiedEvent")}</p>
          <h1>{event.title}</h1>
          {event.summary ? <p className="hero-summary">{event.summary}</p> : null}
        </div>

        <dl className="hero-metadata">
          <div><dt>{t("label.category")}</dt><dd>{categoryMessage ? t(categoryMessage) : event.category.replaceAll("-", " ")}</dd></div>
          <div><dt>{t("hero.verifiedSource")}</dt><dd>{event.sourceName}</dd></div>
          <div><dt>{t("label.observed")}</dt><dd><time dateTime={event.occurredAt}>{formatDateTime(event.occurredAt)}</time></dd></div>
        </dl>

        <nav className="hero-actions" aria-label={t("hero.actions")}>
          <Link className="primary" href={detailsUrl}>{t(mediaUrl ? "hero.viewEvidence" : "hero.viewDetails")}</Link>
          {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{t("hero.officialSource")} ↗</a> : null}
        </nav>
      </div>
    </article>
  );
}

export function HeroEmptyState({ generatedAt }: { generatedAt?: string }) {
  const { formatDateTime, t } = useI18n();
  return (
    <section className="intelligence-hero-empty" aria-labelledby="hero-empty-heading">
      <p>{t("hero.latestVerifiedEvent")}</p>
      <h1 id="hero-empty-heading">{t("hero.noPriorityEvent")}</h1>
      <span>{t("hero.monitoringSources")}</span>
      {generatedAt ? <small>{t("hero.latestUpdate")}: <time dateTime={generatedAt}>{formatDateTime(generatedAt)}</time></small> : null}
    </section>
  );
}
