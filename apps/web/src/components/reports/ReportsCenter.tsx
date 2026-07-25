"use client";
import Link from "next/link";
import {useCallback,useEffect,useMemo,useState} from "react";
import type {ReportHistory,ReportType,ReportsResponse} from "@/lib/reports/report-contracts";

function queryOf(values:Record<string,string>){const params=new URLSearchParams();for(const [key,value] of Object.entries(values))if(value)params.set(key,value);return params.toString()}
export function ReportsCenter(){
  const [data,setData]=useState<ReportsResponse|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const [type,setType]=useState<ReportType>("daily-global"),[history,setHistory]=useState<ReportHistory>("24h"),[category,setCategory]=useState(""),[provider,setProvider]=useState(""),[risk,setRisk]=useState(""),[region,setRegion]=useState(""),[search,setSearch]=useState("");
  const query=useMemo(()=>queryOf({type,history,category,provider,risk,region,search}),[type,history,category,provider,risk,region,search]);
  const load=useCallback(async()=>{setLoading(true);try{const response=await fetch(`/api/reports?${query}`,{cache:"no-store"}),value=await response.json() as ReportsResponse&{error?:{message?:string}};if(!response.ok&&response.status!==206)throw new Error(value.error?.message);setData(value);setError("")}catch{setError("Verified canonical data is unavailable. No replacement report was generated.")}finally{setLoading(false)}},[query]);
  useEffect(()=>{queueMicrotask(load)},[load]);
  const report=data?.report,providers=report?.providers??[];
  function changeType(value:ReportType){setType(value);const definition=data?.types.find(item=>item.id===value);if(definition)setHistory(definition.defaultHistory)}
  return <main className="reports-page">
    <header className="reports-hero"><div><p>ATLAS VERIFIED REPORTING</p><h1>Reports Center</h1><span>Reproducible aggregation of canonical events — no generated interpretation</span></div><nav><Link href="/app/timeline">Timeline</Link><Link href="/app/risk">Global Risk</Link></nav></header>
    {data?.degraded?<div className="reports-degraded" role="status">DEGRADED · This report contains available verified records only. Source state is preserved.</div>:null}{error?<div className="reports-error" role="alert">{error}</div>:null}
    <section className="reports-controls" aria-label="Report filters">
      <label>Report type<select value={type} onChange={e=>changeType(e.target.value as ReportType)}>{(data?.types??[]).map(item=><option value={item.id} key={item.id}>{item.label}</option>)}{!data?<option value={type}>Daily Global Report</option>:null}</select></label>
      <label>History<select value={history} onChange={e=>setHistory(e.target.value as ReportHistory)}><option value="today">Today</option><option value="24h">Last 24h</option><option value="7d">7 days</option><option value="30d">30 days</option></select></label>
      <label>Category<input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Canonical category"/></label>
      <label>Provider<select value={provider} onChange={e=>setProvider(e.target.value)}><option value="">All providers</option>{providers.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label>Risk<select value={risk} onChange={e=>setRisk(e.target.value)}><option value="">All levels</option>{["CRITICAL","HIGH","ELEVATED","WATCH","INFORMATIONAL"].map(item=><option key={item}>{item}</option>)}</select></label>
      <label>Region<input value={region} onChange={e=>setRegion(e.target.value)} placeholder="Verified location"/></label>
      <label>Search<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Title, source, attribution"/></label>
    </section>
    {loading&&!report?<div className="reports-empty" role="status">Generating deterministic report…</div>:report?<>
      <section className="reports-meta"><article><span>Report ID</span><strong>{report.reportId}</strong></article><article><span>Coverage</span><strong>{new Date(report.coveredFrom).toLocaleString()} — {new Date(report.coveredTo).toLocaleString()}</strong></article><article><span>Events</span><strong>{report.eventCount}</strong></article><article><span>Sources</span><strong>{report.sourceCount}</strong></article><article><span>Categories</span><strong>{report.categories.length}</strong></article></section>
      <section className="reports-actions" aria-label="Report exports"><a href={`/api/reports/export?${query}&format=markdown`}>Export Markdown</a><a href={`/api/reports/export?${query}&format=json`}>Export JSON</a><a href={`/api/reports/export?${query}&format=text`}>Export Plain Text</a><span>Generated {new Date(report.generatedAt).toLocaleString()}</span></section>
      <section className="reports-grid">
        <article className="report-panel report-summary"><h2>Summary</h2><dl><div><dt>Events</dt><dd>{report.summary.eventCount}</dd></div><div><dt>Sources</dt><dd>{report.summary.sourceCount}</dd></div><div><dt>Categories</dt><dd>{report.summary.categoryCount}</dd></div><div><dt>Regions</dt><dd>{report.summary.regionCount}</dd></div></dl></article>
        <article className="report-panel"><h2>Risk Breakdown</h2>{report.riskBreakdown.length?<ul>{report.riskBreakdown.map(item=><li key={item.level}><span>{item.level}</span><b>{item.count}</b></li>)}</ul>:<p>No matching verified records.</p>}</article>
        <article className="report-panel"><h2>Category Breakdown</h2>{report.categoryBreakdown.length?<ul>{report.categoryBreakdown.map(item=><li key={item.category}><span>{item.category}</span><b>{item.count}</b></li>)}</ul>:<p>No matching categories.</p>}</article>
        <article className="report-panel"><h2>Top Regions</h2>{report.topRegions.length?<ol>{report.topRegions.map(item=><li key={item.region}><span>{item.region}</span><b>{item.count}</b></li>)}</ol>:<p>No verified region was supplied.</p>}</article>
        <article className="report-panel report-events"><h2>Key Events</h2>{report.keyEvents.length?report.keyEvents.map(item=><div key={item.canonicalId}><time>{new Date(item.occurredAt).toLocaleString()}</time><strong>{item.title}</strong><span>{item.category} · {item.riskLevel} · {item.providerName}</span><nav><Link href={item.canonicalTarget}>Open Event</Link><Link href={item.timelineTarget}>Timeline</Link></nav></div>):<p>No verified events match this report.</p>}</article>
        <article className="report-panel report-timeline"><h2>Timeline</h2>{report.timeline.map(item=><div key={`${item.canonicalId}:${item.occurredAt}`}><time>{new Date(item.occurredAt).toLocaleString()}</time><Link href={item.canonicalTarget}>{item.title}</Link></div>)}</article>
        <article className="report-panel report-sources"><h2>Official Sources</h2>{report.officialSources.map(item=><div key={item.providerId}><strong>{item.providerName}</strong><span>{item.attribution.join("; ")}</span></div>)}</article>
      </section>
    </>:<div className="reports-empty">No report is available.</div>}
  </main>
}
