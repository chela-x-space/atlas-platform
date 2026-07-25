import {NextResponse} from "next/server";
import {getRiskSnapshot} from "@/lib/risk/risk-service";
export const dynamic="force-dynamic";
export async function GET(){try{const value=await getRiskSnapshot();return NextResponse.json({riskVersion:value.riskVersion,...value.summary},{status:value.degraded?206:200,headers:{"Cache-Control":value.stale?"private, no-store":"public, s-maxage=60, stale-while-revalidate=300","X-Atlas-Data-State":value.stale?"stale":value.degraded?"degraded":"complete"}})}catch{return NextResponse.json({error:{code:"RISK_SUMMARY_UNAVAILABLE",message:"Verified risk summary is unavailable"}},{status:503,headers:{"Cache-Control":"no-store"}})}}
