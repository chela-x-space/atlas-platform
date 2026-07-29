"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AtlasSidebar } from "./AtlasSidebar";
import { BreakingHero, HeroEmptyState, HeroSkeleton } from "./BreakingHero";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import {
  hotRegions,
  rankDashboardEvents,
  routeForMenu,
  situationCounts,
} from "@/lib/dashboard-logic.mjs";
import { safeExternalUrl } from "@/lib/security/external-url.mjs";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { isBreakingHeroEvent, selectDashboardHeroEvent } from "@/lib/dashboard-hero-logic.mjs";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type {
  AtlasDashboardSnapshot,
  AtlasEvidenceMedia,
  AtlasEvent,
  AtlasEventCategory,
  AtlasSeverity,
} from "@/types/atlas-data";

const CATEGORY_GROUPS: ReadonlyArray<{
  label: MessageKey;
  categories: readonly AtlasEventCategory[];
}> = [
  { label: "category.marketsEconomy", categories: ["market"] },
  { label: "category.aiTechnology", categories: ["technology", "science"] },
  { label: "category.cyberSecurity", categories: ["cyber"] },
  { label: "category.weatherDisasters", categories: ["earthquake", "cyclone", "weather", "climate", "wildfire", "flood", "volcano"] },
  { label: "category.space", categories: ["space", "earth-observation"] },
  { label: "category.health", categories: ["health"] },
];

const severityMessage: Record<AtlasSeverity, MessageKey> = {
  critical: "severity.critical",
  high: "severity.highImpact",
  moderate: "severity.regional",
  low: "severity.low",
  info: "severity.monitoring",
  unknown: "severity.monitoring",
};
const summaryMessage = {
  critical: "severity.critical",
  "high-impact": "severity.highImpact",
  regional: "severity.regional",
  monitoring: "severity.monitoring",
} as const satisfies Record<string, MessageKey>;

const categoryMessages: Partial<Record<string, MessageKey>> = {
  earthquake: "enum.earthquake", volcano: "enum.volcano", weather: "enum.weather",
  disaster: "enum.disaster", conflict: "enum.conflict", economy: "enum.economy",
  market: "enum.markets", markets: "enum.markets", technology: "enum.aiTechnology",
  cyber: "enum.cybersecurity", cybersecurity: "enum.cybersecurity", aviation: "enum.aviation",
  marine: "enum.marine", space: "enum.space", energy: "enum.energy", health: "enum.health",
};

const visualMediaTypes=new Set(["OFFICIAL_IMAGE","SATELLITE_IMAGE","MAP","LOGO","CHART","GRAPH","INFOGRAPHIC","SCREENSHOT"]);
function safeMediaUrl(value:string){try{const url=new URL(value);return url.protocol==="https:"&&!url.username&&!url.password?url.toString():null}catch{return null}}

function EventCard({ event, featured = false, media }: { event: AtlasEvent; featured?: boolean;media?:AtlasEvidenceMedia }) {
  const { formatDateTime, t } = useI18n();
  const sourceUrl = safeExternalUrl(event.sourceUrl);
  const mediaUrl=media?safeMediaUrl(media.thumbnailUrl??media.displayUrl):null;
  const categoryMessage = categoryMessages[event.category];
  return (
    <article className={`situation-event severity-${event.severity}${featured ? " featured" : ""}`}>
      <header>
        <span className="severity-chip">
          <i aria-hidden="true" />
          {t(severityMessage[event.severity])}
        </span>
        <span>{categoryMessage ? t(categoryMessage) : event.category.replaceAll("-", " ")}</span>
      </header>
      {media&&mediaUrl&&visualMediaTypes.has(media.mediaType)?(
        <figure className="evidence-media">
          {/* eslint-disable-next-line @next/next/no-img-element -- Evidence remains provider-hosted and must not be transformed or mirrored. */}
          <img src={mediaUrl} alt={media.caption}/>
          <figcaption>{media.attribution} · {media.licenseSummary}</figcaption>
        </figure>
      ):null}
      <h3>
        <Link href={`/app/events/${encodeURIComponent(event.id)}`}>{event.title}</Link>
      </h3>
      <p>{event.summary || t("label.noData")}</p>
      <dl>
        <div><dt>{t("label.region")}</dt><dd>{event.region || event.countryCode || t("label.unknown")}</dd></div>
        <div><dt>{t("label.observed")}</dt><dd><time dateTime={event.occurredAt}>{formatDateTime(event.occurredAt)}</time></dd></div>
      </dl>
      <footer>
        <span>{t("label.source")}: {event.sourceName}</span>
        {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{t("action.verifySource")} ↗</a> : <span>{event.attribution}</span>}
      </footer>
    </article>
  );
}

