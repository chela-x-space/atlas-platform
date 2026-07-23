"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type {
  TimelineItem,
  TimelineResponse,
  TimelineSourceStatus,
} from "@/lib/timeline/timeline-contract";

const CATEGORIES = [
  ["", "All categories"],
  ["earthquake", "Earthquakes"],
  ["cyclone", "Cyclones"],
  ["space", "Space"],
  ["science", "Science"],
  ["technology", "Technology"],
  ["earth-observation", "Earth observation"],
] as const;
const SOURCES = [
  ["", "All sources"],
  ["usgs-earthquakes", "USGS"],
  ["noaa-nhc", "NOAA/NHC"],
  ["nasa-rss", "NASA"],
  ["esa-rss", "ESA"],
] as const;
const ITEM_TYPES = [
  ["", "All item types"],
  ["event", "Events"],
  ["advisory", "Advisories"],
  ["report", "Reports"],
] as const;

type TimelineApiError = { error?: { code?: string; message?: string } };

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function groupItems(items: readonly TimelineItem[]) {
  const groups = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const key = new Date(item.occurredAt).toISOString().slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()];
}

function TimelineCard({ item }: { item: TimelineItem }) {
  const place = [item.location, ...item.countries].filter(Boolean).join(" · ");
  return (
    <article className="global-timeline-card">
      <div className="global-timeline-card-top">
        <time dateTime={item.occurredAt}>{formatTimestamp(item.occurredAt)}</time>
        <div>
          <span className={`timeline-badge category-${item.category}`}>{item.category}</span>
          <span className="timeline-badge item-type">{item.itemType}</span>
          {item.stale && <span className="timeline-badge stale">stale</span>}
        </div>
      </div>
      <h2>
        <Link href={`/app/events/${encodeURIComponent(item.relatedEventId ?? item.relatedReportId ?? item.id)}`}>
          {item.title}
        </Link>
      </h2>
      {item.summary && <p>{item.summary}</p>}
      <dl>
        <div><dt>Source</dt><dd>{item.sourceName}</dd></div>
        {place && <div><dt>Location</dt><dd>{place}</dd></div>}
        {item.severity && <div><dt>Severity</dt><dd>{item.severity}</dd></div>}
        {item.status && <div><dt>Status</dt><dd>{item.status}</dd></div>}
      </dl>
      <footer>
        <span>{item.attribution}</span>
        {item.sourceUrl && (
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
            Original source ↗
          </a>
        )}
      </footer>
    </article>
  );
}

function PartialNotice({ sources }: { sources: readonly TimelineSourceStatus[] }) {
  const affected = sources.filter((source) => source.status !== "online" || source.stale);
  if (!affected.length) return null;
  return (
    <aside className="global-timeline-partial" role="status">
      <strong>Partial source coverage</strong>
      <span>
        {affected.map((source) => `${source.sourceName}: ${source.stale ? "stale" : source.status}`).join(" · ")}
      </span>
    </aside>
  );
}

