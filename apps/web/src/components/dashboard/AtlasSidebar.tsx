"use client";

type AtlasSidebarProps = {
  activeItem: string;
  onSelect: (item: string) => void;
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
            <button type="button">App Store</button>
            <button type="button">Google Play</button>
          </div>
        </article>
      </div>

      <footer className="atlas-v4-social">
        <button type="button">𝕏</button>
        <button type="button">f</button>
        <button type="button">▶</button>
        <button type="button">◉</button>
        <button type="button">◎</button>
      </footer>
    </aside>
  );
}
