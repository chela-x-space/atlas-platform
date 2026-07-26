import type { NextRequest } from "next/server";
import { authorizeEvidenceMedia,mediaError,mediaOk } from "@/lib/evidence-media/internal-evidence-media-api";
import { EvidenceMediaError,getEvidenceMedia } from "@/lib/evidence-media/evidence-media-service";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){const denied=authorizeEvidenceMedia(request);if(denied)return denied;try{const body=await request.json() as{recordId?:string};if(!body.recordId?.trim())throw new EvidenceMediaError("RECORD_ID_REQUIRED","Selection preview requires recordId",400);return mediaOk({selection:await getEvidenceMedia().safeSelection(body.recordId)})}catch(error){return mediaError(error)}}
