"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages/en";

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

const groups: ReadonlyArray<{
  title: MessageKey;
  items: ReadonlyArray<readonly [string, string, MessageKey]>;
}> = [
  {
    title: "navigation.monitor",
    items: [
      ["◉", "Global Overview", "navigation.globalOverview"],
      ["⌕", "Intelligence Search", "navigation.intelligenceSearch"],
      ["◈", "Knowledge Graph", "navigation.knowledgeGraph"],
      ["◍", "Watchlists", "navigation.watchlists"],
      ["!", "Alerts", "navigation.alerts"],
      ["↗", "Notifications", "navigation.notifications"],
      ["◎", "World Map", "navigation.worldMap"],
      ["◇", "Global Risk", "navigation.globalRisk"],
      ["◫", "Global Metrics", "navigation.globalMetrics"],
      ["◒", "Source Sentiment", "navigation.sourceSentiment"],
      ["▣", "Global Timeline", "navigation.globalTimeline"],
      ["⌘", "Breaking News", "navigation.breakingNews"],
    ],
  },
  {
    title: "navigation.categories",
    items: [
      ["◉", "Earthquake", "navigation.earthquake"],
      ["▲", "Volcano", "navigation.volcano"],
      ["☁", "Weather & Climate", "navigation.weatherClimate"],
      ["△", "Disasters", "navigation.disasters"],
      ["✕", "Conflict", "navigation.conflict"],
      ["▰", "Economy & Markets", "navigation.economyMarkets"],
      ["✦", "AI & Technology", "navigation.aiTechnology"],
      ["◌", "Cybersecurity", "navigation.cybersecurity"],
      ["✈", "Aviation (Flights)", "navigation.aviation"],
      ["▰", "Marine (Ships)", "navigation.marine"],
      ["◉", "Space & Satellites", "navigation.spaceSatellites"],
      ["ϟ", "Energy", "navigation.energy"],
      ["♥", "Health & Disease", "navigation.healthDisease"],
    ],
  },
  {
    title: "navigation.tools",
    items: [
      ["⌘", "Compare Countries", "navigation.compareCountries"],
      ["⌘", "Data Explorer", "navigation.dataExplorer"],
      ["⌘", "API & Widgets", "navigation.apiWidgets"],
      ["◫", "Source Center", "navigation.sourceCenter"],
    ],
  },
  {
    title: "navigation.more",
    items: [
      ["▣", "Reports", "navigation.reports"],
      ["◈", "Marketplace", "navigation.marketplace"],
      ["ⓘ", "About Atlas", "navigation.about"],
      ["⚙", "Settings", "navigation.settings"],
    ],
  },
];

export function AtlasSidebar({
  activeItem,
  onSelect,
}: AtlasSidebarProps) {
  const { t } = useI18n();
  return (
    <aside className="atlas-v4-sidebar">
      <div className="atlas-v4-brand">
        <div className="atlas-v4-logo">🌐</div>

        <div>
          <strong>ATLAS</strong>
          <span>{t("shell.subtitle")}</span>
          <small>{t("shell.subtitleDetail")}</small>
        </div>
      </div>

      <div className="atlas-v4-menu-scroll">
        {groups.map((group) => (
          <section
            className="atlas-v4-menu-group"
            key={group.title}
          >
            <p>{t(group.title)}</p>

            {group.items.map(([icon, routeLabel, messageKey]) => (
              <button
                type="button"
                key={routeLabel}
                className={
                  activeItem === routeLabel
                    ? "atlas-v4-menu-item active"
                    : "atlas-v4-menu-item"
                }
                onClick={() => onSelect(routeLabel)}
              >
                <span aria-hidden="true">{icon}</span>
                {t(messageKey)}
              </button>
            ))}
          </section>
        ))}

        <article className="atlas-v4-mobile-card">
          <div className="atlas-v4-mobile-icon">⌖</div>

          <div>
            <strong>{t("shell.mobile")}</strong>
            <small>{t("shell.mobileDescription")}</small>
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
