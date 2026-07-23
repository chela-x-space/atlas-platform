"use client";

import { useCallback, useEffect, useState } from "react";
import {
  canUseAiSummary,
  filterNewsGroups,
  groupNewsByEvent,
  type AtlasNewsEventGroup,
} from "@/lib/news/news-center-logic.mjs";
import type { AtlasNewsItem } from "@/types/atlas-data";

type NewsSourceHealth = {
  provider: string;
  name: string;
  status: "online" | "degraded" | "paused" | "disabled" | "configuration_required" | "rate_limited" | "unavailable";
  stale: boolean;
  reportCount: number;
  errorCode: string | null;
};

export type NewsResponse = {
  items?: readonly AtlasNewsItem[];
  sources?: readonly NewsSourceHealth[];
  eventGroups?: ReadonlyArray<{
    id: string;
    eventAnchor: { title: string } | null;
    relatedReports: ReadonlyArray<{ id: string }>;
    distinctSourceCount: number;
    newestPublicationTime: string;
    categories: readonly string[];
    confidence: "exact" | "strong" | "probable" | "standalone";
    groupingReason: string;
  }>;
  fetchedAt?: string;
  error?: { code: string; message: string };
};

const TRUSTED_SOURCE_IDS = ["reliefweb", "nasa-rss", "esa-rss"] as const;

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SourceArticle({ article, related }: { article: AtlasNewsItem; related?: boolean }) {
  return (
    <article className={related ? "news-related-article" : "news-primary-article"}>
      <div className="news-source-line">
        <span className="news-verified-badge" title="Published by a configured official source">
          <span aria-hidden="true">✓</span> Verified source
        </span>
        <span className="news-source-badge">{article.sourceName}</span>
        {article.originalSource && article.originalSource !== article.sourceName && (
          <span className="news-source-badge">From {article.originalSource}</span>
        )}
        <time dateTime={article.publishedAt}>{formatTimestamp(article.publishedAt)}</time>
      </div>
      {related && <h3>{article.title}</h3>}
      {!related && article.summary && (
        <p className="news-source-summary">
          <span>Source report</span>
          {article.summary}
        </p>
      )}
      {article.attribution && (
        <span className="news-attribution">Attribution: {article.attribution}</span>
      )}
      {article.sourceUrl ? (
        <a href={article.sourceUrl} target="_blank" rel="noreferrer">
          Read original <span aria-hidden="true">↗</span>
        </a>
      ) : (
        <span className="news-link-unavailable">Original link unavailable</span>
      )}
    </article>
  );
}

function EventCard({ group }: { group: AtlasNewsEventGroup }) {
  const [expanded, setExpanded] = useState(false);
  const primary = group.articles[0];
  const related = group.articles.slice(1);
  const aiEligible = canUseAiSummary(group, TRUSTED_SOURCE_IDS);

  return (
    <article className="news-event-card">
      <header className="news-event-card-header">
        <div className="news-event-meta">
          <span className="news-category">{group.category}</span>
          <span>{group.sourceCount} {group.sourceCount === 1 ? "source" : "sources"}</span>
          <span>{group.articles.length} {group.articles.length === 1 ? "report" : "reports"}</span>
        </div>
        <time dateTime={group.latestAt}>{formatTimestamp(group.latestAt)}</time>
      </header>
      <h2>{group.title}</h2>
      <SourceArticle article={primary} />
      <div className="news-coverage-note">
        <span aria-hidden="true">◇</span>
        {group.groupingReason
          ? `${group.confidence === "probable" ? "Probable grouping" : "Grouping"}: ${group.groupingReason}.`
          : aiEligible
          ? "Multi-source coverage available. No AI summary has been generated."
          : "AI summary withheld until at least two trusted sources cover this event."}
      </div>
      {related.length > 0 && (
        <section className="news-related">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            Related news ({related.length})
            <span aria-hidden="true">{expanded ? "−" : "+"}</span>
          </button>
          {expanded && (
            <div className="news-related-list">
              {related.map((article) => (
                <SourceArticle key={article.id} article={article} related />
              ))}
            </div>
          )}
        </section>
      )}
    </article>
  );
}

function LoadingState() {
  return (
    <div className="news-loading" role="status" aria-label="Loading verified news">
      {[0, 1, 2, 3].map((item) => (
        <div className="news-skeleton" key={item}>
          <span />
          <strong />
          <i />
          <i />
        </div>
      ))}
    </div>
  );
}