export function AtlasDashboard() {
  const { formatNumber, t } = useI18n();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [snapshot, setSnapshot] = useState<AtlasDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message ?? "Dashboard unavailable");
        if (!cancelled) setSnapshot(data as AtlasDashboardSnapshot);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, []);

  const events = useMemo(() => snapshot?.timelineEvents ?? [], [snapshot]);
  const ranked = useMemo(() => rankDashboardEvents(events), [events]);
  const heroEvent = useMemo(() => selectDashboardHeroEvent(events), [events]);
  const topEvents = ranked.slice(0, 5);
  const latestEvents = useMemo(
    () => [...ranked.slice(5)].sort((left, right) =>
      (Date.parse(right.occurredAt) || 0) - (Date.parse(left.occurredAt) || 0) ||
      left.id.localeCompare(right.id),
    ),
    [ranked],
  );
  const summaries = useMemo(() => situationCounts(events), [events]);
  const regions = useMemo(() => hotRegions(events).slice(0, 6), [events]);
  const categoryIntelligence = useMemo(() => CATEGORY_GROUPS.map((group) => {
    const categoryEvents = ranked.filter((event) => group.categories.includes(event.category));
    return categoryEvents.length ? { ...group, events: categoryEvents } : null;
  }).filter((group): group is NonNullable<typeof group> => group !== null), [ranked]);

  function handleMenu(item: string) {
    const route = routeForMenu(item);
    if (route) router.push(route);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const normalized = query.trim();
    router.push(normalized ? `/app/search?q=${encodeURIComponent(normalized)}` : "/app/search");
  }

  return (
    <div className="atlas-v4 situation-dashboard">
      <AtlasSidebar activeItem="Global Overview" onSelect={handleMenu} />

      <main className="situation-main">
        <header className="situation-toolbar">
          <Link className="situation-mobile-brand" href="/app" aria-label="ATLAS Global Intelligence home">ATLAS</Link>
          <form className="atlas-v4-search" role="search" onSubmit={submitSearch}>
            <span aria-hidden="true">⌕</span>
            <input ref={searchRef} type="search" value={query} placeholder={t("search.placeholder")} aria-label={t("search.label")} onChange={(event) => setQuery(event.target.value)} />
            <kbd>/</kbd>
          </form>
          <nav aria-label={t("navigation.dashboardUtilities")}>
            <Link href="/app/map">{t("navigation.map")}</Link>
            <Link href="/app/timeline">{t("navigation.timeline")}</Link>
            <Link href="/app/search">{t("navigation.search")}</Link>
          </nav>
          <LanguageSwitcher />
        </header>

        <div className="situation-content">
          {loading ? <HeroSkeleton /> : heroEvent && snapshot ? (
            <BreakingHero
              event={heroEvent}
              media={snapshot.evidenceMedia?.[heroEvent.id]}
              breaking={isBreakingHeroEvent(heroEvent, snapshot.generatedAt)}
            />
          ) : !error ? <HeroEmptyState generatedAt={snapshot?.generatedAt} /> : null}

          {error ? <div className="situation-state error" role="status">{t("dashboard.error")}</div> : null}

          <section className="situation-summary" aria-label={t("dashboard.severitySummary")} aria-busy={loading}>
            {summaries.map((summary) => (
              <article className={`level-${summary.key}`} key={summary.key}>
                <span><i aria-hidden="true" />{t(summaryMessage[summary.key])}</span>
                <strong>{loading ? "—" : formatNumber(summary.count)}</strong>
                <small>{loading ? t("dashboard.awaiting") : summary.count === 0 ? t("dashboard.noEvents") : t(summary.count === 1 ? "dashboard.verifiedEvent" : "dashboard.verifiedEvents", { count: formatNumber(summary.count) })}</small>
              </article>
            ))}
          </section>

          <section className="situation-section top-events" aria-labelledby="top-global-events-heading">
            <div className="situation-heading">
              <div><span>{t("dashboard.priorityBrief")}</span><h2 id="top-global-events-heading">{t("dashboard.topEvents")}</h2></div>
              <Link href="/app/timeline">{t("dashboard.viewLiveTimeline")} →</Link>
            </div>
            {topEvents.length ? (
              <div className="top-event-grid">
                {topEvents.map((event, index) => <EventCard event={event} featured={index === 0} media={snapshot?.evidenceMedia?.[event.id]} key={event.id} />)}
              </div>
            ) : <div className="situation-state" role="status">{loading ? t("dashboard.loadingEvents") : t("dashboard.noCritical")}</div>}
          </section>

          <div className="situation-columns">
            <section className="situation-section hot-regions" aria-labelledby="hot-regions-heading">
              <div className="situation-heading"><div><span>{t("dashboard.geographicView")}</span><h2 id="hot-regions-heading">{t("dashboard.hotRegions")}</h2></div></div>
              {regions.length ? (
                <ol>
                  {regions.map((region) => (
                    <li key={region.name}>
                      <div><strong>{region.name}</strong><span>{t("dashboard.highestSeverity", { severity: t(severityMessage[region.highestSeverity as AtlasSeverity]) })}</span></div>
                      <b>{t(region.count === 1 ? "dashboard.event" : "dashboard.events", { count: formatNumber(region.count) })}</b>
                      <Link href="/app/timeline" aria-label={`${t("action.viewTimeline")}: ${region.name}`}>{t("dashboard.view")} →</Link>
                    </li>
                  ))}
                </ol>
              ) : <div className="situation-state">{loading ? t("dashboard.derivingRegions") : t("dashboard.noActiveRegions")}</div>}
            </section>

            <section className="situation-section category-intelligence" aria-labelledby="category-intelligence-heading">
              <div className="situation-heading"><div><span>{t("dashboard.domainSignals")}</span><h2 id="category-intelligence-heading">{t("dashboard.categoryIntelligence")}</h2></div></div>
              {categoryIntelligence.length ? (
                <div className="category-grid">
                  {categoryIntelligence.map((group) => (
                    <article className={`severity-${group.events[0].severity}`} key={group.label}>
                      <span>{t(group.label)}</span>
                      <strong>{t(group.events.length === 1 ? "dashboard.activeEvent" : "dashboard.activeEvents", { count: formatNumber(group.events.length) })}</strong>
                      <small>{t("dashboard.highest", { severity: t(severityMessage[group.events[0].severity as AtlasSeverity]) })}</small>
                    </article>
                  ))}
                </div>
              ) : <div className="situation-state">{loading ? t("dashboard.loadingCategories") : t("dashboard.awaiting")}</div>}
            </section>
          </div>

          <section className="situation-section latest-intelligence" aria-labelledby="latest-intelligence-heading">
            <div className="situation-heading">
              <div><span>{t("dashboard.verifiedFeed")}</span><h2 id="latest-intelligence-heading">{t("dashboard.latestVerified")}</h2></div>
              <Link href="/app/sources">{t("navigation.sourceCenter")} →</Link>
            </div>
            {latestEvents.length ? (
              <div className="latest-event-grid">
                {latestEvents.map((event) => <EventCard event={event} media={snapshot?.evidenceMedia?.[event.id]} key={event.id} />)}
              </div>
            ) : <div className="situation-state">{loading ? t("dashboard.loadingRecent") : events.length ? t("dashboard.allInBrief") : t("dashboard.awaiting")}</div>}
          </section>

          <p className="situation-disclaimer">{t("dashboard.disclaimer")}</p>
        </div>
      </main>
    </div>
  );
}
