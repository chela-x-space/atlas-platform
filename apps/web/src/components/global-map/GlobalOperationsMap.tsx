"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import type { BreakingEvent, BreakingSnapshot } from "@/lib/breaking/breaking-contract";
import {
  clusterExpansionTarget,
  currentFilterCount,
  eventsToGeoJson,
  filterMapEvents,
  MAP_LAYERS,
  MAP_PRIORITIES,
  normalizeMapEvent,
  PRIORITY_COLORS,
} from "@/lib/global-map/global-map-logic.mjs";
import { safeExternalUrl } from "@/lib/security/external-url.mjs";

type MapEvent = BreakingEvent & { markerSize: number };
type Filters = { country:string; provider:string; category:string; from:string; to:string; priority:string; layers:string[] };

const INITIAL_FILTERS: Filters = { country:"", provider:"", category:"", from:"", to:"", priority:"", layers:[...MAP_LAYERS] };
const LABELS: Record<string,string> = {
  earthquake:"Earthquakes", volcano:"Volcanoes", weather:"Weather", disaster:"Disasters",
  conflict:"Conflicts", economy:"Economy", ai:"AI", cyber:"Cyber", aviation:"Aviation",
  marine:"Marine", space:"Space", energy:"Energy", health:"Health",
};

const ICONS: Record<string,string> = {
  earthquake:`<circle cx="16" cy="16" r="8"/><path d="m13 7 2 7-4 4 5 7 2-8 4-3-4-7"/>`,
  weather:`<path d="M9 24h14a6 6 0 0 0 0-12 8 8 0 0 0-15-1A6.5 6.5 0 0 0 9 24Z"/>`,
  conflict:`<path d="m16 5 11 21H5Z"/>`,
  space:`<path d="M12 8h8v16h-8zM4 11h6v10H4zm18 0h6v10h-6zM16 3v5m0 16v5"/>`,
  ai:`<path d="m16 4 11 6v12l-11 6-11-6V10Z"/><path d="M12 12h8v8h-8z"/>`,
  cyber:`<path d="M16 4 27 8v7c0 7-4 11-11 14C9 26 5 22 5 15V8Z"/><path d="m11 16 3 3 7-7"/>`,
  marine:`<path d="m5 18 3 7h16l3-7-11 3Zm5-1V9h12v8M14 9V5h4v4"/>`,
  energy:`<path d="m18 3-9 15h7l-2 11 9-15h-7Z"/>`,
  health:`<path d="M12 4h8v8h8v8h-8v8h-8v-8H4v-8h8Z"/>`,
  volcano:`<path d="m4 27 9-18 4 7 3-5 8 16Zm10-21 2-3 2 3 3-2"/>`,
  disaster:`<path d="M16 4 29 27H3Zm0 8v7m0 4v1"/>`,
  economy:`<path d="M5 26V15h5v11m3 0V9h6v17m3 0V4h5v22"/>`,
  aviation:`<path d="m4 18 10-3 3-11 3 1-1 10 9 5-1 3-10-2-6 7-2-1 3-8-7 2Z"/>`,
};

