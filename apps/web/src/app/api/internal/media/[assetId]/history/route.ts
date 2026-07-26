import type { NextRequest } from "next/server";
import { authorizeEvidenceMedia,mediaError,mediaOk } from "@/lib/evidence-media/internal-evidence-media-api";
import { getEvidenceMedia } from "@/lib/evidence-media/evidence-media-service";
export const dynamic="force-dynamic";
type Context={params:Promise<{assetId:string}>};
export async function GET(request:NextRequest,{params}:Context){const denied=authorizeEvidenceMedia(request);if(denied)return denied;try{const media=getEvidenceMedia(),history=await media.history(decodeURIComponent((await params).assetId));return mediaOk({history:history.map(version=>({...version,asset:media.internalView(version.asset)}))})}catch(error){return mediaError(error)}}
