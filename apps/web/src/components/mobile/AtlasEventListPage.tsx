"use client";

import Link from "next/link";
import { useEffect,useState } from "react";
import { safeExternalUrl } from "@/lib/security/external-url.mjs";
import type { AtlasEventPage } from "@/types/atlas-data";

export function AtlasEventListPage(){
  const [page,setPage]=useState<AtlasEventPage|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
  useEffect(()=>{let cancelled=false;fetch("/api/events?category=earthquake,cyclone&limit=50",{cache:"no-store"}).then(async response=>{if(!response.ok)throw new Error();return response.json() as Promise<AtlasEventPage>;}).then(data=>{if(!cancelled)setPage(data);}).catch(()=>{if(!cancelled)setError("Verified event data is temporarily unavailable.");}).finally(()=>{if(!cancelled)setLoading(false);});return()=>{cancelled=true;};},[]);
  return <main className="atlas-events-page"><header><div><p>ATLAS VERIFIED DATA</p><h1>Live Events</h1><span>USGS earthquakes and NOAA/NHC cyclone advisories</span></div><Link href="/app">Overview</Link></header>{loading?<div className="atlas-events-state" role="status">Loading verified events…</div>:error?<div className="atlas-events-state" role="alert">{error} No substitute events are shown.</div>:page?.events.length?<section>{page.events.map(event=>{const url=safeExternalUrl(event.sourceUrl);return <article key={event.id}><div><span>{event.category}</span><time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString()}</time></div><h2><Link href={`/app/events/${encodeURIComponent(event.id)}`}>{event.title}</Link></h2><p>{event.region??event.summary}</p><footer><span>{event.sourceName}</span>{url?<a href={url} target="_blank" rel="noopener noreferrer">Official source ↗</a>:<span>Detail link unavailable</span>}</footer></article>;})}</section>:<div className="atlas-events-state">No verified events are available.</div>}<footer className="atlas-events-disclaimer">Coverage and update frequency vary by source. Verify critical information with the originating authority.</footer></main>;
}
