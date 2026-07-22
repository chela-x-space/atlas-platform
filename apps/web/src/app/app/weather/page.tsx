export default function Page() {
  return (
    <main style={{
      minHeight: "100vh",
      padding: "48px",
      background: "var(--background)",
    }}>
      <p style={{
        margin: 0,
        color: "var(--accent)",
        letterSpacing: "0.14em",
      }}>
        ATLAS PLATFORM
      </p>

      <h1 style={{
        margin: "12px 0",
        fontSize: "48px",
      }}>
        Weather
      </h1>

      <p style={{
        color: "var(--muted)",
      }}>
        Integration pending. Open-Meteo is disabled unless this deployment has a commercial API key or explicitly qualifies for non-commercial use. No weather values are shown.
      </p>
    </main>
  );
}
