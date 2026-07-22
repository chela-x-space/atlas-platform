"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AtlasMap } from "@/components/map/AtlasMap";
import { AtlasSidebar } from "./AtlasSidebar";
import { MetricStrip } from "./MetricStrip";
import { DashboardModal } from "./DashboardModal";
import { filterEvents, marketRowsForTab, routeForMenu } from "@/lib/dashboard-logic.mjs";

type DashboardRow = [string, string, string, string, string, string, string];
type QuakeFeature = { id: string; geometry: { coordinates: [number, number, number] }; properties: { mag: number | null; place: string; time: number; tsunami: number; url: string; sourceName: string } };
type NewsItem = { id: string; title: string; summary: string; publishedAt: string; sourceName: string; sourceUrl: string; category: string };
type CycloneEvent = { id: string; title: string; summary: string; occurredAt: string; sourceName: string; sourceUrl: string };

const labels = {
  English: { search: "Search for events, places, topics...", login: "Login", liveMap: "LIVE GLOBAL MAP", timeline: "GLOBAL TIMELINE" },
  ไทย: { search: "ค้นหาเหตุการณ์ สถานที่ หัวข้อ...", login: "เข้าสู่ระบบ", liveMap: "แผนที่โลกสด", timeline: "ไทม์ไลน์ทั่วโลก" },
};

