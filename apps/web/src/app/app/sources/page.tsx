"use client";

import { useEffect, useState } from "react";
import {
  filterSourceProviders,
  sourceProviderStatistics,
} from "@/lib/source-health/source-center-logic.mjs";
import type {
  SourceOperationsProvider,
  SourceOperationsStatus,
} from "@/lib/source-health/source-operations";

type SourceHealthResponse = {
  generatedAt?: string;
  providers?: SourceOperationsProvider[];
  error?: { code: string; message: string };
};

const STATUS_FILTERS: ReadonlyArray<{
  value: "all" | SourceOperationsStatus;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "paused", label: "Paused" },
  { value: "disabled", label: "Disabled" },
  { value: "configuration_required", label: "Configuration required" },
  { value: "rate_limited", label: "Rate limited" },
  { value: "unavailable", label: "Unavailable" },
];

function formatDate(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Invalid timestamp";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: SourceOperationsStatus) {
  return status.replaceAll("_", " ");
}

function ProviderRow({ provider }: { provider: SourceOperationsProvider }) {
  return (
    <tr>
      <td data-label="Provider">
        <strong>{provider.name}</strong>
        <small>{provider.organization} · {provider.category}</small>
      </td>
      <td data-label="Status">
        <span className={`source-status ${provider.status}`}>
          <i aria-hidden="true" />
          {statusLabel(provider.status)}
        </span>
        {provider.stale && <small className="source-stale">Stale response</small>}
      </td>
      <td data-label="Reports" className="source-number">{provider.reports.toLocaleString()}</td>
      <td data-label="Last Success"><time dateTime={provider.lastSuccess ?? undefined}>{formatDate(provider.lastSuccess)}</time></td>
      <td data-label="Last Checked"><time dateTime={provider.lastChecked ?? undefined}>{formatDate(provider.lastChecked)}</time></td>
      <td data-label="Latency">{provider.latencyMs === null ? "Not reported" : `${provider.latencyMs.toLocaleString()} ms`}</td>
      <td data-label="Coverage">{provider.coverage}</td>
      <td data-label="License">
        {provider.license.url ? (
          <a href={provider.license.url} target="_blank" rel="noreferrer">{provider.license.label} ↗</a>
        ) : provider.license.label}
      </td>
      <td data-label="Attribution">{provider.attribution}</td>
      <td data-label="Documentation">
        <a href={provider.documentationUrl} target="_blank" rel="noreferrer">Open docs ↗</a>
      </td>
      <td data-label="Notes">
        <span className="source-notes">{provider.notes || "No operational notes."}</span>
        {provider.errorCode && <small>Error: {provider.errorCode}</small>}
      </td>
    </tr>
  );
}

export default function SourceCenterPage() {
  const [providers, setProviders] = useState<SourceOperationsProvider[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | SourceOperationsStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/source-health", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as SourceHealthResponse;
        if (!response.ok) throw new Error(body.error?.message ?? "Unable to load provider health");
        setProviders(body.providers ?? []);
        setGeneratedAt(body.generatedAt ?? null);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load provider health");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const statistics = sourceProviderStatistics(providers);
  const visibleProviders = filterSourceProviders(providers, query, status);

  return (
    <main className="source-center-page">
      <header className="source-center-header">
        <div>
          <p>ATLAS OPERATIONS</p>
          <h1>Source Center</h1>
          <span>Provider availability, provenance, licensing, and coverage.</span>
        </div>
        <div className="source-center-updated">
          <span>LAST HEALTH CHECK</span>
          <strong>{generatedAt ? formatDate(generatedAt) : "Pending"}</strong>
        </div>
      </header>

      <section className="source-center-stats" aria-label="Provider statistics">
        <article><span>Online providers</span><strong>{statistics.online}</strong><i className="online" /></article>
        <article><span>Offline providers</span><strong>{statistics.offline}</strong><i className="offline" /></article>
        <article><span>Configuration required</span><strong>{statistics.configurationRequired}</strong><i className="configuration" /></article>
        <article><span>Total reports</span><strong>{statistics.totalReports.toLocaleString()}</strong><i className="reports" /></article>
      </section>

      <section className="source-center-controls" aria-label="Source filters">
        <label className="source-center-search">
          <span aria-hidden="true">⌕</span>
          <span className="source-visually-hidden">Search providers</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search provider, coverage, license, or category"
          />
        </label>
        <div className="source-center-filters">
          {STATUS_FILTERS.map((filter) => (
            <button
              type="button"
              key={filter.value}
              className={status === filter.value ? "active" : ""}
              aria-pressed={status === filter.value}
              onClick={() => setStatus(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {loading && (
        <section className="source-center-state" role="status">
          <span className="source-spinner" aria-hidden="true" />
          <h2>Checking provider operations</h2>
          <p>Loading source health and governance metadata.</p>
        </section>
      )}
      {!loading && error && (
        <section className="source-center-state error" role="alert">
          <strong aria-hidden="true">!</strong>
          <h2>Source health unavailable</h2>
          <p>{error}</p>
        </section>
      )}
      {!loading && !error && providers.length === 0 && (
        <section className="source-center-state" role="status">
          <h2>No providers registered</h2>
          <p>The source-health response did not contain provider records.</p>
        </section>
      )}
      {!loading && !error && providers.length > 0 && visibleProviders.length === 0 && (
        <section className="source-center-state" role="status">
          <h2>No matching providers</h2>
          <p>Change the search or status filter to view registered providers.</p>
          <button type="button" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</button>
        </section>
      )}
      {!loading && !error && visibleProviders.length > 0 && (
        <section className="source-table-shell" aria-label="Provider operations">
          <div className="source-table-summary">
            <span>Showing {visibleProviders.length} of {providers.length} providers</span>
            <span>Operational metadata from ATLAS source registry</span>
          </div>
          <div className="source-table-scroll">
            <table className="source-operations-table">
              <thead>
                <tr>
                  {["Provider", "Status", "Reports", "Last Success", "Last Checked", "Latency", "Coverage", "License", "Attribution", "Documentation", "Notes"].map((label) => (
                    <th key={label} scope="col">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleProviders.map((provider) => <ProviderRow provider={provider} key={provider.id} />)}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

