import {NextResponse} from "next/server";
import {getWatchlist} from "@/lib/watchlists/watchlist-service";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{watchlistId:string}>}){const {watchlistId}=await params;try{const value=await getWatchlist(watchlistId);return value?NextResponse.json({watchlist:value.watchlist,matches:value.matches,status:value.status},{status:value.status.degraded?206:200}):NextResponse.json({error:{code:"WATCHLIST_NOT_FOUND",message:"Watchlist was not found"}},{status:404})}catch{return NextResponse.json({error:{code:"WATCHLISTS_UNAVAILABLE",message:"Watchlist matching is temporarily unavailable"}},{status:503})}}
