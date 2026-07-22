import Link from "next/link";

const metrics = [
  {
    label: "Global events monitored",
    value: "12,542",
  },
  {
    label: "Countries covered",
    value: "147",
  },
  {
    label: "Live intelligence sources",
    value: "480+",
  },
  {
    label: "System availability",
    value: "99.99%",
  },
];

const features = [
  {
    title: "Global Event Monitor",
    description:
      "ติดตามเหตุการณ์สำคัญทั่วโลกผ่านแผนที่เดียว พร้อมเลเยอร์ข้อมูลที่เปิดและปิดได้",
  },
  {
    title: "AI Situation Summary",
    description:
      "AI วิเคราะห์ว่าเกิดอะไรขึ้น เหตุใดจึงสำคัญ และมีผลกระทบต่อพื้นที่หรืออุตสาหกรรมใด",
  },
  {
    title: "Real-time Alerting",
    description:
      "สร้างการแจ้งเตือนตามประเทศ ประเภทเหตุการณ์ ความรุนแรง และเงื่อนไขที่คุณกำหนด",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="hero-section">
        <div className="hero-background" />

        <div className="hero-content">
          <p className="hero-eyebrow">
            THE LIVING DASHBOARD OF PLANET EARTH
          </p>

          <h1>
            Understand the world
            <br />
            before it changes.
          </h1>

          <p className="hero-description">
            ATLAS รวมข่าว ภัยพิบัติ สภาพอากาศ เทคโนโลยี ตลาด
            และสัญญาณความเสี่ยงจากทั่วโลก
            มาแสดงและวิเคราะห์อยู่ในแพลตฟอร์มเดียว
          </p>

          <div className="hero-actions">
            <Link className="primary-button large" href="/app">
              Explore Live Dashboard
            </Link>

            <Link className="secondary-button large" href="/features">
              See All Features
            </Link>
          </div>

          <div className="hero-status">
            <span className="live-indicator" />
            All intelligence systems operational
          </div>
        </div>

        <div className="hero-visual" aria-label="ATLAS dashboard preview">
          <div className="visual-toolbar">
            <span>LIVE GLOBAL MONITOR</span>
            <span className="visual-live">● LIVE</span>
          </div>

          <div className="visual-map">
            <div className="planet-grid" />

            <div className="visual-marker marker-one" />
            <div className="visual-marker marker-two" />
            <div className="visual-marker marker-three" />

            <div className="visual-information">
              <span>ACTIVE EVENT</span>
              <strong>M 6.4 — Japan</strong>
              <small>AI risk assessment in progress</small>
            </div>
          </div>
        </div>
      </section>

      <section className="metric-section">
        {metrics.map((metric) => (
          <article className="home-metric" key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </article>
        ))}
      </section>

      <section className="home-section">
        <div className="section-introduction">
          <p>ONE GLOBAL INTELLIGENCE LAYER</p>

          <h2>
            ข้อมูลทั่วโลก
            <br />
            ที่เข้าใจได้ทันที
          </h2>

          <span>
            จากเหตุการณ์ดิบ สู่บริบท ความเสี่ยง และการตัดสินใจ
          </span>
        </div>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <article className="feature-card" key={feature.title}>
              <span className="feature-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
