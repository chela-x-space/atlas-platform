"use client";

type AtlasSidebarProps = {
  activeItem: string;
  onSelect: (item: string) => void;
};

const externalLinks: Record<string, string | undefined> = {
  "App Store": process.env.NEXT_PUBLIC_APP_STORE_URL,
  "Google Play": process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL,
  "X / Twitter": process.env.NEXT_PUBLIC_X_URL,
  Facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL,
  YouTube: process.env.NEXT_PUBLIC_YOUTUBE_URL,
  Instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  Threads: process.env.NEXT_PUBLIC_THREADS_URL,
};

const groups = [
  {
    title: "MONITOR",
    items: [
      ["◉", "Global Overview"],
      ["◎", "World Map"],
      ["▣", "Event Timeline"],
      ["⌘", "Breaking News"],
    ],
  },
  {
    title: "CATEGORIES",
    items: [
      ["◉", "Earthquake"],
      ["▲", "Volcano"],
      ["☁", "Weather & Climate"],
      ["△", "Disasters"],
      ["✕", "Conflict"],
      ["▰", "Economy & Markets"],
      ["✦", "AI & Technology"],
      ["◌", "Cybersecurity"],
      ["✈", "Aviation (Flights)"],
      ["▰", "Marine (Ships)"],
      ["◉", "Space & Satellites"],
      ["ϟ", "Energy"],
      ["♥", "Health & Disease"],
    ],
  },
  {
    title: "TOOLS",
    items: [
      ["⌘", "Compare Countries"],
      ["⌘", "Data Explorer"],
      ["⌘", "API & Widgets"],
    ],
  },
  {
    title: "MORE",
    items: [
      ["▣", "Reports"],
      ["ⓘ", "About Atlas"],
      ["⚙", "Settings"],
    ],
  },
];

export function AtlasSidebar({
  activeItem,
  onSelect,
}: AtlasSidebarProps) {
  return (
    <aside className="atlas-v4-sidebar">
      <div className="atlas-v4-brand">
        <div className="atlas-v4-logo">🌐</div>

        <div>
          <strong>ATLAS</strong>
          <span>LIVING DASHBOARD</span>
          <small>OF PLANET EARTH</small>
        </div>
      </div>

      <div className="atlas-v4-menu-scroll">
        {groups.map((group) => (
          <section
            className="atlas-v4-menu-group"
            key={group.title}
          >
            <p>{group.title}</p>

            {group.items.map(([icon, label]) => (
              <button
                type="button"
                key={label}
                className={
                  activeItem === label
                    ? "atlas-v4-menu-item active"
                    : "atlas-v4-menu-item"
                }
                onClick={() => onSelect(label)}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </section>
        ))}

        <article className="atlas-v4-mobile-card">
          <div className="atlas-v4-mobile-icon">⌖</div>

          <div>
            <strong>ATLAS MOBILE</strong>
            <small>Stay informed anywhere</small>
          </div>

          <div className="atlas-v4-store-row">
            {["App Store", "Google Play"].map((label) => externalLinks[label] ? (
              <a key={label} href={externalLinks[label]} target="_blank" rel="noreferrer">{label}</a>
            ) : (
              <button key={label} type="button" disabled title={`${label} link is not configured`} aria-label={`${label} unavailable: link is not configured`}>{label}</button>
            ))}
          </div>
        </article>
      </div>

      <footer className="atlas-v4-social">
        {[["𝕏", "X / Twitter"], ["f", "Facebook"], ["▶", "YouTube"], ["◉", "Instagram"], ["◎", "Threads"]].map(([icon, label]) => externalLinks[label] ? (
          <a key={label} href={externalLinks[label]} target="_blank" rel="noreferrer" aria-label={label}>{icon}</a>
        ) : (
          <button key={label} type="button" disabled title={`${label} link is not configured`} aria-label={`${label} unavailable: link is not configured`}>{icon}</button>
        ))}
      </footer>
    </aside>
  );
}
