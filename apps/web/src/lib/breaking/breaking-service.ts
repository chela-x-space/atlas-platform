import { getAiRadar } from "@/lib/ai-radar/ai-radar-service";
import { aggregateTimeline } from "@/lib/timeline/timeline-service";
import type { BreakingFilters,BreakingSnapshot } from "./breaking-contract";
import { filterBreakingEvents,generateBreakingSnapshot } from "./breaking-logic.mjs";

const TTL=60_000,STALE_TTL=5*60_000;
let cache:{snapshot:BreakingSnapshot;expiresAt:number;staleUntil:number}|null=null;
let pending:Promise<BreakingSnapshot>|null=null;

async function calculate():Promise<BreakingSnapshot>{
  const generatedAt=new Date().toISOString();
  const [timelineResult,aiResult]=await Promise.allSettled([aggregateTimeline(),getAiRadar()]);
  const timelineProviders=timelineResult.status==="fulfilled"?timelineResult.value.sourceStatus:["usgs-earthquakes","noaa-nhc","nasa-rss","esa-rss"].map(sourceId=>({sourceId,sourceName:sourceId,status:"unavailable" as const,stale:false,itemCount:0,checkedAt:generatedAt,errorCode:"SOURCE_UNAVAILABLE",errorMessage:"Timeline provider collection failed"}));
  const aiProviders=aiResult.status==="fulfilled"?aiResult.value.providers:[{id:"ai-radar",name:"AI Radar Providers",kind:"registry" as const,state:"unavailable" as const,checkedAt:generatedAt,itemCount:0,errorCode:"SOURCE_UNAVAILABLE",message:"AI Radar provider collection failed"}];
  return generateBreakingSnapshot({timelineItems:timelineResult.status==="fulfilled"?timelineResult.value.items:[],timelineProviders,aiReleases:aiResult.status==="fulfilled"?aiResult.value.releases:[],aiProviders},generatedAt);
}
export async function getBreakingSnapshot():Promise<BreakingSnapshot>{
  if(cache&&Date.now()<=cache.expiresAt)return cache.snapshot;
  if(pending)return pending;
  pending=calculate().then(snapshot=>{cache={snapshot,expiresAt:Date.now()+TTL,staleUntil:Date.now()+STALE_TTL};return snapshot}).catch(error=>{if(cache&&Date.now()<=cache.staleUntil)return{...cache.snapshot,partial:true,stale:true,servedAt:new Date().toISOString()};throw error}).finally(()=>{pending=null});
  return pending;
}
export async function getFilteredBreaking(filters:BreakingFilters){
  const snapshot=await getBreakingSnapshot();
  return{...snapshot,events:filterBreakingEvents(snapshot.events,filters)};
}