export function AtlasDashboard() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

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
  const [panel, setPanel] = useState<{ title: string; description: string } | null>(null);
  const [quakes, setQuakes] = useState<QuakeFeature[]>([]); const [earthquakesAvailable, setEarthquakesAvailable] = useState(false); const [cycloneCount, setCycloneCount] = useState<number | null>(null); const [cyclones, setCyclones] = useState<CycloneEvent[]>([]); const [news, setNews] = useState<NewsItem[]>([]); const [liveLoading, setLiveLoading] = useState(true);
  const timelineEvents: DashboardRow[] = useMemo(() => [...quakes.slice(0, 5).map((quake): DashboardRow => [new Date(quake.properties.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), `${quake.properties.mag === null ? "M ?" : `M ${quake.properties.mag.toFixed(1)}`} Earthquake`, quake.properties.place, quake.properties.mag !== null && quake.properties.mag >= 6 ? "red" : "orange", "USGS", quake.properties.url, new Date(quake.properties.time).toISOString()]), ...cyclones.slice(0, 2).map((event): DashboardRow => [new Date(event.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), event.title, "NOAA/NHC advisory", "blue", event.sourceName, event.sourceUrl, event.occurredAt]), ...news.slice(0, 2).map((item): DashboardRow => [new Date(item.publishedAt).toLocaleDateString(), item.title, item.sourceName, "purple", item.sourceName, item.sourceUrl, item.publishedAt])].slice(0, 7), [quakes, cyclones, news]);

  const filteredTimeline: DashboardRow[] = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return timelineEvents;
    }

    return filterEvents(timelineEvents, normalized) as DashboardRow[];
  }, [query, timelineEvents]);

  function showMessage(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 2200);
  }

  function handleMenu(item: string) {
    setActiveMenu(item);

    const route = routeForMenu(item);

    if (route) {
      router.push(route);
      return;
    }

    setPanel({ title: item, description: `${item} is ready for a future data integration. No live backend is configured for this module yet.` });
  }

  async function shareDashboard() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "ATLAS Living Dashboard", url });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showMessage("Dashboard link copied");
        return;
      }
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return;
    }
    setPanel({ title: "Share ATLAS", description: `Copy this dashboard address: ${url}` });
  }

  const ui = labels[language];
  const visibleMarketRows = marketRowsForTab({ Indices: [["Integration pending", "—", "No live source"]], Commodities: [["Integration pending", "—", "No live source"]], Crypto: [["Integration pending", "—", "No live source"]], Currencies: [["Integration pending", "—", "No live source"]] }, marketTab) as string[][];

  useEffect(() => { let cancelled = false; Promise.allSettled([fetch("/api/earthquakes?range=24h").then(async (r) => { if (!r.ok) throw new Error(); return r.json(); }), fetch("/api/cyclones").then(async (r) => { if (!r.ok && r.status !== 206) throw new Error(); return r.json(); }), fetch("/api/news").then(async (r) => { if (!r.ok && r.status !== 206) throw new Error(); return r.json(); })]).then(([earthquakes, cycloneResult, officialNews]) => { if (cancelled) return; if (earthquakes.status === "fulfilled") { setQuakes(earthquakes.value.features ?? []); setEarthquakesAvailable(true); } if (cycloneResult.status === "fulfilled") { setCycloneCount(cycloneResult.value.events?.length ?? 0); setCyclones(cycloneResult.value.events ?? []); } if (officialNews.status === "fulfilled") setNews(officialNews.value.items ?? []); setLiveLoading(false); }); return () => { cancelled = true; }; }, []);

  const selectWeatherCoordinate = useCallback((longitude: number, latitude: number) => { setPanel({ title: "Weather • Loading", description: `Requesting Open-Meteo observations for ${latitude.toFixed(3)}, ${longitude.toFixed(3)}…` }); fetch(`/api/weather?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error?.message); const weather = data.snapshot; setPanel({ title: "Weather • Open-Meteo", description: `${weather.location}\nObserved ${weather.observedAt}. ${weather.temperatureCelsius}°C (feels ${weather.apparentTemperatureCelsius}°C), humidity ${weather.humidityPercent}%, precipitation ${weather.precipitationMillimeters} mm, cloud ${weather.cloudCoverPercent}%, pressure ${weather.pressureHpa} hPa, wind ${weather.windSpeedKph} km/h gusting ${weather.windGustKph} km/h at ${weather.windDirectionDegrees}°. Source: ${weather.sourceUrl}. Fetched: ${data.fetchedAt}. Category: weather.` }); }).catch(() => setPanel({ title: "Weather unavailable", description: "Open-Meteo could not be reached. No substitute values are shown." })); }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, []);

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
              ref={searchRef}
              type="search"
              value={query}
              placeholder={ui.search}
              aria-label={ui.search}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  showMessage(
                    query
                      ? `${filteredTimeline.length} matching visible event${filteredTimeline.length === 1 ? "" : "s"}`
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
              aria-label="Change language"
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
              aria-label="System status"
              onClick={() => setPanel({ title: "System status", description: "The dashboard is operational. Live earthquake availability depends on the upstream USGS feed." })}
            >
              ♧
            </button>

            <button
              className="atlas-v4-notification"
              type="button"
              aria-label="Open notifications"
              aria-expanded={panel?.title === "Notifications"}
              onClick={() => setPanel({ title: "Notifications", description: "No live notifications source is configured. Persistent, personalized notifications are not currently available." })}
            >
              ♢
              <span>•</span>
            </button>

            <button
              type="button"
              aria-label="Share dashboard"
              onClick={shareDashboard}
            >
              ↗
            </button>

            <button
              className="atlas-v4-login"
              type="button"
              onClick={() => router.push("/login")}
            >
              {ui.login}
            </button>
          </div>
        </header>

        <MetricStrip earthquakeCount={earthquakesAvailable ? quakes.length : null} cycloneCount={cycloneCount} loading={liveLoading} />

        <section className="atlas-v4-primary">
          <div className="atlas-v4-left">
            <article className="atlas-v4-card atlas-v4-map-panel">
              <div className="atlas-v4-map-heading">
                <h2>{ui.liveMap}</h2>

                <span className="atlas-v4-live">
                  LIVE
                </span>

                <small>● Official-source events only</small>
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
                      if (layer === "Weather") setPanel({ title: "Weather", description: "Click anywhere on the map to request real current conditions for those coordinates from Open-Meteo." });
                      else if (!["All Layers", "Earthquake"].includes(layer)) setPanel({ title: layer, description: `${layer} map data is not connected yet. No live values are shown.` });
                    }}
                    aria-pressed={activeLayer === layer}
                  >
                    {layer}
                  </button>
                ))}
              </div>

              <div className="atlas-v4-map-body">
                <AtlasMap
                  activeLayer={activeLayer}
                  onCoordinateSelect={selectWeatherCoordinate}
                />
              </div>
            </article>

            <article className="atlas-v4-card atlas-v4-timeline">
              <div className="atlas-v4-section-title">
                <h2>{ui.timeline}</h2>
                <span>Live events</span>
              </div>

              <div className="atlas-v4-timeline-row">
                {filteredTimeline.map(
                  ([time, title, place, tone, source, sourceUrl, publishedAt]) => (
                    <button
                      type="button"
                      key={`${time}-${title}`}
                      className={`atlas-v4-event ${tone}`}
                      onClick={() => setPanel({ title, description: `${time} — ${place}. Source: ${source}. Published: ${publishedAt}. Category: ${source === "USGS" ? "earthquake" : source.includes("Hurricane") ? "cyclone" : "space/news"}. ${sourceUrl}` })}
                    >
                      <span>{time}</span>
                      <strong>{title}</strong>
                      <small>{place}</small>
                    </button>
                  )
                )}
                {filteredTimeline.length === 0 ? <p className="atlas-v4-no-results" role="status">No visible events match “{query}”.</p> : null}
              </div>
            </article>
          </div>

          <aside className="atlas-v4-right">
            <article className="atlas-v4-card atlas-v4-summary">
              <div className="atlas-v4-section-title">
                <h2>〽 AI GLOBAL SUMMARY</h2>
                <span>Integration pending</span>
              </div>

              <h3>No sourced global summary available</h3>
              <p>ATLAS does not generate or display an unsourced risk narrative. A cited report integration is pending.</p>

              <div className="atlas-v4-summary-list">
                <div>
                  <span>◉ Risk Level</span>
                  <b className="orange">Pending</b>
                </div>

                <div>
                  <span>◉ Economic Impact</span>
                  <b className="orange">Pending</b>
                </div>

                <div>
                  <span>◉ AI & Tech Outlook</span>
                  <b className="orange">Pending</b>
                </div>

                <div>
                  <span>◉ Climate Outlook</span>
                  <b className="orange">Pending</b>
                </div>
              </div>

              <div className="atlas-v4-ai-orb">
                AI
              </div>

              <button
                className="atlas-v4-panel-button"
                type="button"
                aria-expanded={panel?.title === "AI Global Report"}
                onClick={() => setPanel({ title: "AI Global Report", description: "This summary is demonstration content. A report-generation API is required for sourced, current intelligence; no report has been fabricated or saved." })}
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
                  <strong>{quakes[0]?.properties.mag === null ? "M ?" : quakes[0] ? `M ${quakes[0].properties.mag?.toFixed(1)}` : liveLoading ? "Loading…" : "Unavailable"}</strong>
                  <small>USGS • earthquake</small>
                  <h3>{quakes[0]?.properties.place ?? "No current USGS item available"}</h3>
                  {quakes[0] ? <p>{new Date(quakes[0].properties.time).toLocaleString()}<br />Depth: {quakes[0].geometry.coordinates[2].toFixed(1)} km<br />Tsunami flag: <b className={quakes[0].properties.tsunami ? "red" : "green"}>{quakes[0].properties.tsunami ? "Yes" : "No"}</b><br /><a href={quakes[0].properties.url} target="_blank" rel="noopener noreferrer">USGS source ↗</a></p> : null}
                </div>

                <div className="atlas-v4-radar">
                  <i />
                  <i />
                  <i />
                  <b />
                </div>
              </div>

              <div className="atlas-v4-quake-list">
                {quakes.slice(1, 6).map((quake) => {
                  const magnitude = quake.properties.mag === null ? "M ?" : `M ${quake.properties.mag.toFixed(1)}`; const place = quake.properties.place; const time = new Date(quake.properties.time).toLocaleTimeString([], { timeZone: "UTC", hour: "2-digit", minute: "2-digit" }); return (
                    <button
                      type="button"
                      key={quake.id}
                      onClick={() => setPanel({ title: `${magnitude} Earthquake`, description: `${place}, ${time} UTC. Source: USGS. Published: ${new Date(quake.properties.time).toISOString()}. Category: earthquake. ${quake.properties.url}` })}
                    >
                      <strong>{magnitude}</strong>
                      <span>{place}</span>
                      <small>{time}</small>
                    </button>
                  ); })}
              </div>
            </article>
          </aside>
        </section>

        <section className="atlas-v4-bottom">
          <article className="atlas-v4-card atlas-v4-sentiment">
            <div className="atlas-v4-section-title">
              <h2>GLOBAL SENTIMENT INDEX</h2>
            </div>

            <p>Integration pending • no live source configured</p>

            <div className="atlas-v4-gauge">
              <div />
              <strong>—</strong><span>Unavailable</span>
            </div>
          </article>

          <article className="atlas-v4-card atlas-v4-chart">
            <div className="atlas-v4-section-title">
              <h2>SENTIMENT TREND</h2>
              <span>Demo only • no live source</span>
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
                  role="tab"
                  aria-selected={marketTab === tab}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="atlas-v4-market-table">
              {visibleMarketRows.map(
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

            <p>Official NASA/JPL technology and space news</p>

            {news.slice(0, 5).map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => window.open(item.sourceUrl, "_blank", "noopener,noreferrer")}
                >
                  <b className={`tone-${index}`}>
                    ◉
                  </b>

                  <span>
                    <strong>{item.sourceName}</strong><small>{item.title}</small>
                  </span>

                  <time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleDateString()}</time>
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
                <b className="green">{cycloneCount ?? "—"}</b>
                <span>Cyclones</span>
              </div>

              <div>
                <b className="red">—</b>
                <span>Wildfires</span>
              </div>

              <div>
                <b className="blue">—</b>
                <span>Floods</span>
              </div>

              <div>
                <b className="green">—</b>
                <span>Volcanoes</span>
              </div>
            </div>

            <div className="atlas-v4-mini-map" aria-label="Disaster map integration pending" />
          </article>
        </section>

        <footer className="atlas-v4-breaking">
          <strong>LATEST OFFICIAL NEWS</strong>
          {news.length ? news.slice(0, 5).map((item) => <a key={item.id} href={item.sourceUrl} target="_blank" rel="noopener noreferrer"><span>{item.title} • {item.sourceName} • {new Date(item.publishedAt).toLocaleString()}</span></a>) : <span>{liveLoading ? "Loading official feeds…" : "Official feeds unavailable — no placeholder news shown"}</span>}
        </footer>
      </main>

      {message ? (
        <div className="atlas-v4-toast" role="status" aria-live="polite">
          ✓ {message}
        </div>
      ) : null}
      <DashboardModal title={panel?.title ?? ""} description={panel?.description ?? ""} open={panel !== null} onClose={() => setPanel(null)} />
    </div>
  );
}
