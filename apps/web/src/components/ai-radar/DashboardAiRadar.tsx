"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import type { RadarSnapshot } from "@/lib/ai-radar/ai-radar-contract";
export function DashboardAiRadar({mobile=false}:{mobile?:boolean}){
  const [snapshot,setSnapshot]=useState<RadarSnapshot|null>(null),[loading,setLoading]=useState(true);
  useEffect(()=>{let cancelled=false;fetch("/api/ai?limit=4",{cache:"no-store"}).then(async response=>{const value=await response.json();if(!response.ok&&response.status!==206)throw new Error();if(!cancelled)setSnapshot(value)}).catch(()=>{if(!cancelled)setSnapshot(null)}).finally(()=>{if(!cancelled)setLoading(false)});return()=>{cancelled=true}},[]);
  const content=<><div className="atlas-v4-section-title"><h2>AI TECHNOLOGY RADAR</h2><Link href="/app/ai">Explore →</Link></div>{loading?<p>Loading official technology sources…</p>:!snapshot?<p>Verified AI technology data unavailable</p>:<><div className="ai-dashboard-counts"><div><strong>{snapshot.releases.length}</strong><span>Latest releases</span></div><div><strong>{snapshot.benchmarks.length}</strong><span>Benchmark updates</span></div><div><strong>{snapshot.technologies.filter(item=>item.category==="agent").length}</strong><span>Coding agents</span></div><div><strong>{snapshot.technologies.filter(item=>item.openSource).length}</strong><span>Open-source</span></div></div>{snapshot.partial&&<small className="atlas-sentiment-partial">{snapshot.stale?"Stale · not live":"Partial official coverage"}</small>}<ul>{snapshot.releases.slice(0,2).map(item=><li key={item.id}><span>{item.name}</span><time>{new Date(item.releaseDate).toLocaleDateString()}</time></li>)}</ul></>}</>;
  return mobile?<section className="atlas-mobile-section atlas-mobile-ai-radar">{content}</section>:<article className="atlas-v4-card atlas-v4-chart atlas-dashboard-ai-radar">{content}</article>;
}
