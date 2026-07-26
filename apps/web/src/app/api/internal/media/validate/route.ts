import type { NextRequest } from "next/server";
import { authorizeEvidenceMedia,mediaError,mediaOk } from "@/lib/evidence-media/internal-evidence-media-api";
import { getEvidenceMedia } from "@/lib/evidence-media/evidence-media-service";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){const denied=authorizeEvidenceMedia(request);if(denied)return denied;try{return mediaOk({validation:await getEvidenceMedia().validate(await request.json())})}catch(error){return mediaError(error)}}
