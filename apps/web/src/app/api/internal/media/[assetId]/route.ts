import type { NextRequest } from "next/server";
import { authorizeEvidenceMedia,mediaActor,mediaError,mediaOk } from "@/lib/evidence-media/internal-evidence-media-api";
import { getEvidenceMedia } from "@/lib/evidence-media/evidence-media-service";
export const dynamic="force-dynamic";
type Context={params:Promise<{assetId:string}>};
export async function GET(request:NextRequest,{params}:Context){const denied=authorizeEvidenceMedia(request);if(denied)return denied;try{const media=getEvidenceMedia(),asset=await media.require(decodeURIComponent((await params).assetId));return mediaOk({asset:media.internalView(asset)})}catch(error){return mediaError(error)}}
export async function PATCH(request:NextRequest,{params}:Context){const denied=authorizeEvidenceMedia(request);if(denied)return denied;try{const media=getEvidenceMedia(),asset=await media.update(decodeURIComponent((await params).assetId),await request.json(),mediaActor(request));return mediaOk({asset:media.internalView(asset)})}catch(error){return mediaError(error)}}
