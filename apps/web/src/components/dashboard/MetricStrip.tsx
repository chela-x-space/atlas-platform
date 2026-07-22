const metrics = [
  {
    label: "PLANET PULSE",
    value: "82.4",
    detail: "▲ +1.3",
    tone: "green",
  },
  {
    label: "PLANET HEALTH",
    value: "♡ 97%",
    detail: "Stable",
    tone: "green",
  },
  {
    label: "EARTH MOOD",
    value: "🙂 Positive",
    detail: "Improving",
    tone: "green",
  },
  {
    label: "GLOBAL RISK",
    value: "◔ 68/100",
    detail: "High",
    tone: "red",
  },
  {
    label: "EARTHQUAKES 24H",
    value: "28",
    detail: "▲ 12%",
    tone: "green",
  },
  {
    label: "CYCLONES",
    value: "3",
    detail: "Active",
    tone: "blue",
  },
  {
    label: "WILDFIRES",
    value: "🔥 56",
    detail: "▲ 8%",
    tone: "green",
  },
  {
    label: "CONFLICT ZONES",
    value: "17",
    detail: "High",
    tone: "red",
  },
  {
    label: "MARKET STATUS",
    value: "Cautious",
    detail: "Monitoring",
    tone: "orange",
  },
];

export function MetricStrip() {
  return (
    <section className="atlas-v4-metrics">
      {metrics.map((metric) => (
        <article
          className="atlas-v4-metric"
          key={metric.label}
        >
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <small className={metric.tone}>
            {metric.detail}
          </small>
        </article>
      ))}
    </section>
  );
}