export default function GlobalTimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [response, setResponse] = useState<TimelineResponse | null>(null);
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [itemType, setItemType] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const queryString = useMemo(() => {
    const parameters = new URLSearchParams({ limit: "25" });
    if (search) parameters.set("search", search);
    if (category) parameters.set("category", category);
    if (source) parameters.set("source", source);
    if (itemType) parameters.set("itemType", itemType);
    return parameters.toString();
  }, [category, itemType, search, source]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/timeline?${queryString}`, { cache: "no-store", signal: controller.signal })
      .then(async (result) => {
        const body = await result.json() as TimelineResponse & TimelineApiError;
        if (!result.ok) throw new Error(body.error?.message ?? "Unable to load timeline");
        setItems([...body.items]);
        setResponse(body);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load timeline");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [queryString]);

  async function loadMore() {
    if (!response?.nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const result = await fetch(
        `/api/timeline?${queryString}&cursor=${encodeURIComponent(response.nextCursor)}`,
        { cache: "no-store" },
      );
      const body = await result.json() as TimelineResponse & TimelineApiError;
      if (!result.ok) throw new Error(body.error?.message ?? "Unable to load more items");
      setItems((current) => [...current, ...body.items]);
      setResponse(body);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load more items");
    } finally {
      setLoadingMore(false);
    }
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const nextSearch = draftSearch.trim();
    if (nextSearch === search) return;
    setLoading(true);
    setError("");
    setSearch(nextSearch);
  }

  const grouped = groupItems(items);
  const hasFilters = Boolean(search || category || source || itemType);
  const freshness = response?.staleSources.length
    ? "Stale source data"
    : response?.partial
      ? "Partial coverage"
      : response
        ? "Fresh verified sources"
        : "Checking sources";

  return (
    <main className="global-timeline-page">
      <header className="global-timeline-header">
        <div>
          <p>ATLAS GLOBAL ACTIVITY</p>
          <h1>Global Timeline</h1>
          <span>Verified operational events and official reports, newest first.</span>
        </div>
        <div className={`global-timeline-freshness ${response?.partial ? "partial" : ""}`}>
          <i aria-hidden="true" />
          <span>{freshness}</span>
        </div>
      </header>

      <section className="global-timeline-metrics" aria-label="Timeline statistics">
        <article><span>Total items</span><strong>{response?.total.toLocaleString() ?? "—"}</strong></article>
        <article><span>Active sources</span><strong>{response?.activeSources ?? "—"}</strong></article>
        <article><span>Last updated</span><strong>{response ? formatTimestamp(response.fetchedAt) : "Pending"}</strong></article>
      </section>

      <section className="global-timeline-controls" aria-label="Timeline filters">
        <form onSubmit={submitSearch}>
          <label>
            <span className="source-visually-hidden">Search timeline</span>
            <input
              type="search"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Search verified activity"
            />
          </label>
          <button type="submit">Search</button>
        </form>
        <div>
          <label>
            <span>Category</span>
            <select value={category} onChange={(event) => {
              setLoading(true);
              setError("");
              setCategory(event.target.value);
            }}>
              {CATEGORIES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <label>
            <span>Source</span>
            <select value={source} onChange={(event) => {
              setLoading(true);
              setError("");
              setSource(event.target.value);
            }}>
              {SOURCES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <label>
            <span>Item type</span>
            <select value={itemType} onChange={(event) => {
              setLoading(true);
              setError("");
              setItemType(event.target.value);
            }}>
              {ITEM_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {response && <PartialNotice sources={response.sourceStatus} />}
      {error && !loading && <div className="global-timeline-error" role="alert">{error}</div>}

      {loading ? (
        <section className="global-timeline-state" role="status">
          <span className="source-spinner" aria-hidden="true" />
          <h2>Loading global activity</h2>
          <p>Collecting verified operational events and official reports.</p>
        </section>
      ) : !error && !items.length ? (
        <section className="global-timeline-state">
          <h2>{hasFilters ? "No matching timeline items" : "No verified activity available"}</h2>
          <p>{hasFilters ? "Change or clear the active filters." : "The active sources returned no records."}</p>
          {hasFilters && (
            <button type="button" onClick={() => {
              setLoading(true);
              setError("");
              setDraftSearch("");
              setSearch("");
              setCategory("");
              setSource("");
              setItemType("");
            }}>Clear filters</button>
          )}
        </section>
      ) : (
        <section className="global-timeline-stream" aria-label="Global chronological activity">
          {grouped.map(([date, dateItems]) => (
            <section className="global-timeline-day" key={date}>
              <h2>{dateLabel(`${date}T12:00:00.000Z`)}</h2>
              <div className="global-timeline-rail">
                {dateItems.map((item) => <TimelineCard item={item} key={item.id} />)}
              </div>
            </section>
          ))}
          {response?.nextCursor && (
            <button className="global-timeline-more" type="button" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading more…" : "Load more activity"}
            </button>
          )}
        </section>
      )}
    </main>
  );
}