export default function NewsCenterClient({ initialPayload }: { initialPayload: NewsResponse | null }) {
  const [payload, setPayload] = useState<NewsResponse | null>(initialPayload);
  const [loading, setLoading] = useState(initialPayload === null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const loadNews = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/news", { signal, cache: "no-store" });
      const body = await response.json() as NewsResponse;
      if (!response.ok) throw new Error(body.error?.message ?? "Unable to load verified news");
      setPayload(body);
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(loadError instanceof Error ? loadError.message : "Unable to load verified news");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/news", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as NewsResponse;
        if (!response.ok) throw new Error(body.error?.message ?? "Unable to load verified news");
        setPayload(body);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        if (initialPayload === null) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load verified news");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [initialPayload]);

  const groups = (() => {
    const fallback = groupNewsByEvent(payload?.items ?? []);
    if (!payload?.eventGroups?.length) return fallback;
    const itemById = new Map((payload.items ?? []).map((item) => [item.id, item]));
    return payload.eventGroups.flatMap((group) => {
      const articles = group.relatedReports.flatMap((report) => {
        const item = itemById.get(report.id);
        return item ? [item] : [];
      });
      if (!articles.length) return [];
      return [{
        id: group.id,
        title: group.eventAnchor?.title ?? articles[0].title,
        category: group.categories[0] ?? articles[0].category,
        latestAt: group.newestPublicationTime,
        articles,
        sourceCount: group.distinctSourceCount,
        confidence: group.confidence,
        groupingReason: group.groupingReason,
      }];
    });
  })();
  const categories = ["all", ...new Set(groups.map((group) => group.category))];
  const visibleGroups = filterNewsGroups(groups, query, category);
  const freshSources = payload?.sources?.filter((source) => (source.status === "online" || source.status === "degraded") && !source.stale) ?? [];
  const activeSources = freshSources.length;
  const degraded = Boolean(payload?.sources?.some((source) => source.status === "degraded" || source.status === "unavailable" || source.status === "rate_limited"));

  return (
    <main className="atlas-news-page">
      <header className="atlas-news-header">
        <div>
          <p>GLOBAL EVENT INTELLIGENCE</p>
          <h1>Event News Center</h1>
          <span>Verified reporting grouped around events—not a headline stream.</span>
        </div>
        <div className={`atlas-news-live ${activeSources === 0 ? "offline" : ""}`} role="status">
          <i aria-hidden="true" />
          {activeSources > 0 ? "LIVE UPDATES" : "SOURCES PAUSED"}
        </div>
      </header>

      <section className="news-status-strip" aria-label="News feed status">
        <span><strong>{groups.length}</strong> event groups</span>
        <span><strong>{payload?.items?.length ?? 0}</strong> verified reports</span>
        <span><strong>{activeSources}</strong> active sources</span>
        <span>
          Updated {payload?.fetchedAt ? formatTimestamp(payload.fetchedAt) : "—"}
          {degraded && <em>Partial coverage</em>}
        </span>
      </section>

      <section className="atlas-news-toolbar" aria-label="News filters">
        <label className="news-search">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Search verified event news</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events, sources, or reports"
          />
        </label>
        <div className="atlas-news-filters">
          {categories.map((item) => (
            <button
              type="button"
              className={category === item ? "active" : ""}
              aria-pressed={category === item}
              key={item}
              onClick={() => setCategory(item)}
            >
              {item === "all" ? "All events" : item}
            </button>
          ))}
        </div>
      </section>

      {loading && <LoadingState />}
      {!loading && error && (
        <section className="atlas-news-state error" role="alert">
          <span aria-hidden="true">!</span>
          <h2>Verified news is temporarily unavailable</h2>
          <p>{error}. ATLAS will not substitute unverified or fabricated reporting.</p>
          <button type="button" onClick={() => void loadNews()}>Try again</button>
        </section>
      )}
      {!loading && !error && groups.length === 0 && (
        <section className="atlas-news-state" role="status">
          <span aria-hidden="true">◇</span>
          <h2>No verified event coverage available</h2>
          <p>Configured official feeds are paused or have not published verified reports yet.</p>
        </section>
      )}
      {!loading && !error && groups.length > 0 && visibleGroups.length === 0 && (
        <section className="atlas-news-state" role="status">
          <span aria-hidden="true">⌕</span>
          <h2>No matching event coverage</h2>
          <p>Try another search or category. No filters affect the underlying verified feed.</p>
          <button type="button" onClick={() => { setQuery(""); setCategory("all"); }}>Clear filters</button>
        </section>
      )}
      {!loading && !error && visibleGroups.length > 0 && (
        <section className="news-event-grid" aria-label="Verified event coverage">
          {visibleGroups.map((group) => <EventCard group={group} key={group.id} />)}
        </section>
      )}
    </main>
  );
}
