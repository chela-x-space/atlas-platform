"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SentimentSnapshot } from "@/lib/sentiment/sentiment-contract";

export function DashboardSentiment({ mobile = false }: { mobile?: boolean }) {
  const [snapshot, setSnapshot] = useState<SentimentSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sentiment?window=24h&limit=5", { cache: "no-store" })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok && response.status !== 206) throw new Error();
        if (!cancelled) setSnapshot(value as SentimentSnapshot);
      })
      .catch(() => {
        if (!cancelled) setSnapshot(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const indexValue = snapshot?.index.value ?? null;
  const unavailable = !loading && indexValue === null;
  const content = <>
    <div className="atlas-v4-section-title"><h2>GLOBAL SENTIMENT INDEX</h2><Link href="/app/sentiment">Details →</Link></div>
    {loading ? <p>Loading verified source text…</p> : unavailable || !snapshot ? (
      <div className="atlas-sentiment-unavailable"><strong>No eligible verified text available</strong><span>No neutral fallback is generated.</span></div>
    ) : (
      <>
        {snapshot.partial && <p className="atlas-sentiment-partial">{snapshot.stale ? "Stale snapshot · not live" : "Partial verified text coverage"}</p>}
        <div className="atlas-sentiment-value"><strong>{indexValue!.toFixed(1)}</strong><span>{snapshot.index.status.replaceAll("_", " ")}</span></div>
        <dl className="atlas-sentiment-meta">
          <div><dt>Coverage</dt><dd>{snapshot.index.coverage.percentage === null ? "Unavailable" : `${snapshot.index.coverage.percentage}%`}</dd></div>
          <div><dt>Completeness</dt><dd>{snapshot.index.completeness}</dd></div>
          <div><dt>Updated</dt><dd>{new Date(snapshot.generatedAt).toLocaleTimeString()}</dd></div>
        </dl>
      </>
    )}
  </>;
  return mobile
    ? <section className="atlas-mobile-section atlas-mobile-sentiment">{content}</section>
    : <article className="atlas-v4-card atlas-v4-sentiment">{content}</article>;
}
