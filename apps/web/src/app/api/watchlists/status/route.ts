import {NextResponse} from "next/server";
import {getWatchlistSnapshot} from "@/lib/watchlists/watchlist-service";
export const dynamic="force-dynamic";
export async function GET(){try{const value=await getWatchlistSnapshot();return NextResponse.json(value.status,{status:value.status.degraded?206:200})}catch{return NextResponse.json({watchlistVersion:"atlas-watchlists-v1.5",ready:false,storage:"process-local",canonicalIndexReady:false,indexedDocumentCount:0,degraded:true,warnings:["Canonical search index unavailable"],generatedAt:new Date().toISOString()},{status:503})}}
