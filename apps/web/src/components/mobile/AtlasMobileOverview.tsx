"use client";

import Link from "next/link";
import { useEffect,useMemo,useState } from "react";
import { AtlasMap } from "@/components/map/AtlasMap";
import { safeExternalUrl } from "@/lib/security/external-url.mjs";
import type { AtlasDashboardSnapshot,AtlasEvent } from "@/types/atlas-data";
import { GlobalMetricsCompact } from "@/components/metrics/GlobalMetricsCompact";
import { DashboardSentiment } from "@/components/sentiment/DashboardSentiment";
import { DashboardAiRadar } from "@/components/ai-radar/DashboardAiRadar";

function EventCard({event}:{event:AtlasEvent}){
  const url=safeExternalUrl(event.sourceUrl);
  return <article className="atlas-mobile-event"><div><span>{event.category}</span><time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString()}</time></div><h3><Link href={`/app/events/${encodeURIComponent(event.id)}`}>{event.title}</Link></h3><p>{event.region??event.summary}</p><footer><span>{event.sourceName}</span>{url?<a href={url} target="_blank" rel="noopener noreferrer">Source ↗</a>:<span>Detail link unavailable</span>}</footer></article>;
}

export function AtlasMobileOverview(){
  const [snapshot,setSnapshot]=useState<AtlasDashboardSnapshot|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[mapOpen,setMapOpen]=useState(false),[moreOpen,setMoreOpen]=useState(false);
  useEffect(()=>{let cancelled=false;const load=async()=>{setLoading(true);try{const response=await fetch("/api/dashboard",{cache:"no-store"});if(!response.ok)throw new Error();const data=await response.json() as AtlasDashboardSnapshot;if(!cancelled){setSnapshot(data);setError("");}}catch{if(!cancelled)setError("Live source data is temporarily unavailable.");}finally{if(!cancelled)setLoading(false);}};load();const timer=window.setInterval(load,60_000);return()=>{cancelled=true;window.clearInterval(timer);};},[]);
  const latest=useMemo(()=>(snapshot?.timelineEvents??[]).slice(0,5),[snapshot]);
  const earthquake=snapshot?.metrics.earthquakes24h,cyclone=snapshot?.metrics.cyclones;
  const activeHealth=(snapshot?.sourceHealth??[]).filter(item=>item.sourceId==="usgs-earthquakes"||item.sourceId==="noaa-nhc"||item.sourceId==="open-meteo");
  const serviceStatus=error?"Data unavailable":activeHealth.some(item=>item.status==="unavailable")?"Partial outage":activeHealth.some(item=>item.status==="degraded")?"Partial service":"Operational";
  return <div className="atlas-mobile">
    <header className="atlas-mobile-topbar"><Link href="/" className="atlas-mobile-brand"><b>◎</b><span><strong>ATLAS</strong><small>Mobile Service</small></span></Link><span className={`atlas-mobile-status ${error?"error":""}`}>{serviceStatus}</span></header>
    <main className="atlas-mobile-main">
      <section className="atlas-mobile-intro"><p>ATLAS MOBILE OVERVIEW</p><h1>Verified events, sized for your phone.</h1><span>The full command dashboard is optimized for larger screens.</span><small>Last updated: {snapshot?new Date(snapshot.generatedAt).toLocaleString():loading?"Loading…":"Unavailable"}</small></section>
      {error?<div className="atlas-mobile-alert" role="alert">{error} No substitute values are shown.</div>:null}
      <GlobalMetricsCompact />
      <DashboardSentiment mobile />
      <DashboardAiRadar mobile />
      <section className="atlas-mobile-metrics" aria-label="Current event totals"><article><span>Earthquakes · 24h</span><strong>{earthquake?.status==="available"?earthquake.value.toLocaleString():loading?"…":"Unavailable"}</strong><small>USGS · worldwide reporting</small></article><article><span>Cyclone advisories</span><strong>{cyclone?.status==="available"?cyclone.value.toLocaleString():loading?"…":"Unavailable"}</strong><small>NOAA/NHC · Atlantic + E/C Pacific</small></article></section>
      <section className="atlas-mobile-section"><div className="atlas-mobile-heading"><h2>Latest verified events</h2><Link href="/app/earthquake">View events</Link></div>{loading?<p className="atlas-mobile-empty" role="status">Loading verified events…</p>:latest.length?latest.map(event=><EventCard key={event.id} event={event}/>):<p className="atlas-mobile-empty">No verified events are currently available.</p>}</section>
      <section className="atlas-mobile-summary"><article><h2>Significant earthquake</h2>{snapshot?.strongestEarthquake?<EventCard event={snapshot.strongestEarthquake}/>:<p className="atlas-mobile-empty">Data source unavailable.</p>}</article><article><h2>Active cyclone summary</h2>{snapshot?.activeCyclones.length?<div className="atlas-mobile-cyclones">{snapshot.activeCyclones.slice(0,3).map(event=><EventCard key={event.id} event={event}/>)}</div>:<p className="atlas-mobile-empty">No active advisory is available. Coverage is limited to NOAA/NHC basins.</p>}</article></section>
      <section className="atlas-mobile-section" id="mobile-map"><div className="atlas-mobile-heading"><h2>Live earthquake map</h2><button type="button" onClick={()=>setMapOpen(value=>!value)} aria-expanded={mapOpen}>{mapOpen?"Hide map":"Open map"}</button></div>{mapOpen?<div className="atlas-mobile-map"><AtlasMap activeLayer="Earthquakes"/><p>If the map cannot initialize, use the verified event list above.</p></div>:<p className="atlas-mobile-empty">Map is collapsed to conserve mobile resources.</p>}</section>
      <section className="atlas-mobile-section"><h2>Source health</h2><div className="atlas-mobile-health">{activeHealth.length?activeHealth.map(item=><div key={item.sourceId}><strong>{item.sourceId}</strong><span>{item.status}</span><small>{item.message??`Checked ${new Date(item.checkedAt).toLocaleTimeString()}`}</small></div>):<p className="atlas-mobile-empty">Source health unavailable.</p>}</div></section>
      <div className="atlas-mobile-actions"><a href="/app?desktop=1">Open full dashboard anyway</a></div>
      <footer className="atlas-mobile-disclaimer">Data: U.S. Geological Survey and NOAA/National Hurricane Center. Coverage and update frequency vary. ATLAS is not emergency, financial, medical, or security advice. Verify critical information with the originating authority.</footer>
    </main>
    <nav className="atlas-mobile-nav" aria-label="Mobile navigation"><Link href="/app">Overview</Link><a href="#mobile-map" onClick={()=>setMapOpen(true)}>Map</a><Link href="/app/earthquake">Events</Link><Link href="/app/alerts">Alerts</Link><button type="button" onClick={()=>setMoreOpen(value=>!value)} aria-expanded={moreOpen} aria-controls="atlas-mobile-more">More</button></nav>
    {moreOpen?<div className="atlas-mobile-more" id="atlas-mobile-more"><div><strong>More ATLAS services</strong><button type="button" onClick={()=>setMoreOpen(false)} aria-label="Close menu">×</button></div><Link href="/app/breaking">Breaking News</Link><Link href="/app/ai">AI Technology Radar</Link><Link href="/app/metrics">Global Metrics</Link><Link href="/app/timeline">Global Timeline</Link><Link href="/app/news">News Center</Link><Link href="/app/weather">Weather · configuration required</Link><Link href="/app/markets">Markets · integration pending</Link><a href="/app?desktop=1">Full dashboard</a></div>:null}
  </div>;
}
