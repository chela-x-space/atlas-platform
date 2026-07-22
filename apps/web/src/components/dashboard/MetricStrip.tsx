type Props = { earthquakeCount: number | null; cycloneCount: number | null; loading: boolean };
export function MetricStrip({ earthquakeCount, cycloneCount, loading }: Props) {
  const metrics = [
    ["PLANET PULSE", "Not computed", "No deterministic formula", "orange"], ["PLANET HEALTH", "Not computed", "No deterministic formula", "orange"], ["EARTH MOOD", "Not computed", "No deterministic formula", "orange"], ["GLOBAL RISK", "Not computed", "No deterministic formula", "orange"],
    ["EARTHQUAKES 24H", loading ? "…" : earthquakeCount === null ? "Unavailable" : earthquakeCount.toLocaleString(), "USGS • 24h", earthquakeCount === null ? "red" : "green"],
    ["CYCLONES", loading ? "…" : cycloneCount === null ? "Unavailable" : cycloneCount.toLocaleString(), "NOAA/NHC active advisories", cycloneCount === null ? "red" : "blue"],
    ["WILDFIRES", "Integration pending", "No live source", "orange"], ["CONFLICT ZONES", "Integration pending", "No live source", "orange"], ["MARKET STATUS", "Integration pending", "No live source", "orange"],
  ];
  return <section className="atlas-v4-metrics">{metrics.map(([label, value, detail, tone]) => <article className="atlas-v4-metric" key={label}><span>{label}</span><strong>{value}</strong><small className={tone}>{detail}</small></article>)}</section>;
}
