import {NextResponse} from "next/server";
import {getBreakingSnapshot} from "@/lib/breaking/breaking-service";
export const dynamic="force-dynamic";
export async function GET(){try{const snapshot=await getBreakingSnapshot();return NextResponse.json({breakingVersion:snapshot.breakingVersion,generatedAt:snapshot.generatedAt,partial:snapshot.partial,stale:snapshot.stale,providers:snapshot.providers},{status:snapshot.partial?206:200,headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=300"}})}catch{return NextResponse.json({error:{code:"BREAKING_PROVIDERS_UNAVAILABLE",message:"Breaking provider health is temporarily unavailable"}},{status:503})}}
