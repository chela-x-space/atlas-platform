import type { NextRequest } from "next/server";
import { authorizeEvidenceMedia,mediaActor,mediaError,mediaOk } from "@/lib/evidence-media/internal-evidence-media-api";
import { getEvidenceMedia } from "@/lib/evidence-media/evidence-media-service";
export const dynamic="force-dynamic";
type Context={params:Promise<{assetId:string}>};
export async function POST(request:NextRequest,{params}:Context){const denied=authorizeEvidenceMedia(request);if(denied)return denied;try{const body=await request.json() as{reason?:string},media=getEvidenceMedia(),asset=await media.disable(decodeURIComponent((await params).assetId),body.reason??"",mediaActor(request));return mediaOk({asset:media.internalView(asset)})}catch(error){return mediaError(error)}}
