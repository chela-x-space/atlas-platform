import { NextRequest,NextResponse } from "next/server";
import { parseRadarQuery } from "@/lib/ai-radar/ai-radar-logic.mjs";
import { getAiRadar } from "@/lib/ai-radar/ai-radar-service";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
  const parsed=parseRadarQuery(request.nextUrl.searchParams);if(!parsed.ok)return NextResponse.json({error:{code:parsed.code,message:parsed.message}},{status:400});
  try{const snapshot=await getAiRadar(),items=snapshot.benchmarks.filter(item=>(!parsed.query.technology||item.technologyId===parsed.query.technology)&&(!parsed.query.benchmark||item.benchmark.toLowerCase()===parsed.query.benchmark.toLowerCase())).slice(0,parsed.query.limit);return NextResponse.json({radarVersion:snapshot.radarVersion,generatedAt:snapshot.generatedAt,partial:snapshot.partial,stale:snapshot.stale,providers:snapshot.providers,items},{status:snapshot.partial?206:200,headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=1800"}})}catch{return NextResponse.json({error:{code:"BENCHMARKS_UNAVAILABLE",message:"Verified benchmark data is temporarily unavailable"}},{status:503})}
}
