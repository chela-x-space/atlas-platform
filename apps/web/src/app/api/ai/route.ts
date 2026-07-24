import { NextRequest,NextResponse } from "next/server";
import { filterTechnologies,parseRadarQuery } from "@/lib/ai-radar/ai-radar-logic.mjs";
import { getAiRadar } from "@/lib/ai-radar/ai-radar-service";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
  const parsed=parseRadarQuery(request.nextUrl.searchParams);
  if(!parsed.ok)return NextResponse.json({error:{code:parsed.code,message:parsed.message}},{status:400,headers:{"Cache-Control":"no-store"}});
  try{
    const snapshot=await getAiRadar(),{query}=parsed;
    const technologies=filterTechnologies(snapshot.technologies,query,snapshot.generatedAt).slice(0,query.limit);
    return NextResponse.json({...snapshot,technologies,releases:snapshot.releases.filter(item=>!query.technology||item.technologyId===query.technology).slice(0,query.limit),benchmarks:snapshot.benchmarks.filter(item=>(!query.technology||item.technologyId===query.technology)&&(!query.benchmark||item.benchmark.toLowerCase()===query.benchmark.toLowerCase())).slice(0,query.limit)},{status:snapshot.partial?206:200,headers:{"Cache-Control":snapshot.stale?"private, no-store":"public, s-maxage=300, stale-while-revalidate=1800","X-Atlas-Data-State":snapshot.stale?"stale":snapshot.partial?"partial":"complete"}});
  }catch{return NextResponse.json({error:{code:"AI_RADAR_UNAVAILABLE",message:"Verified AI technology data is temporarily unavailable"}},{status:503,headers:{"Cache-Control":"no-store"}})}
}
