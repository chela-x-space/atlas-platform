"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MetricsSnapshot } from "@/lib/metrics/metrics-contract";

function metric(snapshot: MetricsSnapshot | null, id: string) {
  return snapshot?.metrics.find((candidate) => candidate.id === id);
}

function display(value: number | null | undefined, suffix = "") {
  return value === null || value === undefined ? "Unavailable" : `${value.toLocaleString()}${suffix}`;
}

export function GlobalMetricsCompact() {
  const [snapshot, setSnapshot] = useState<MetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/metrics", { cache: "no-store" })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok && response.status !== 206) throw new Error(value.error?.message);
        if (!cancelled) setSnapshot(value as MetricsSnapshot);
      })
      .catch(() => {
        if (!cancelled) setError("Verified metrics are temporarily unavailable.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const globalEvents = metric(snapshot, "global-events-24h");
  const activeCyclones = metric(snapshot, "active-cyclones");
  const availability = metric(snapshot, "provider-availability-percentage");
  const earth = snapshot?.activityIndex.components.find((component) => component.id === "earth-activity");

  return (
    <section className="global-metrics-compact" aria-label="Global Metrics">
      <div className="global-metrics-compact-heading">
        <div><span>VERIFIED ACTIVITY · NOT RISK</span><h2>GLOBAL METRICS</h2></div>
        <Link href="/app/metrics">Methodology and details →</Link>
      </div>
      {error ? <p className="global-metrics-compact-error">{error} No placeholder values are shown.</p> : (
        <>
          {snapshot?.partial && <p className="global-metrics-compact-partial">{snapshot.stale ? "Stale verified snapshot" : "Partial provider coverage"} · missing values are not estimated</p>}
          <div className="global-metrics-compact-grid">
            <article><span>Planet Activity Index</span><strong>{display(snapshot?.activityIndex.value, snapshot?.activityIndex.value === null ? "" : " / 100")}</strong><small>{snapshot?.activityIndex.status ?? (loading ? "Loading…" : "Unavailable")}</small></article>
            <article><span>Global events · 24h</span><strong>{display(globalEvents?.value)}</strong><small>{globalEvents?.completeness ?? (loading ? "Loading…" : "Unavailable")}</small></article>
            <article><span>Earth Activity</span><strong>{display(earth?.normalizedValue, earth?.normalizedValue === null ? "" : " / 100")}</strong><small>50% component weight</small></article>
            <article><span>Active cyclones</span><strong>{display(activeCyclones?.value)}</strong><small>NOAA/NHC verified</small></article>
            <article><span>Source availability</span><strong>{display(availability?.value, availability?.value === null ? "" : "%")}</strong><small>weighted active providers</small></article>
            <article><span>Last updated</span><strong className="timestamp">{snapshot ? new Date(snapshot.generatedAt).toLocaleString() : loading ? "Loading…" : "Unavailable"}</strong><small>{snapshot?.stale ? `Served ${new Date(snapshot.servedAt!).toLocaleString()}` : "UTC calculation snapshot"}</small></article>
          </div>
        </>
      )}
    </section>
  );
}
