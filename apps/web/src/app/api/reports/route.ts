import {NextRequest,NextResponse} from "next/server";
import {parseReportQuery} from "@/lib/reports/report-engine.mjs";
import {getReport} from "@/lib/reports/report-service";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){const parsed=parseReportQuery(request.nextUrl.searchParams);if(!parsed.ok)return NextResponse.json({error:{code:parsed.code,message:parsed.message}},{status:400,headers:{"Cache-Control":"no-store"}});try{const value=await getReport(parsed.filters);return NextResponse.json(value,{status:value.degraded?206:200,headers:{"Cache-Control":value.stale?"private, no-store":"public, s-maxage=60, stale-while-revalidate=300","X-Atlas-Data-State":value.stale?"stale":value.degraded?"degraded":"complete"}})}catch{return NextResponse.json({error:{code:"REPORTS_UNAVAILABLE",message:"Verified canonical data is unavailable; no report was generated"}},{status:503,headers:{"Cache-Control":"no-store"}})}}
