"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AtlasSidebar } from "./AtlasSidebar";
import {
  hotRegions,
  rankDashboardEvents,
  routeForMenu,
  situationCounts,
} from "@/lib/dashboard-logic.mjs";
import { safeExternalUrl } from "@/lib/security/external-url.mjs";
import type {
  AtlasDashboardSnapshot,
  AtlasEvent,
  AtlasEventCategory,
  AtlasSeverity,
} from "@/types/atlas-data";

const CATEGORY_GROUPS: ReadonlyArray<{
  label: string;
  categories: readonly AtlasEventCategory[];
}> = [
  { label: "Markets and Economy", categories: ["market"] },
  { label: "AI and Technology", categories: ["technology", "science"] },
  { label: "Cyber Security", categories: ["cyber"] },
  { label: "Weather and Disasters", categories: ["earthquake", "cyclone", "weather", "climate", "wildfire", "flood", "volcano"] },
  { label: "Space", categories: ["space", "earth-observation"] },
  { label: "Health", categories: ["health"] },
];

const severityLabel: Record<AtlasSeverity, string> = {
  critical: "Critical",
  high: "High impact",
  moderate: "Regional",
  low: "Low",
  info: "Monitoring",
  unknown: "Monitoring",
};

function EventCard({ event, featured = false }: { event: AtlasEvent; featured?: boolean }) {
  const sourceUrl = safeExternalUrl(event.sourceUrl);
  return (
    <article className={`situation-event severity-${event.severity}${featured ? " featured" : ""}`}>
      <header>
        <span className="severity-chip">
          <i aria-hidden="true" />
          {severityLabel[event.severity]}
        </span>
        <span>{event.category.replaceAll("-", " ")}</span>
      </header>
      <h3>
        <Link href={`/app/events/${encodeURIComponent(event.id)}`}>{event.title}</Link>
      </h3>
      <p>{event.summary || "Verified summary unavailable."}</p>
      <dl>
        <div><dt>Region</dt><dd>{event.region || event.countryCode || "Global / unspecified"}</dd></div>
        <div><dt>Observed</dt><dd><time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString()}</time></dd></div>
      </dl>
      <footer>
        <span>Source: {event.sourceName}</span>
        {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer">Verify source ↗</a> : <span>{event.attribution}</span>}
      </footer>
    </article>
  );
}

export function AtlasDashboard() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [snapshot, setSnapshot] = useState<AtlasDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message ?? "Dashboard unavailable");
        if (!cancelled) setSnapshot(data as AtlasDashboardSnapshot);
      })
      .catch(() => {
        if (!cancelled) setError("Awaiting verified intelligence. ATLAS Data Hub is currently unavailable.");
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
            <input ref={searchRef} type="search" value={query} placeholder="Search intelligence…" aria-label="Search intelligence" onChange={(event) => setQuery(event.target.value)} />
            <kbd>/</kbd>
          </form>
          <nav aria-label="Dashboard utilities">
            <Link href="/app/map">Map</Link>
            <Link href="/app/timeline">Timeline</Link>
            <Link href="/app/search">Search</Link>
          </nav>
        </header>

        <div className="situation-content">
          <section className="situation-hero" aria-labelledby="global-situation-heading">
            <div>
              <p>ATLAS · GLOBAL INTELLIGENCE PLATFORM</p>
              <h1 id="global-situation-heading">GLOBAL SITUATION NOW</h1>
              <span>Verified, high-impact events from connected public sources.</span>
            </div>
            <p className="situation-freshness">
              {snapshot ? <>Snapshot <time dateTime={snapshot.generatedAt}>{new Date(snapshot.generatedAt).toLocaleString()}</time></> : loading ? "Loading verified intelligence…" : "Data unavailable"}
            </p>
          </section>

          {error ? <div className="situation-state error" role="status">{error}</div> : null}

          <section className="situation-summary" aria-label="Global event severity summary" aria-busy={loading}>
            {summaries.map((summary) => (
              <article className={`level-${summary.key}`} key={summary.key}>
                <span><i aria-hidden="true" />{summary.label}</span>
                <strong>{loading ? "—" : summary.count}</strong>
                <small>{loading ? "Awaiting verified intelligence" : summary.count === 0 ? "No events detected" : `${summary.count} verified event${summary.count === 1 ? "" : "s"}`}</small>
              </article>
            ))}
          </section>

          <section className="situation-section top-events" aria-labelledby="top-global-events-heading">
            <div className="situation-heading">
              <div><span>PRIORITY BRIEF</span><h2 id="top-global-events-heading">TOP GLOBAL EVENTS</h2></div>
              <Link href="/app/timeline">View Live Timeline →</Link>
            </div>
            {topEvents.length ? (
              <div className="top-event-grid">
                {topEvents.map((event, index) => <EventCard event={event} featured={index === 0} key={event.id} />)}
              </div>
            ) : <div className="situation-state" role="status">{loading ? "Loading verified events…" : "No critical events detected"}</div>}
          </section>

          <div className="situation-columns">
            <section className="situation-section hot-regions" aria-labelledby="hot-regions-heading">
              <div className="situation-heading"><div><span>GEOGRAPHIC VIEW</span><h2 id="hot-regions-heading">HOT REGIONS</h2></div></div>
              {regions.length ? (
                <ol>
                  {regions.map((region) => (
                    <li key={region.name}>
                      <div><strong>{region.name}</strong><span>{severityLabel[region.highestSeverity as AtlasSeverity]} highest severity</span></div>
                      <b>{region.count} event{region.count === 1 ? "" : "s"}</b>
                      <Link href="/app/timeline" aria-label={`View timeline for ${region.name}`}>View →</Link>
                    </li>
                  ))}
                </ol>
              ) : <div className="situation-state">{loading ? "Deriving active regions…" : "No active regions in verified intelligence"}</div>}
            </section>

            <section className="situation-section category-intelligence" aria-labelledby="category-intelligence-heading">
              <div className="situation-heading"><div><span>DOMAIN SIGNALS</span><h2 id="category-intelligence-heading">CATEGORY INTELLIGENCE</h2></div></div>
              {categoryIntelligence.length ? (
                <div className="category-grid">
                  {categoryIntelligence.map((group) => (
                    <article className={`severity-${group.events[0].severity}`} key={group.label}>
                      <span>{group.label}</span>
                      <strong>{group.events.length} active event{group.events.length === 1 ? "" : "s"}</strong>
                      <small>Highest: {severityLabel[group.events[0].severity as AtlasSeverity]}</small>
                    </article>
                  ))}
                </div>
              ) : <div className="situation-state">{loading ? "Loading category intelligence…" : "Awaiting verified intelligence"}</div>}
            </section>
          </div>

          <section className="situation-section latest-intelligence" aria-labelledby="latest-intelligence-heading">
            <div className="situation-heading">
              <div><span>VERIFIED FEED</span><h2 id="latest-intelligence-heading">LATEST VERIFIED INTELLIGENCE</h2></div>
              <Link href="/app/sources">Source Center →</Link>
            </div>
            {latestEvents.length ? (
              <div className="latest-event-grid">
                {latestEvents.map((event) => <EventCard event={event} key={event.id} />)}
              </div>
            ) : <div className="situation-state">{loading ? "Loading recent intelligence…" : events.length ? "All current events are included in the priority brief." : "Awaiting verified intelligence"}</div>}
          </section>

          <p className="situation-disclaimer">ATLAS aggregates third-party public data. Coverage and update frequency vary. Verify critical information with the originating authority.</p>
        </div>
      </main>
    </div>
  );
}
