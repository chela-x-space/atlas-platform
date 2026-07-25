import {NextResponse} from "next/server";
import {getWatchlistSnapshot} from "@/lib/watchlists/watchlist-service";
export const dynamic="force-dynamic";
export async function GET(){try{const value=await getWatchlistSnapshot();return NextResponse.json({summary:value.summary,status:value.status},{status:value.status.degraded?206:200})}catch{return NextResponse.json({error:{code:"WATCHLISTS_UNAVAILABLE",message:"Watchlist summary is temporarily unavailable"}},{status:503})}}