function svgIcon(path:string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function loadIcon(svg:string): Promise<HTMLImageElement> {
  return new Promise((resolve,reject)=>{
    const image=new Image(32,32);
    image.onload=()=>resolve(image);
    image.onerror=reject;
    image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function eventLinks(event:MapEvent) {
  return {
    detail:event.eventDetailUrl ?? `/app/events/${encodeURIComponent(event.canonicalId)}`,
    timeline:event.timelineUrl ?? `/app/timeline?search=${encodeURIComponent(event.title)}`,
    graph:event.graphUrl ?? `/app/graph/${encodeURIComponent(event.canonicalId)}`,
    source:`/app/sources?search=${encodeURIComponent(event.providerId)}`,
  };
}

export function GlobalOperationsMap() {
  const containerRef=useRef<HTMLDivElement|null>(null);
  const mapRef=useRef<MapLibreMap|null>(null);
  const eventsRef=useRef<Map<string,MapEvent>>(new Map());
  const [snapshot,setSnapshot]=useState<BreakingSnapshot|null>(null);
  const [filters,setFilters]=useState<Filters>(INITIAL_FILTERS);
  const [selected,setSelected]=useState<MapEvent|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [mapReady,setMapReady]=useState(false);

  const allEvents=useMemo(()=>(snapshot?.events??[]).map(normalizeMapEvent).filter((item):item is MapEvent=>item!==null),[snapshot]);
  const visible=useMemo(()=>filterMapEvents(allEvents,filters),[allEvents,filters]);
  const providers=useMemo(()=>[...new Map((snapshot?.providers??[]).map(item=>[item.providerId,item.providerName])).entries()],[snapshot]);
  const currentFilters=currentFilterCount(filters);

  const load=useCallback(async()=>{
    try {
      const response=await fetch("/api/breaking?limit=200",{cache:"no-store"});
      const data=await response.json() as BreakingSnapshot & {error?:{message?:string}};
      if(!response.ok)throw new Error(data.error?.message??"Map data is unavailable");
      setSnapshot(data);setError("");
    } catch {
      setError("Verified map events are temporarily unavailable. No substitute markers are shown.");
    } finally { setLoading(false); }
  },[]);

  useEffect(()=>{queueMicrotask(load);const timer=window.setInterval(load,60_000);return()=>window.clearInterval(timer);},[load]);

  useEffect(()=>{
    if(!containerRef.current||mapRef.current)return;
    const map=new maplibregl.Map({
      container:containerRef.current,style:"https://demotiles.maplibre.org/style.json",
      center:[12,18],zoom:1.35,minZoom:.7,maxZoom:14,attributionControl:false,
    });
    mapRef.current=map;
    map.addControl(new maplibregl.NavigationControl({showCompass:true}),"top-right");
    map.addControl(new maplibregl.AttributionControl({compact:true}),"bottom-right");
    map.on("error",()=>setError(current=>current||"Open map tiles are unavailable. Verified events remain accessible in the event list."));
    map.on("load",async()=>{
      try {
        await Promise.all(Object.entries(ICONS).map(async([name,path])=>{
          if(!map.hasImage(`atlas-${name}`))map.addImage(`atlas-${name}`,await loadIcon(svgIcon(path)));
        }));
      } catch { setError("Some map symbols could not load. The verified event list remains available."); }
      map.addSource("atlas-global-events",{type:"geojson",data:eventsToGeoJson([]),cluster:true,clusterRadius:54,clusterMaxZoom:8});
      map.addLayer({id:"atlas-clusters",type:"circle",source:"atlas-global-events",filter:["has","point_count"],paint:{
        "circle-color":"#123e59","circle-stroke-color":"#68cef8","circle-stroke-width":2,
        "circle-radius":["step",["get","point_count"],17,10,22,40,28],
      }});
      map.addLayer({id:"atlas-cluster-count",type:"symbol",source:"atlas-global-events",filter:["has","point_count"],layout:{"text-field":["get","point_count_abbreviated"],"text-size":11},paint:{"text-color":"#f2fbff"}});
      map.addLayer({id:"atlas-critical-pulse",type:"circle",source:"atlas-global-events",filter:["all",["!",["has","point_count"]],["==",["get","pulse"],1]],paint:{
        "circle-radius":["*",17,["get","markerSize"]],"circle-color":"rgba(255,65,82,0.06)","circle-stroke-color":"#ff4152","circle-stroke-width":1.5,"circle-opacity":.55,
      }});
      map.addLayer({id:"atlas-event-symbols",type:"symbol",source:"atlas-global-events",filter:["!",["has","point_count"]],layout:{
        "icon-image":["concat","atlas-",["get","category"]],"icon-size":["*",.72,["get","markerSize"]],"icon-allow-overlap":false,"icon-padding":3,
      }});
      map.addLayer({id:"atlas-event-badges",type:"circle",source:"atlas-global-events",filter:["!",["has","point_count"]],paint:{
        "circle-radius":["*",13,["get","markerSize"]],"circle-color":["match",["get","priority"],"critical",PRIORITY_COLORS.critical,"high",PRIORITY_COLORS.high,"medium",PRIORITY_COLORS.medium,PRIORITY_COLORS.information],
        "circle-opacity":.82,"circle-stroke-color":"#e8f5fb","circle-stroke-width":1,
      }}, "atlas-event-symbols");
      map.on("click","atlas-clusters",async(event:MapLayerMouseEvent)=>{
        const feature=event.features?.[0];if(!feature)return;
        const source=map.getSource("atlas-global-events") as GeoJSONSource;
        const zoom=await source.getClusterExpansionZoom(feature.properties?.cluster_id);
        map.easeTo({center:(feature.geometry as GeoJSON.Point).coordinates as [number,number],zoom:clusterExpansionTarget(map.getZoom(),zoom)});
      });
      map.on("click","atlas-event-symbols",(event:MapLayerMouseEvent)=>{
        const id=String(event.features?.[0]?.properties?.canonicalId??"");
        const item=eventsRef.current.get(id);if(item)setSelected(item);
      });
      for(const id of ["atlas-clusters","atlas-event-symbols"]) {
        map.on("mouseenter",id,()=>{map.getCanvas().style.cursor="pointer";});
        map.on("mouseleave",id,()=>{map.getCanvas().style.cursor="";});
      }
      setMapReady(true);
    });
    const observer=new ResizeObserver(()=>map.resize());observer.observe(containerRef.current);
    return()=>{observer.disconnect();map.remove();mapRef.current=null;};
  },[]);

  useEffect(()=>{
    eventsRef.current=new Map(visible.map(event=>[event.canonicalId,event]));
    const map=mapRef.current;if(!map||!mapReady)return;
    (map.getSource("atlas-global-events") as GeoJSONSource|undefined)?.setData(eventsToGeoJson(visible));
  },[visible,mapReady]);

  useEffect(()=>{
    const map=mapRef.current;
    if(!mapReady||!map||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    let expanded=false;
    const timer=window.setInterval(()=>{
      if(!map.getLayer("atlas-critical-pulse"))return;
      expanded=!expanded;
      map.setPaintProperty("atlas-critical-pulse","circle-opacity",expanded ? .24 : .55);
      map.setPaintProperty("atlas-critical-pulse","circle-stroke-width",expanded?2.25:1.5);
    },1400);
    return()=>window.clearInterval(timer);
  },[mapReady]);

  function toggleLayer(layer:string) {
    setFilters(value=>({...value,layers:value.layers.includes(layer)?value.layers.filter(item=>item!==layer):[...value.layers,layer]}));
  }
  function chooseEvent(event:MapEvent) {
    setSelected(event);mapRef.current?.easeTo({center:[event.longitude!,event.latitude!],zoom:Math.max(mapRef.current.getZoom(),5)});
  }
  const links=selected?eventLinks(selected):null;

  return <main className="global-map-page">
    <header className="global-map-header">
      <div><p>ATLAS GLOBAL INTELLIGENCE</p><h1>World Map</h1><span>Verified canonical events with confirmed coordinates only</span></div>
      <Link href="/app">Global Overview</Link>
    </header>
    <section className="global-map-summary" aria-label="World summary">
      <article><span>Current Earthquakes</span><strong>{snapshot?.status.earthquakes??"—"}</strong></article>
      <article><span>Current Weather Alerts</span><strong>{snapshot?.status.storms??"—"}</strong></article>
      <article><span>Breaking Events</span><strong>{snapshot?.activeBreakingEvents??"—"}</strong></article>
      <article><span>Active AI Releases</span><strong>{snapshot?.status.aiReleases??"—"}</strong></article>
      <article><span>Space Events</span><strong>{snapshot?.status.spaceEvents??"—"}</strong></article>
      <article><span>Updated</span><strong>{snapshot?new Date(snapshot.generatedAt).toLocaleTimeString():"—"}</strong></article>
    </section>
    {error?<div className="global-map-alert" role="alert">{error}</div>:null}
    <section className="global-map-controls" aria-label="Map filters">
      <label>Country / region<input value={filters.country} onChange={e=>setFilters(v=>({...v,country:e.target.value}))} placeholder="Search country"/></label>
      <label>Provider<select value={filters.provider} onChange={e=>setFilters(v=>({...v,provider:e.target.value}))}><option value="">All providers</option>{providers.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
      <label>Category<select value={filters.category} onChange={e=>setFilters(v=>({...v,category:e.target.value}))}><option value="">All categories</option>{MAP_LAYERS.map(layer=><option key={layer} value={layer}>{LABELS[layer]}</option>)}</select></label>
      <label>From<input type="date" value={filters.from} onChange={e=>setFilters(v=>({...v,from:e.target.value}))}/></label>
      <label>To<input type="date" value={filters.to} onChange={e=>setFilters(v=>({...v,to:e.target.value}))}/></label>
      <label>Priority<select value={filters.priority} onChange={e=>setFilters(v=>({...v,priority:e.target.value}))}><option value="">All priorities</option>{MAP_PRIORITIES.map(priority=><option key={priority}>{priority}</option>)}</select></label>
      <button type="button" onClick={()=>setFilters(INITIAL_FILTERS)} disabled={!currentFilters}>Reset filters</button>
    </section>
    <section className="global-map-layer-bar" aria-label="Map layers">{MAP_LAYERS.map(layer=><button type="button" key={layer} className={filters.layers.includes(layer)?"active":""} aria-pressed={filters.layers.includes(layer)} onClick={()=>toggleLayer(layer)}>{LABELS[layer]}</button>)}</section>
    <section className="global-map-workspace">
      <div className="global-map-canvas-wrap">
        <div ref={containerRef} className="global-map-canvas" role="application" aria-label="Interactive world map of verified ATLAS events"/>
        {loading?<div className="global-map-loading" role="status">Loading verified events…</div>:null}
        <aside className="global-map-legend" aria-label="Interactive map legend">
          <details open><summary>Legend</summary>
            <div><strong>Priorities</strong>{MAP_PRIORITIES.map(priority=><span key={priority}><i style={{background:PRIORITY_COLORS[priority]}}/>{priority}</span>)}</div>
            <div><strong>Marker sizes</strong><span><i className="size small"/>Information</span><span><i className="size medium"/>High</span><span><i className="size large"/>Critical</span></div>
          </details>
        </aside>
      </div>
      <aside className="global-map-events" aria-label="Keyboard accessible visible events">
        <h2>Visible Events <span>{visible.length}</span></h2>
        {visible.length?<div>{visible.map(event=><button type="button" key={event.canonicalId} onClick={()=>chooseEvent(event)} className={selected?.canonicalId===event.canonicalId?"selected":""}><i style={{background:PRIORITY_COLORS[event.priority]}}/><span><strong>{event.title}</strong><small>{LABELS[event.category]} · {event.providerName}</small></span></button>)}</div>:<p>{loading?"Loading…":"No verified events with confirmed coordinates match the filters."}</p>}
      </aside>
      {selected&&links?<article className="global-map-popup" aria-live="polite">
        <button type="button" className="close" onClick={()=>setSelected(null)} aria-label="Close event details">×</button>
        <p>VERIFIED · {selected.priority}</p><h2>{selected.title}</h2>
        <dl><div><dt>Category</dt><dd>{LABELS[selected.category]}</dd></div><div><dt>Country</dt><dd>{selected.country??selected.region??"Not supplied"}</dd></div><div><dt>Provider</dt><dd>{selected.providerName}</dd></div><div><dt>Published</dt><dd>{new Date(selected.publishedAt).toLocaleString()}</dd></div><div><dt>Updated</dt><dd>{new Date(selected.updatedAt).toLocaleString()}</dd></div><div><dt>Priority</dt><dd>{selected.priority}</dd></div><div><dt>Verification</dt><dd>{selected.verified?"Verified":"Unavailable"}</dd></div></dl>
        <nav><Link href={links.detail}>Open Event</Link><Link href={links.timeline}>Timeline</Link><Link href={links.graph}>Graph</Link><Link href={links.source}>Source</Link>{safeExternalUrl(selected.sourceUrl)?<a href={safeExternalUrl(selected.sourceUrl)!} target="_blank" rel="noopener noreferrer">Official Source ↗</a>:null}</nav>
      </article>:null}
    </section>
    <footer className="global-map-status">
      <span>Updated <b>{snapshot?new Date(snapshot.generatedAt).toLocaleString():"Unavailable"}</b></span>
      <span>Online Providers <b>{snapshot?.providers.filter(provider=>provider.status==="operational").length??0}</b></span>
      <span>Visible Events <b>{visible.length}</b></span><span>Current Filters <b>{currentFilters}</b></span>
    </footer>
  </main>;
}
