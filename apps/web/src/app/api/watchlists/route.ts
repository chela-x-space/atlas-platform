import {NextRequest,NextResponse} from "next/server";
import {WATCHLIST_TARGET_TYPES} from "@/lib/watchlists/watchlist-contracts";
import {createWatchlist} from "@/lib/watchlists/watchlist-store.mjs";
import {getWatchlistSnapshot} from "@/lib/watchlists/watchlist-service";
export const dynamic="force-dynamic";
export async function GET(){try{const value=await getWatchlistSnapshot();return NextResponse.json(value,{status:value.status.degraded?206:200,headers:{"Cache-Control":"no-store"}})}catch{return NextResponse.json({error:{code:"WATCHLISTS_UNAVAILABLE",message:"Watchlist matching is temporarily unavailable"}},{status:503})}}
export async function POST(request:NextRequest){try{const body=await request.json(),target=body?.target;if(!target||!WATCHLIST_TARGET_TYPES.includes(target.type))return NextResponse.json({error:{code:"INVALID_TARGET",message:"A supported watchlist target is required"}},{status:400});const item=createWatchlist(body);return item?NextResponse.json(item,{status:201}):NextResponse.json({error:{code:"INVALID_WATCHLIST",message:"Name and target value are required"}},{status:400})}catch{return NextResponse.json({error:{code:"INVALID_JSON",message:"Request body must be valid JSON"}},{status:400})}}
