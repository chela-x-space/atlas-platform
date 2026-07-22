import Link from "next/link";

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "min(440px, 100%)",
          padding: "32px",
          border: "1px solid var(--border)",
          borderRadius: "18px",
          background: "var(--surface)",
        }}
      >
        <p style={{ color: "var(--accent)", letterSpacing: "0.14em" }}>
          ATLAS ACCESS
        </p>

        <h1 style={{ marginBottom: "8px" }}>Sign in</h1>

        <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
          เข้าสู่ระบบ Global Intelligence Platform
        </p>

        <label style={{ display: "block", marginBottom: "14px" }}>
          <span style={{ display: "block", marginBottom: "7px" }}>
            Email
          </span>

          <input
            type="email"
            placeholder="name@example.com"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              background: "var(--background-soft)",
              color: "var(--text)",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "20px" }}>
          <span style={{ display: "block", marginBottom: "7px" }}>
            Password
          </span>

          <input
            type="password"
            placeholder="••••••••"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              background: "var(--background-soft)",
              color: "var(--text)",
            }}
          />
        </label>

        <Link
          href="/app"
          style={{
            display: "flex",
            minHeight: "46px",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "10px",
            background: "var(--accent)",
            color: "#03111c",
            fontWeight: 700,
          }}
        >
          Open Dashboard
        </Link>
      </section>
    </main>
  );
}
