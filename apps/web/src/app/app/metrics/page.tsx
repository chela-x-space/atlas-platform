import Link from "next/link";
import type { ActivityComponent, GlobalMetric } from "@/lib/metrics/metrics-contract";
import { getMetrics } from "@/lib/metrics/metrics-service";

export const dynamic = "force-dynamic";

function value(metric: GlobalMetric | undefined) {
  if (!metric || metric.value === null) return "Unavailable";
  if (metric.unit === "percent") return `${metric.value.toLocaleString()}%`;
  if (metric.unit === "magnitude") return `M ${metric.value.toFixed(1)}`;
  return metric.value.toLocaleString();
}

function MetricCard({ metric }: { metric: GlobalMetric | undefined }) {
  return <article className="metrics-value-card"><span>{metric?.label ?? "Metric unavailable"}</span><strong>{value(metric)}</strong><small>{metric?.completeness ?? "unavailable"} · {metric?.formulaId ?? "No formula result"}</small></article>;
}

function ComponentCard({ component }: { component: ActivityComponent }) {
  return <article className="metrics-component-card"><div><span>{component.label}</span><b>{component.completeness}</b></div><strong>{component.normalizedValue === null ? "Unavailable" : `${component.normalizedValue.toLocaleString()} / 100`}</strong><dl><div><dt>Raw value</dt><dd>{component.rawValue ?? "Unavailable"}</dd></div><div><dt>Weight</dt><dd>{component.weight * 100}%</dd></div><div><dt>Contribution</dt><dd>{component.contribution ?? "Unavailable"}</dd></div></dl><small>{component.sourceIds.join(" · ")}</small></article>;
}

export default async function MetricsPage() {
  const snapshot = await getMetrics();
  const byId = new Map(snapshot.metrics.map((metric) => [metric.id, metric]));
  return <main className="metrics-page">
    <nav className="event-detail-back" aria-label="Back navigation"><Link href="/app">← Global Overview</Link><Link href="/app/sources">Source Center</Link></nav>
    <header className="metrics-header"><p>ATLAS GLOBAL METRICS ENGINE V1</p><h1>Measured global activity from verified records.</h1><span>This index measures verified event activity, not predicted impact or risk.</span><div><time dateTime={snapshot.generatedAt}>Calculated {new Date(snapshot.generatedAt).toLocaleString()}</time><span>{snapshot.metricsVersion}</span><span>{snapshot.activityIndex.completeness}</span>{snapshot.stale && <strong>Stale snapshot · not live</strong>}</div></header>
    {snapshot.partial && <aside className="metrics-partial" role="status"><strong>{snapshot.stale ? "Stale verified snapshot" : "Partial provider coverage"}</strong><span>Available verified values are preserved; missing activity is not estimated.</span></aside>}
    <section className="metrics-index" aria-labelledby="activity-index-heading"><div><span>PLANET ACTIVITY INDEX</span><h2 id="activity-index-heading">{snapshot.activityIndex.value === null ? "Unavailable" : snapshot.activityIndex.value.toFixed(1)}<small> / {snapshot.activityIndex.maximum}</small></h2><strong>{snapshot.activityIndex.status}</strong></div><dl><div><dt>Completeness</dt><dd>{snapshot.activityIndex.completeness}</dd></div><div><dt>Formula</dt><dd>{snapshot.activityIndex.formulaId}</dd></div><div><dt>Version</dt><dd>{snapshot.activityIndex.formulaVersion}</dd></div><div><dt>Window</dt><dd>Inclusive previous 24 hours · UTC</dd></div></dl><p>{snapshot.activityIndex.explanation}</p></section>
    <section className="metrics-section"><div className="metrics-section-heading"><span>FIXED WEIGHTS</span><h2>Activity components</h2></div><div className="metrics-components">{snapshot.activityIndex.components.map((component) => <ComponentCard key={component.id} component={component} />)}</div></section>
    <section className="metrics-section"><div className="metrics-section-heading"><span>INCLUSIVE 24H UTC WINDOW</span><h2>Live verified counts</h2></div><div className="metrics-values">{["global-events-24h","earthquakes-24h","earthquakes-magnitude-4-plus-24h","earthquakes-magnitude-5-plus-24h","earthquakes-magnitude-6-plus-24h","strongest-earthquake-magnitude-24h","active-cyclones","cyclone-advisories-updated-24h","nasa-reports-24h","esa-reports-24h"].map((id) => <MetricCard key={id} metric={byId.get(id)} />)}</div></section>
    <div className="metrics-split">
      <section className="metrics-section"><div className="metrics-section-heading"><span>WEIGHTED STATUS</span><h2>Source availability</h2></div><div className="metrics-availability"><strong>{value(byId.get("provider-availability-percentage"))}</strong><dl><div><dt>Operational</dt><dd>{value(byId.get("providers-operational"))}</dd></div><div><dt>Degraded</dt><dd>{value(byId.get("providers-degraded"))}</dd></div><div><dt>Unavailable</dt><dd>{value(byId.get("providers-unavailable"))}</dd></div><div><dt>Configuration required</dt><dd>{value(byId.get("providers-configuration-required"))}</dd></div></dl></div></section>
      <section className="metrics-section"><div className="metrics-section-heading"><span>EVENT GRAPH V1</span><h2>Graph coverage</h2></div><div className="metrics-values compact">{["graph-total-nodes","graph-total-edges","graph-events-represented","graph-locations-represented","graph-sources-represented"].map((id) => <MetricCard key={id} metric={byId.get(id)} />)}</div></section>
    </div>
    <section className="metrics-methodology"><div><span>TRANSPARENT BY DESIGN</span><h2>Methodology</h2><p>All windows share one captured calculation timestamp. Boundaries are inclusive and evaluated in UTC. Counts use unique verified timeline IDs; graph coverage comes directly from Event Graph v1.</p></div><dl><div><dt>Earth formula</dt><dd>Magnitude bands contribute 0.25, 1, 3, 8, or 20 points.</dd></div><div><dt>Cyclone formula</dt><dd>20 points per active cyclone plus 2 per additional official 24h update.</dd></div><div><dt>Space formula</dt><dd>5 points per verified NASA or ESA report in 24 hours.</dd></div><div><dt>Known limitation</dt><dd>Coverage follows official responding providers and does not estimate missing records.</dd></div></dl><p className="metrics-methodology-reference">Architecture reference: docs/ATLAS-GLOBAL-METRICS.md</p></section>
  </main>;
}
