import Link from "next/link";

const metrics = [
  { label: "Earthquake source", value: "USGS • active" },
  { label: "Cyclone coverage", value: "Atlantic + E/C Pacific" },
  { label: "Weather", value: "Configuration required" },
  { label: "Computed intelligence", value: "Not computed" },
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
      "อยู่ระหว่างการเชื่อมต่อ — MVP นี้ไม่สร้างบทสรุปหรือคะแนน AI ที่ไม่มีแหล่งข้อมูลรองรับ",
  },
  {
    title: "Real-time Alerting",
    description:
      "อยู่ระหว่างการพัฒนา — ยังไม่มีการส่งการแจ้งเตือนใน Public MVP",
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
            ATLAS แสดงข้อมูลแผ่นดินไหวจาก USGS และคำแนะนำพายุจาก NOAA/NHC
            โดยระบุแหล่งที่มาและขอบเขตข้อมูลอย่างชัดเจน
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
            Public MVP • coverage is limited by source
          </div>
        </div>

        <div className="hero-visual" aria-label="ATLAS dashboard preview">
          <div className="visual-toolbar">
            <span>MVP SOURCE MONITOR</span>
            <span className="visual-live">● LIVE</span>
          </div>

          <div className="visual-map">
            <div className="planet-grid" />

            <div className="visual-information">
              <span>VERIFIED SOURCES</span>
              <strong>USGS • NOAA/NHC</strong>
              <small>Additional integrations pending</small>
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
            Public MVP แสดงเฉพาะข้อมูลจริงที่ผ่านการตรวจสอบแหล่งที่มา
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
