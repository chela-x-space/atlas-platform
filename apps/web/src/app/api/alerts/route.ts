import {NextRequest,NextResponse} from "next/server";
import {parseAlertQuery} from "@/lib/alerts/alert-engine.mjs";
import {listAlerts} from "@/lib/alerts/alert-service";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){const parsed=parseAlertQuery(request.nextUrl.searchParams);if(!parsed.ok)return NextResponse.json({error:{code:parsed.code,message:parsed.message}},{status:400});try{const value=await listAlerts(parsed.filters);return NextResponse.json(value,{status:value.degraded?206:200,headers:{"Cache-Control":"no-store"}})}catch{return NextResponse.json({error:{code:"ALERTS_UNAVAILABLE",message:"Alert projections are temporarily unavailable"}},{status:503})}}
