"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AtlasMap } from "@/components/map/AtlasMap";
import { AtlasSidebar } from "./AtlasSidebar";
import { MetricStrip } from "./MetricStrip";

const timelineEvents = [
  ["10:15", "M 6.4 Earthquake", "Hachijojima, Japan", "red"],
  ["10:22", "Flood Warning", "Guangdong, China", "blue"],
  ["10:30", "Oil Price +2.3%", "Brent Crude", "orange"],
  ["10:35", "OpenAI Announces", "GPT-4o Update", "purple"],
  ["10:42", "Middle East Tensions", "Multiple reports", "red"],
  ["10:48", "NASDAQ +1.02%", "Markets Open", "green"],
  ["10:55", "Volcano Activity", "Popocatépetl, Mexico", "red"],
];

const earthquakeRows = [
  ["M 5.2", "Taiwan Region", "09:58 UTC"],
  ["M 4.8", "Northern Chile", "09:42 UTC"],
  ["M 4.6", "Kermadec Islands", "09:28 UTC"],
  ["M 4.3", "Philippines", "09:12 UTC"],
  ["M 3.9", "Greece", "08:57 UTC"],
];

const marketRows = [
  ["S&P 500", "5,347.89", "+0.83%"],
  ["NASDAQ", "17,168.42", "+1.45%"],
  ["DOW JONES", "38,711.29", "+0.67%"],
  ["NIKKEI 225", "38,470.38", "-0.31%"],
  ["GOLD", "2,315.60", "+0.28%"],
  ["OIL (Brent)", "79.45", "+2.32%"],
];

const aiRows = [
  ["OpenAI", "GPT-4o Update Released", "10:35"],
  ["Google DeepMind", "Gemini 1.5 Pro", "09:50"],
  ["Anthropic", "Claude 3.5 Sonnet", "08:20"],
  ["Meta AI", "Llama 3 Now Available", "Jun 7"],
  ["NVIDIA", "New AI Chip Announced", "Jun 7"],
];

const menuRoutes: Record<string, string> = {
  "Global Overview": "/app",
  "World Map": "/app/monitor",
  "Event Timeline": "/app/timeline",
  "Breaking News": "/app/news",
  Earthquake: "/app/earthquake",
  "Weather & Climate": "/app/weather",
  "Economy & Markets": "/app/markets",
  "AI & Technology": "/app/ai",
  Settings: "/app/settings",
};

