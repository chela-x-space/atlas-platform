import {getAiRadar} from "@/lib/ai-radar/ai-radar-service";import {ok,fail} from "@/lib/api/v1-api";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{const value=await getAiRadar();return ok(request,{technologies:value.technologies,releases:value.releases,benchmarks:value.benchmarks,providers:value.providers},{generatedAt:value.generatedAt,degraded:Boolean(value.partial),stale:Boolean(value.stale),status:value.partial?206:200})}catch{return fail(request,"RADAR_UNAVAILABLE","Verified AI Radar data is unavailable",503)}}
