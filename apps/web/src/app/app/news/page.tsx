"use client";

import { useEffect, useState } from "react";
import type { AtlasEventSourceHealth } from "@/types/atlas-data";

export default function BreakingNewsPage() {
  const [health,setHealth]=useState<readonly AtlasEventSourceHealth[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{let cancelled=false;fetch("/api/source-health").then(async response=>{const body=await response.json() as {sources?:AtlasEventSourceHealth[]};if(!cancelled)setHealth(body.sources??[]);}).finally(()=>{if(!cancelled)setLoading(false);});return()=>{cancelled=true;};},[]);
  const newsHealth=health.filter(item=>item.sourceId==="jpl-news"||item.sourceId==="cneos-news");
  return <main className="breaking-news-page">
    <header className="breaking-news-header"><div><p>ATLAS SOURCE STATUS</p><h1>Latest News</h1><span>Official news integration is pending verification</span></div><div className="breaking-news-live">DISABLED</div></header>
    <div className="breaking-news-empty" role="status">
      <h2>Data source unavailable</h2>
      <p>NASA/JPL and CNEOS news ingestion is temporarily disabled. ATLAS does not show placeholder or scraped articles.</p>
      <p>Source status: {loading?"checking…":newsHealth.map(item=>`${item.sourceId}: ${item.status}`).join(" • ")||"disabled"}</p>
    </div>
  </main>;
}
