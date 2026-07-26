import type { NextRequest } from "next/server";
import { MEDIA_RELATIONSHIPS } from "@/lib/evidence-media/evidence-media-contracts";
import type { MediaRelationship } from "@/lib/evidence-media/evidence-media-contracts";
import { authorizeEvidenceMedia,mediaError,mediaOk } from "@/lib/evidence-media/internal-evidence-media-api";
import { EvidenceMediaError,getEvidenceMedia } from "@/lib/evidence-media/evidence-media-service";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){const denied=authorizeEvidenceMedia(request);if(denied)return denied;try{const body=await request.json() as{recordId?:string;assetIds?:string[];relationship?:MediaRelationship};if(!body.recordId?.trim()||!Array.isArray(body.assetIds))throw new EvidenceMediaError("INVALID_MEDIA_BINDING","recordId and assetIds are required",400);const relationship=body.relationship??"EVIDENCE";if(!MEDIA_RELATIONSHIPS.includes(relationship))throw new EvidenceMediaError("INVALID_MEDIA_BINDING","Unsupported media relationship",400);return mediaOk({binding:await getEvidenceMedia().bind(body.recordId,body.assetIds,relationship)})}catch(error){return mediaError(error)}}
