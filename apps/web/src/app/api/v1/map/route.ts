/* eslint-disable @typescript-eslint/no-explicit-any */
import {getBreakingSnapshot} from "@/lib/breaking/breaking-service";import {ok,fail} from "@/lib/api/v1-api";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{const value=await getBreakingSnapshot();const events=value.events.filter((event:any)=>event.latitude!==null&&event.longitude!==null);return ok(request,{events},{generatedAt:value.generatedAt,degraded:Boolean(value.partial),stale:Boolean(value.stale),status:value.partial?206:200})}catch{return fail(request,"MAP_UNAVAILABLE","Verified map events are unavailable",503)}}
