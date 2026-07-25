import {getAiRadar} from "@/lib/ai-radar/ai-radar-service";
import {getBreakingSnapshot} from "@/lib/breaking/breaking-service";
import {REPORT_TYPES} from "@/lib/reports/report-engine.mjs";
import {getRiskSnapshot} from "@/lib/risk/risk-service";
import type {SearchIndex,SearchResponse,SearchFilters} from "./search-contracts";
import {SEARCH_VERSION} from "./search-contracts";
import {withSearchCache} from "./search-cache.mjs";
import {searchIndex} from "./search-engine.mjs";
import {buildSearchIndex} from "./search-index.mjs";
const KEY="atlas-search-v1.3:canonical-projections";
export async function getSearchIndex():Promise<SearchIndex>{return withSearchCache(KEY,60_000,5*60_000,async()=>{const generatedAt=new Date().toISOString(),[risk,breaking,radar]=await Promise.allSettled([getRiskSnapshot(),getBreakingSnapshot(),getAiRadar()]),degradedModules=[];if(risk.status==="rejected")degradedModules.push("risk");if(breaking.status==="rejected")degradedModules.push("breaking");if(radar.status==="rejected")degradedModules.push("ai-radar");return buildSearchIndex({risk:risk.status==="fulfilled"?risk.value:null,breaking:breaking.status==="fulfilled"?breaking.value:null,radar:radar.status==="fulfilled"?radar.value:null,reportTypes:REPORT_TYPES,generatedAt,degradedModules})})}
export async function executeSearch(filters:SearchFilters):Promise<SearchResponse>{const index=await getSearchIndex(),result=searchIndex(index,filters),degraded=index.status.degradedModules.length>0;return{searchVersion:SEARCH_VERSION,...result,generatedAt:index.status.generatedAt,indexStatus:index.status,degraded,warnings:index.status.warnings}}
