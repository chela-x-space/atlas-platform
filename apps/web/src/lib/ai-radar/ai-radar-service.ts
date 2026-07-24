import type { RadarSnapshot } from "./ai-radar-contract";
import { AI_RADAR_VERSION } from "./ai-radar-contract";
import { stableRadarSort } from "./ai-radar-logic.mjs";
import { collectGithubReleases, collectSweBench } from "./ai-radar-providers";
import { VERIFIED_TECHNOLOGIES } from "./ai-radar-registry";

const TTL=5*60_000,STALE_TTL=30*60_000;
let cache:{snapshot:RadarSnapshot;expiresAt:number;staleUntil:number}|null=null;
let pending:Promise<RadarSnapshot>|null=null;

async function calculate():Promise<RadarSnapshot>{
  const generatedAt=new Date().toISOString();
  const [releaseResult,benchmarkResult]=await Promise.all([collectGithubReleases(generatedAt),collectSweBench(generatedAt)]);
  const registry={id:"official-registry",name:"ATLAS Verified Official Registry",kind:"registry" as const,state:"operational" as const,checkedAt:generatedAt,itemCount:VERIFIED_TECHNOLOGIES.length};
  const providers=[registry,releaseResult.provider,benchmarkResult.provider];
  return stableRadarSort({radarVersion:AI_RADAR_VERSION,generatedAt,partial:providers.some(provider=>provider.state!=="operational"),stale:false,providers,technologies:VERIFIED_TECHNOLOGIES,releases:releaseResult.items,benchmarks:benchmarkResult.items,inputSummary:{technologyCount:VERIFIED_TECHNOLOGIES.length,releaseCount:releaseResult.items.length,benchmarkCount:benchmarkResult.items.length,respondingProviders:providers.filter(provider=>provider.state!=="unavailable").length,failedProviders:providers.filter(provider=>provider.state==="unavailable").length}});
}

export async function getAiRadar():Promise<RadarSnapshot>{
  if(cache&&Date.now()<=cache.expiresAt)return cache.snapshot;
  if(pending)return pending;
  pending=calculate().then(snapshot=>{cache={snapshot,expiresAt:Date.now()+TTL,staleUntil:Date.now()+STALE_TTL};return snapshot;}).catch(error=>{
    if(cache&&Date.now()<=cache.staleUntil)return {...cache.snapshot,partial:true,stale:true,servedAt:new Date().toISOString()};
    throw error;
  }).finally(()=>{pending=null});
  return pending;
}
