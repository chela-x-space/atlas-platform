"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AtlasMap } from "@/components/map/AtlasMap";
import { AtlasSidebar } from "./AtlasSidebar";
import { MetricStrip } from "./MetricStrip";
import { DashboardModal } from "./DashboardModal";
import { GlobalMetricsCompact } from "@/components/metrics/GlobalMetricsCompact";
import { DashboardSentiment } from "@/components/sentiment/DashboardSentiment";
import { DashboardAiRadar } from "@/components/ai-radar/DashboardAiRadar";
import { filterEvents, marketRowsForTab, routeForMenu } from "@/lib/dashboard-logic.mjs";
import { safeExternalUrl } from "@/lib/security/external-url.mjs";
import type { AtlasDashboardSnapshot } from "@/types/atlas-data";

type DashboardRow = [string, string, string, string, string, string | undefined, string, string];

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
  const [snapshot, setSnapshot] = useState<AtlasDashboardSnapshot | null>(null); const [liveLoading, setLiveLoading] = useState(true); const [liveError,setLiveError]=useState("");
  const quakes=snapshot?.recentEarthquakes??[],news=snapshot?.technologyNews??[]; const earthquakeMetric=snapshot?.metrics.earthquakes24h,cycloneMetric=snapshot?.metrics.cyclones; const earthquakeCount=earthquakeMetric?.status==="available"?earthquakeMetric.value:null,cycloneCount=cycloneMetric?.status==="available"?cycloneMetric.value:null;
  const timelineEvents: DashboardRow[] = useMemo(() => (snapshot?.timelineEvents??[]).map((event):DashboardRow=>[new Date(event.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),event.title,event.region??event.summary,event.severity==="high"||event.severity==="critical"?"red":event.category==="cyclone"?"blue":event.category==="space"||event.category==="technology"?"purple":"orange",event.sourceName,safeExternalUrl(event.sourceUrl)??undefined,event.occurredAt,event.id]).slice(0,7),[snapshot]);

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

  useEffect(() => { let cancelled=false;fetch("/api/dashboard").then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error?.message??"Dashboard unavailable");if(!cancelled)setSnapshot(data as AtlasDashboardSnapshot);}).catch(()=>{if(!cancelled)setLiveError("ATLAS Data Hub is unavailable; no substitute values are shown.");}).finally(()=>{if(!cancelled)setLiveLoading(false);});return()=>{cancelled=true;};},[]);

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

        <MetricStrip earthquakeCount={earthquakeCount} cycloneCount={cycloneCount} loading={liveLoading} />
        <GlobalMetricsCompact />

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
                  ([time, title, place, tone, , , , eventId]) => (
                    <button
                      type="button"
                      key={`${time}-${title}`}
                      className={`atlas-v4-event ${tone}`}
                      onClick={() => router.push(`/app/events/${encodeURIComponent(eventId)}`)}
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
                onClick={() => setPanel({ title: "AI Global Report", description: "Integration pending. No AI report is computed or displayed in the public MVP." })}
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
                  <strong>{quakes[0] ? typeof quakes[0].metadata.magnitude === "number" ? `M ${quakes[0].metadata.magnitude.toFixed(1)}` : "M ?" : liveLoading ? "Loading…" : "Unavailable"}</strong>
                  <small>USGS • earthquake</small>
                  <h3>{quakes[0]?.region ?? "No current USGS item available"}</h3>
                  {quakes[0] ? <p>{new Date(quakes[0].occurredAt).toLocaleString()}<br />Depth: {quakes[0].coordinates?.depthKilometers?.toFixed(1) ?? "Not supplied"} km<br />Tsunami flag: <b className={quakes[0].metadata.tsunami ? "red" : "green"}>{quakes[0].metadata.tsunami ? "Yes" : "No"}</b><br />{safeExternalUrl(quakes[0].sourceUrl)?<a href={safeExternalUrl(quakes[0].sourceUrl)!} target="_blank" rel="noopener noreferrer">Official source ↗</a>:<span>Official detail link unavailable</span>}</p> : null}
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
                  const magnitude = typeof quake.metadata.magnitude === "number" ? `M ${quake.metadata.magnitude.toFixed(1)}` : "M ?"; const place = quake.region??quake.title; const time = new Date(quake.occurredAt).toLocaleTimeString([], { timeZone: "UTC", hour: "2-digit", minute: "2-digit" }); return (
                    <button
                      type="button"
                      key={quake.id}
                      onClick={() => router.push(`/app/events/${encodeURIComponent(quake.id)}`)}
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
          <DashboardSentiment />

          <DashboardAiRadar />

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

            <p>Temporarily disabled • source verification pending</p>

            {news.slice(0, 5).map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {const url=safeExternalUrl(item.sourceUrl);if(url)window.open(url, "_blank", "noopener,noreferrer");}}
                >
                  <b className={`tone-${index}`}>
                    ◉
                  </b>

                  <span>
                    <strong>{item.sourceName}</strong><small>{item.title}</small>
                  </span>

                  <time dateTime={item.occurredAt}>{new Date(item.occurredAt).toLocaleDateString()}</time>
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
          {news.length ? news.slice(0, 5).map((item) => {const url=safeExternalUrl(item.sourceUrl);return url?<a key={item.id} href={url} target="_blank" rel="noopener noreferrer"><span>{item.title} • {item.sourceName} • {new Date(item.occurredAt).toLocaleString()}</span></a>:<span key={item.id}>{item.title} • {item.sourceName}</span>;}) : <span>{liveLoading ? "Loading source status…" : liveError||"Technology news integration temporarily disabled — no placeholder news shown"}</span>}
        </footer>
        <p className="atlas-v4-data-disclaimer">ATLAS aggregates third-party public data. Coverage and update frequency vary. This is not emergency, financial, medical, or security advice; verify critical information with the originating authority.</p>
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
