import {NextRequest,NextResponse} from "next/server";
import {parseRiskQuery} from "@/lib/risk/risk-engine.mjs";
import {getRiskAlerts} from "@/lib/risk/risk-service";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
  const parsed=parseRiskQuery(request.nextUrl.searchParams);
  if(!parsed.ok)return NextResponse.json({error:{code:parsed.code,message:parsed.message}},{status:400,headers:{"Cache-Control":"no-store"}});
  try{const snapshot=await getRiskAlerts(parsed.filters);return NextResponse.json(snapshot,{status:snapshot.degraded?206:200,headers:{"Cache-Control":snapshot.stale?"private, no-store":"public, s-maxage=60, stale-while-revalidate=300","X-Atlas-Data-State":snapshot.stale?"stale":snapshot.degraded?"degraded":"complete"}})}
  catch{return NextResponse.json({error:{code:"RISK_UNAVAILABLE",message:"Verified canonical events are unavailable; no risk classifications were produced"}},{status:503,headers:{"Cache-Control":"no-store"}})}
}
