import { aggregateTimeline } from "@/lib/timeline/timeline-service";
import type { RiskFilters,RiskSnapshot } from "./risk-contracts";
import { filterRiskAlerts,generateRiskSnapshot } from "./risk-engine.mjs";

const TTL=60_000,STALE_TTL=5*60_000,CACHE_KEY="atlas-risk-v1.1:timeline";
let cache:{key:string;snapshot:RiskSnapshot;expiresAt:number;staleUntil:number}|null=null;
let pending:Promise<RiskSnapshot>|null=null;

async function calculate():Promise<RiskSnapshot>{
  const timeline=await aggregateTimeline();
  return generateRiskSnapshot({items:timeline.items,providers:timeline.sourceStatus},new Date().toISOString());
}
export async function getRiskSnapshot():Promise<RiskSnapshot>{
  const now=Date.now();
  if(cache?.key===CACHE_KEY&&now<=cache.expiresAt)return cache.snapshot;
  if(pending)return pending;
  pending=calculate().then(snapshot=>{const storedAt=Date.now();cache={key:CACHE_KEY,snapshot,expiresAt:storedAt+TTL,staleUntil:storedAt+STALE_TTL};return snapshot}).catch(error=>{
    if(cache?.key===CACHE_KEY&&Date.now()<=cache.staleUntil){
      const evaluatedAt=new Date().toISOString();
      return{...cache.snapshot,evaluatedAt,degraded:true,stale:true,summary:{...cache.snapshot.summary,evaluatedAt,degraded:true,stale:true}};
    }
    throw error;
  }).finally(()=>{pending=null});
  return pending;
}
export async function getRiskAlerts(filters:RiskFilters){
  const snapshot=await getRiskSnapshot();
  return{...snapshot,alerts:filterRiskAlerts(snapshot.alerts,filters)};
}
