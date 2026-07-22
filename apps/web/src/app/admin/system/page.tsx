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
        System
      </h1>

      <p style={{
        color: "var(--muted)",
      }}>
        ตรวจสอบสถานะระบบ
      </p>
    </main>
  );
}
