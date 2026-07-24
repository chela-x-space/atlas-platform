import Link from "next/link";
import type { SentimentRecordResult } from "@/lib/sentiment/sentiment-contract";
import { getSentiment } from "@/lib/sentiment/sentiment-service";

export const dynamic = "force-dynamic";

function display(value: number | null) {
  return value === null ? "Unavailable" : value.toFixed(1);
}

function RecordCard({ record }: { record: SentimentRecordResult }) {
  const href = record.provenance.sourceUrl;
  return <article className="sentiment-record">
    <div><span>{record.sourceId}</span><time dateTime={record.publishedAt}>{new Date(record.publishedAt).toLocaleString()}</time></div>
    <h3>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{record.title} ↗</a> : record.title}</h3>
    <div className="sentiment-record-score"><strong>{record.normalizedScore === null ? "Unscored" : (record.normalizedScore * 100).toFixed(1)}</strong><span>{record.label.replaceAll("_", " ")}</span></div>
    <dl><div><dt>Positive matches</dt><dd>{record.matchedPositiveTerms.length}</dd></div><div><dt>Negative matches</dt><dd>{record.matchedNegativeTerms.length}</dd></div><div><dt>Fields</dt><dd>{record.analyzedFields.join(", ") || "None"}</dd></div><div><dt>Attribution</dt><dd>{record.provenance.attribution}</dd></div></dl>
  </article>;
}

export default async function SentimentPage() {
  const snapshot = await getSentiment({ window: "24h", source: null, limit: 20 });
  const { index } = snapshot;
  const distribution = index.distribution;
  return <main className="sentiment-page">
    <nav className="event-detail-back" aria-label="Back navigation"><Link href="/app">← Global Overview</Link><Link href="/app/metrics">Global Metrics</Link></nav>
    <header className="sentiment-header"><p>ATLAS GLOBAL SENTIMENT INDEX V1</p><h1>Verified source-language tone.</h1><span>This index measures the tone of eligible verified source text. It does not measure public opinion, human emotion, or predicted impact.</span><div><time dateTime={snapshot.generatedAt}>Calculated {new Date(snapshot.generatedAt).toLocaleString()}</time><span>{index.window} · UTC</span><span>{index.completeness}</span>{snapshot.stale && <strong>Stale snapshot · not live</strong>}</div></header>
    {snapshot.partial && <aside className="sentiment-partial" role="status"><strong>{snapshot.stale ? "Stale verified snapshot" : "Partial text coverage"}</strong><span>Available eligible source text is measured; missing providers and unsupported languages are not estimated.</span></aside>}
    <section className="sentiment-index">
      <div><span>GLOBAL SENTIMENT INDEX</span><h2>{display(index.value)}<small> / ±100</small></h2><strong>{index.status.replaceAll("_", " ")}</strong></div>
      <dl><div><dt>Coverage</dt><dd>{index.coverage.percentage === null ? "Unavailable" : `${index.coverage.percentage}%`}</dd></div><div><dt>Completeness</dt><dd>{index.completeness}</dd></div><div><dt>Formula</dt><dd>{index.formulaId} · {index.formulaVersion}</dd></div><div><dt>Lexicon</dt><dd>{index.lexiconId} · {index.lexiconVersion}</dd></div></dl>
      <p>{index.explanation}</p>
    </section>
    <section className="sentiment-section"><div className="sentiment-section-heading"><span>ACTUAL RECORD COUNTS</span><h2>Sentiment distribution</h2></div><div className="sentiment-distribution">{["strongly_negative","negative","neutral","positive","strongly_positive","unavailable"].map((label) => <article key={label}><span>{label === "unavailable" ? "Unscored" : label.replaceAll("_", " ")}</span><strong>{distribution[label as keyof typeof distribution]}</strong></article>)}</div></section>
    <section className="sentiment-section"><div className="sentiment-section-heading"><span>NO PROVIDER REPUTATION WEIGHT</span><h2>Source breakdown</h2></div><div className="sentiment-sources">{snapshot.sourceBreakdown.map((source) => <article key={source.sourceId}><div><strong>{source.sourceId}</strong><span>{source.completeness}</span></div><b>{source.averageScore === null ? "Unavailable" : source.averageScore.toFixed(1)}</b><dl><div><dt>Eligible</dt><dd>{source.recordCount}</dd></div><div><dt>Scored</dt><dd>{source.scoredRecordCount}</dd></div><div><dt>Contribution</dt><dd>{source.weightedContribution ?? "Unavailable"}</dd></div><div><dt>Unsupported</dt><dd>{source.unsupportedLanguageCount}</dd></div></dl></article>)}</div></section>
    <section className="sentiment-section"><div className="sentiment-section-heading"><span>ATTRIBUTION PRESERVED</span><h2>Recent analyzed records</h2></div>{snapshot.recentRecords.length ? <div className="sentiment-records">{snapshot.recentRecords.map((record) => <RecordCard key={`${record.sourceId}:${record.recordId}`} record={record} />)}</div> : <div className="sentiment-empty"><strong>No eligible verified text available</strong><span>No score or neutral fallback is generated.</span></div>}</section>
    <section className="sentiment-methodology"><div><span>DETERMINISTIC METHODOLOGY</span><h2>How the text signal is calculated</h2><p>English source text is Unicode-normalized, stripped of markup, tokenized without stemming, and matched only against the reviewed internal lexicon. No LLM, translation, fuzzy matching, or remote sentiment API is used.</p></div><dl><div><dt>Term weights</dt><dd>Normal ±1; strong ±2; immediately preceding intensifier ×1.5.</dd></div><div><dt>Negation</dt><dd>An odd number of exact negations in the previous three tokens reverses sign.</dd></div><div><dt>Record score</dt><dd>Clamp(raw ÷ 5, −1, +1).</dd></div><div><dt>Recency</dt><dd>24h quartiles: 1.00, 0.85, 0.70, 0.55.</dd></div><div><dt>Coverage</dt><dd>Scored unique records ÷ eligible unique records; complete requires 80% and all providers.</dd></div><div><dt>Limitations</dt><dd>English-only literal textual polarity, not opinion, emotion, impact, or risk.</dd></div></dl><p className="sentiment-methodology-reference">Architecture reference: docs/ATLAS-GLOBAL-SENTIMENT.md</p></section>
  </main>;
}
