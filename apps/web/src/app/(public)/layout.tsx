import Link from "next/link";

const navigation = [
  { href: "/features", label: "Features" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-shell">
      <header className="public-header">
        <Link className="public-brand" href="/">
          <span className="public-logo">◎</span>

          <span>
            <strong>ATLAS</strong>
            <small>Global Intelligence</small>
          </span>
        </Link>

        <nav className="public-navigation">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="public-actions">
          <Link className="login-link" href="/login">
            Sign in
          </Link>

          <Link className="primary-button" href="/app">
            Open Dashboard
          </Link>
        </div>
      </header>

      {children}
      <footer className="public-data-disclaimer">
        ATLAS aggregates information from third-party public sources. Coverage and update frequency vary by provider. Information is not emergency, financial, medical, or security advice. Verify critical information with the originating authority.
      </footer>
    </div>
  );
}
