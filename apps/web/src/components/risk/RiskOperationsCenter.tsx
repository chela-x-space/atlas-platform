"use client";
import Link from "next/link";
import {useCallback,useEffect,useMemo,useState} from "react";
import type {RiskAlert,RiskLevel,RiskSnapshot} from "@/lib/risk/risk-contracts";
import {filterRiskAlerts,RISK_LEVELS} from "@/lib/risk/risk-engine.mjs";

const COLORS:Record<RiskLevel,string>={CRITICAL:"#ff4152",HIGH:"#f4814b",ELEVATED:"#e8b849",WATCH:"#4caad5",INFORMATIONAL:"#899eaa"};
const EMPTY={levels:[] as RiskLevel[],categories:[] as RiskAlert["sourceCategory"][],provider:"",from:null,to:null,activity:"" as const,coordinates:"" as const,search:"",limit:200};
export function RiskOperationsCenter(){
  const [snapshot,setSnapshot]=useState<RiskSnapshot|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const [level,setLevel]=useState(""),[category,setCategory]=useState(""),[provider,setProvider]=useState(""),[range,setRange]=useState(""),[activity,setActivity]=useState(""),[coordinates,setCoordinates]=useState(""),[search,setSearch]=useState("");
  const load=useCallback(async()=>{try{const response=await fetch("/api/risk?limit=200",{cache:"no-store"}),data=await response.json() as RiskSnapshot&{error?:{message?:string}};if(!response.ok&&response.status!==206)throw new Error(data.error?.message);setSnapshot(data);setError("")}catch{setError("Verified canonical events are unavailable. No replacement risk classifications are shown.")}finally{setLoading(false)}},[]);
  useEffect(()=>{queueMicrotask(load);const timer=window.setInterval(load,60_000);return()=>window.clearInterval(timer)},[load]);
  const filters=useMemo(()=>{const now=Date.parse(snapshot?.evaluatedAt??"")||0,from=range?new Date(now-Number(range)*3_600_000).toISOString():null;return{...EMPTY,levels:level?[level as RiskLevel]:[],categories:category?[category as RiskAlert["sourceCategory"]]:[],provider,from,activity:activity as ""|"active"|"resolved",coordinates:coordinates as ""|"available"|"unavailable",search}},[level,category,provider,range,activity,coordinates,search,snapshot?.evaluatedAt]);
  const alerts=useMemo(()=>filterRiskAlerts(snapshot?.alerts??[],filters),[snapshot,filters]);
  const providers=useMemo(()=>[...new Map((snapshot?.alerts??[]).map(x=>[x.providerId,x.providerName])).entries()],[snapshot]);
  const categories=useMemo(()=>snapshot?.summary.categories??[],[snapshot]);
  const matrix=useMemo(()=>{const evaluated=Date.parse(snapshot?.evaluatedAt??"")||0;return RISK_LEVELS.map(risk=>({risk,recent:alerts.filter(x=>x.level===risk&&x.activity==="active"&&evaluated-Date.parse(x.occurredAt)<=86_400_000).length,active:alerts.filter(x=>x.level===risk&&x.activity==="active"&&evaluated-Date.parse(x.occurredAt)>86_400_000).length,resolved:alerts.filter(x=>x.level===risk&&x.activity==="resolved").length}))},[alerts,snapshot?.evaluatedAt]);
  return <main className="risk-page">
    <header className="risk-hero"><div><p>ATLAS DETERMINISTIC OPERATIONS</p><h1>Global Risk</h1><span>Rule-based classifications from verified canonical events — not predictive AI</span></div><nav><Link href="/app/map">World Map</Link><Link href="/app/breaking">Breaking</Link></nav></header>
    {snapshot?.degraded?<div className="risk-degraded" role="status">DEGRADED · One or more canonical sources are unavailable or stale. Available classifications retain original provenance.</div>:null}
    {error?<div className="risk-error" role="alert">{error}</div>:null}
    <section className="risk-summary" aria-label="Risk summary"><article><span>Evaluated</span><strong>{snapshot?.summary.totalEvaluated??"—"}</strong></article>{RISK_LEVELS.map(item=><article key={item}><span>{item}</span><strong style={{color:COLORS[item as RiskLevel]}}>{snapshot?.summary.counts[item as RiskLevel]??"—"}</strong></article>)}<article><span>Categories</span><strong>{categories.length}</strong></article><article><span>Evaluated</span><strong>{snapshot?new Date(snapshot.evaluatedAt).toLocaleTimeString():"—"}</strong></article></section>
    <section className="risk-filters" aria-label="Alert filters">
      <label>Search<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Verified title, location, source"/></label>
      <label>Risk level<select value={level} onChange={e=>setLevel(e.target.value)}><option value="">All levels</option>{RISK_LEVELS.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Provider<select value={provider} onChange={e=>setProvider(e.target.value)}><option value="">All providers</option>{providers.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
      <label>Time range<select value={range} onChange={e=>setRange(e.target.value)}><option value="">All time</option><option value="24">Last 24 hours</option><option value="168">Last 7 days</option></select></label>
      <label>Status<select value={activity} onChange={e=>setActivity(e.target.value)}><option value="">Active + resolved</option><option value="active">Active</option><option value="resolved">Resolved</option></select></label>
      <label>Coordinates<select value={coordinates} onChange={e=>setCoordinates(e.target.value)}><option value="">Any</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label>
    </section>
    <section className="risk-layout">
      <div className="risk-queue"><header><h2>Alert Queue</h2><span>{alerts.length} visible</span></header>{loading?<p className="risk-empty" role="status">Evaluating verified events…</p>:alerts.length?alerts.map(alert=><article key={alert.sourceEventId} className={`risk-alert level-${alert.level.toLowerCase()}`} tabIndex={0}><header><b>{alert.level}</b><span>{alert.sourceCategory}</span><time dateTime={alert.occurredAt}>{new Date(alert.occurredAt).toLocaleString()}</time></header><h3>{alert.title}</h3>{alert.location?<p className="risk-location">{alert.location}</p>:null}<p>{alert.explanation}</p><footer><span>{alert.providerName} · {alert.sourceAttribution}</span><nav><Link href={alert.canonicalTarget}>Open Event</Link><Link href={alert.timelineTarget}>Timeline</Link><Link href={alert.breakingTarget}>Breaking</Link>{alert.mapTarget?<Link href={alert.mapTarget}>Show on map</Link>:<span>Coordinates unavailable</span>}</nav></footer></article>):<p className="risk-empty">No verified events match the current filters.</p>}</div>
      <aside className="risk-matrix"><h2>Operational Matrix</h2><p>Classification grouped by recency and canonical status. This is not probability or impact scoring.</p><div role="table" aria-label="Risk by recency and status"><div role="row"><b role="columnheader">Level</b><b role="columnheader">Recent active</b><b role="columnheader">Older active</b><b role="columnheader">Resolved</b></div>{matrix.map(row=><div role="row" key={row.risk}><strong role="rowheader" style={{color:COLORS[row.risk as RiskLevel]}}>{row.risk}</strong><span>{row.recent}</span><span>{row.active}</span><span>{row.resolved}</span></div>)}</div><footer><Link href="/api/risk/rules">Public rule metadata</Link><span>Rules v1.0.0</span></footer></aside>
    </section>
  </main>
}
