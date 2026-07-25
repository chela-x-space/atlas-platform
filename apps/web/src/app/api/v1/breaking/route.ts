import {NextRequest} from "next/server";import {getBreakingSnapshot} from "@/lib/breaking/breaking-service";import {ok,fail} from "@/lib/api/v1-api";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){try{const value=await getBreakingSnapshot();return ok(request,{events:value.events,providers:value.providers},{generatedAt:value.generatedAt,degraded:Boolean(value.partial),stale:Boolean(value.stale),status:value.partial?206:200})}catch{return fail(request,"BREAKING_UNAVAILABLE","Verified breaking intelligence is unavailable",503)}}