export function AtlasDashboard() {
  const router = useRouter();

  const [activeMenu, setActiveMenu] =
    useState("Global Overview");

  const [activeLayer, setActiveLayer] =
    useState("All Layers");

  const [language, setLanguage] =
    useState<"English" | "ไทย">("English");

  const [query, setQuery] = useState("");

  const [marketTab, setMarketTab] =
    useState("Indices");

  const [message, setMessage] = useState("");

  const filteredTimeline = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return timelineEvents;
    }

    return timelineEvents.filter((event) =>
      event.join(" ").toLowerCase().includes(normalized)
    );
  }, [query]);

  function showMessage(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 2200);
  }

  function handleMenu(item: string) {
    setActiveMenu(item);

    const route = menuRoutes[item];

    if (route) {
      router.push(route);
      return;
    }

    showMessage(`${item} selected`);
  }

  return (
    <div className="atlas-v4">
      <AtlasSidebar
        activeItem={activeMenu}
        onSelect={handleMenu}
      />

      <main className="atlas-v4-main">
        <header className="atlas-v4-header">
          <label className="atlas-v4-search">
            <span>⌕</span>

            <input
              type="search"
              value={query}
              placeholder="Search for events, places, topics..."
              onChange={(event) =>
                setQuery(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  showMessage(
                    query
                      ? `Searching for “${query}”`
                      : "Enter a search term"
                  );
                }
              }}
            />

            <kbd>/</kbd>
          </label>

          <div className="atlas-v4-header-actions">
            <button
              type="button"
              onClick={() =>
                setLanguage((current) =>
                  current === "English"
                    ? "ไทย"
                    : "English"
                )
              }
            >
              🌐 {language}⌄
            </button>

            <button
              type="button"
              onClick={() =>
                showMessage("No new system alerts")
              }
            >
              ♧
            </button>

            <button
              className="atlas-v4-notification"
              type="button"
              onClick={() =>
                showMessage("12 monitored notifications")
              }
            >
              ♢
              <span>12</span>
            </button>

            <button
              type="button"
              onClick={() =>
                showMessage("Share link prepared")
              }
            >
              ↗
            </button>

            <button
              className="atlas-v4-login"
              type="button"
              onClick={() => router.push("/login")}
            >
              Login
            </button>
          </div>
        </header>

        <MetricStrip />

        <section className="atlas-v4-primary">
          <div className="atlas-v4-left">
            <article className="atlas-v4-card atlas-v4-map-panel">
              <div className="atlas-v4-map-heading">
                <h2>LIVE GLOBAL MAP</h2>

                <span className="atlas-v4-live">
                  LIVE
                </span>

                <small>
                  ● Real global events detected
                </small>
              </div>

              <div className="atlas-v4-layers">
                {[
                  "All Layers",
                  "Earthquake",
                  "Weather",
                  "Conflict",
                  "Flights",
                  "Ships",
                  "More Layers",
                ].map((layer) => (
                  <button
                    type="button"
                    key={layer}
                    className={
                      activeLayer === layer
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setActiveLayer(layer);
                      showMessage(`${layer} enabled`);
                    }}
                  >
                    {layer}
                  </button>
                ))}
              </div>

              <div className="atlas-v4-map-body">
                <AtlasMap
                  activeLayer={activeLayer}
                />
              </div>
            </article>

            <article className="atlas-v4-card atlas-v4-timeline">
              <div className="atlas-v4-section-title">
                <h2>GLOBAL TIMELINE</h2>
                <span>Live events</span>
              </div>

              <div className="atlas-v4-timeline-row">
                {filteredTimeline.map(
                  ([time, title, place, tone]) => (
                    <button
                      type="button"
                      key={`${time}-${title}`}
                      className={`atlas-v4-event ${tone}`}
                      onClick={() =>
                        showMessage(`${title} — ${place}`)
                      }
                    >
                      <span>{time}</span>
                      <strong>{title}</strong>
                      <small>{place}</small>
                    </button>
                  )
                )}
              </div>
            </article>
          </div>

          <aside className="atlas-v4-right">
            <article className="atlas-v4-card atlas-v4-summary">
              <div className="atlas-v4-section-title">
                <h2>〽 AI GLOBAL SUMMARY</h2>
                <span>Updated 2 min ago</span>
              </div>

              <h3>
                วันนี้ความเสี่ยงของโลกเพิ่มขึ้น 8%
              </h3>

              <p>
                เนื่องจากแผ่นดินไหวรุนแรงในแปซิฟิก
                และความตึงเครียดทางภูมิรัฐศาสตร์
                ขณะที่ภาคเทคโนโลยียังมีแนวโน้มเชิงบวก
              </p>

              <div className="atlas-v4-summary-list">
                <div>
                  <span>◉ Risk Level</span>
                  <b className="red">High</b>
                </div>

                <div>
                  <span>◉ Economic Impact</span>
                  <b className="orange">Moderate</b>
                </div>

                <div>
                  <span>◉ AI & Tech Outlook</span>
                  <b className="green">Positive</b>
                </div>

                <div>
                  <span>◉ Climate Outlook</span>
                  <b className="purple">Unstable</b>
                </div>
              </div>

              <div className="atlas-v4-ai-orb">
                AI
              </div>

              <button
                className="atlas-v4-panel-button"
                type="button"
                onClick={() =>
                  showMessage(
                    "AI intelligence report opened"
                  )
                }
              >
                View Full Report →
              </button>
            </article>

            <article className="atlas-v4-card atlas-v4-earthquake">
              <div className="atlas-v4-section-title">
                <h2 className="red">
                  LIVE EARTHQUAKE
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/app/earthquake")
                  }
                >
                  View All →
                </button>
              </div>

              <div className="atlas-v4-quake-primary">
                <div>
                  <strong>M 6.4</strong>
                  <small>Strong Earthquake</small>

                  <h3>
                    Near Hachijojima, Japan
                  </h3>

                  <p>
                    Jun 8, 2024 10:15 UTC
                    <br />
                    Depth: 42 km
                    <br />
                    Tsunami Risk:
                    <b className="green"> Low</b>
                  </p>
                </div>

                <div className="atlas-v4-radar">
                  <i />
                  <i />
                  <i />
                  <b />
                </div>
              </div>

              <div className="atlas-v4-quake-list">
                {earthquakeRows.map(
                  ([magnitude, place, time]) => (
                    <button
                      type="button"
                      key={place}
                      onClick={() =>
                        showMessage(
                          `${magnitude} — ${place}`
                        )
                      }
                    >
                      <strong>{magnitude}</strong>
                      <span>{place}</span>
                      <small>{time}</small>
                    </button>
                  )
                )}
              </div>
            </article>
          </aside>
        </section>

        <section className="atlas-v4-bottom">
          <article className="atlas-v4-card atlas-v4-sentiment">
            <div className="atlas-v4-section-title">
              <h2>GLOBAL SENTIMENT INDEX</h2>
            </div>

            <p>Based on news, social, market and events</p>

            <div className="atlas-v4-gauge">
              <div />
              <strong>-0.23</strong>
              <span>Neutral</span>
            </div>
          </article>

          <article className="atlas-v4-card atlas-v4-chart">
            <div className="atlas-v4-section-title">
              <h2>SENTIMENT TREND</h2>
              <span>7 Days</span>
            </div>

            <svg viewBox="0 0 300 130">
              <path
                className="zero"
                d="M0 65H300"
              />

              <path
                className="positive-line"
                d="M0 70L20 40L40 55L60 22L80 60L100 78L120 88L140 76L160 65L180 47L200 35L220 72L240 112L260 72L280 51L300 65"
              />

              <path
                className="negative-line"
                d="M90 68L115 91L140 99L165 84L190 72"
              />
            </svg>
          </article>

          <article className="atlas-v4-card atlas-v4-market">
            <div className="atlas-v4-section-title">
              <h2>MARKET OVERVIEW</h2>
            </div>

            <div className="atlas-v4-tabs">
              {[
                "Indices",
                "Commodities",
                "Crypto",
                "Currencies",
              ].map((tab) => (
                <button
                  type="button"
                  key={tab}
                  className={
                    marketTab === tab
                      ? "active"
                      : ""
                  }
                  onClick={() => setMarketTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="atlas-v4-market-table">
              {marketRows.map(
                ([name, value, change]) => (
                  <div key={name}>
                    <strong>{name}</strong>
                    <span>{value}</span>
                    <small
                      className={
                        change.startsWith("-")
                          ? "red"
                          : "green"
                      }
                    >
                      {change}
                    </small>
                  </div>
                )
              )}
            </div>
          </article>

          <article className="atlas-v4-card atlas-v4-ai-news">
            <div className="atlas-v4-section-title">
              <h2>AI & TECHNOLOGY RADAR</h2>
            </div>

            <p>Top AI News</p>

            {aiRows.map(
              ([company, story, time], index) => (
                <button
                  type="button"
                  key={company}
                  onClick={() =>
                    showMessage(`${company}: ${story}`)
                  }
                >
                  <b className={`tone-${index}`}>
                    ◉
                  </b>

                  <span>
                    <strong>{company}</strong>
                    <small>{story}</small>
                  </span>

                  <time>{time}</time>
                </button>
              )
            )}
          </article>

          <article className="atlas-v4-card atlas-v4-disaster">
            <div className="atlas-v4-section-title">
              <h2>DISASTER OVERVIEW</h2>
            </div>

            <p>Active Around the World</p>

            <div className="atlas-v4-disaster-counts">
              <div>
                <b className="green">3</b>
                <span>Cyclones</span>
              </div>

              <div>
                <b className="red">56</b>
                <span>Wildfires</span>
              </div>

              <div>
                <b className="blue">9</b>
                <span>Floods</span>
              </div>

              <div>
                <b className="green">7</b>
                <span>Volcanoes</span>
              </div>
            </div>

            <div className="atlas-v4-mini-map">
              <i className="one" />
              <i className="two" />
              <i className="three" />
              <i className="four" />
              <i className="five" />
            </div>
          </article>
        </section>

        <footer className="atlas-v4-breaking">
          <strong>BREAKING NEWS</strong>

          <span>UN Urges Ceasefire in Gaza</span>
          <span>NASA Launches New Earth Satellite</span>
          <span>Hurricane Season Forecast Released</span>
          <span>EU Passes AI Regulation Act</span>
          <span>Bitcoin Reaches New High</span>
        </footer>
      </main>

      {message ? (
        <div className="atlas-v4-toast">
          ✓ {message}
        </div>
      ) : null}
    </div>
  );
}
