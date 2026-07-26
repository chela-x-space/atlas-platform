import type { NextRequest } from "next/server";
import { MEDIA_ORIGINS,MEDIA_STATUSES,MEDIA_TYPES } from "@/lib/evidence-media/evidence-media-contracts";
import type { MediaAssetInput,MediaFilter,MediaOrigin,MediaStatus,MediaType } from "@/lib/evidence-media/evidence-media-contracts";
import { authorizeEvidenceMedia,mediaActor,mediaError,mediaOk } from "@/lib/evidence-media/internal-evidence-media-api";
import { EvidenceMediaError,getEvidenceMedia } from "@/lib/evidence-media/evidence-media-service";
export const dynamic="force-dynamic";

function filters(params:URLSearchParams):MediaFilter{
  const mediaType=params.get("mediaType"),status=params.get("status"),origin=params.get("origin"),publicValue=params.get("publicDisplayEligible");
  if(mediaType&&!MEDIA_TYPES.includes(mediaType as MediaType))throw new EvidenceMediaError("INVALID_FILTER","Unsupported mediaType filter",400);
  if(status&&!MEDIA_STATUSES.includes(status as MediaStatus))throw new EvidenceMediaError("INVALID_FILTER","Unsupported status filter",400);
  if(origin&&!MEDIA_ORIGINS.includes(origin as MediaOrigin))throw new EvidenceMediaError("INVALID_FILTER","Unsupported origin filter",400);
  if(publicValue&&!["true","false"].includes(publicValue))throw new EvidenceMediaError("INVALID_FILTER","publicDisplayEligible must be true or false",400);
  return{...(params.get("providerId")?{providerId:params.get("providerId")!}:{}),...(mediaType?{mediaType:mediaType as MediaType}:{}),...(status?{status:status as MediaStatus}:{}),...(origin?{origin:origin as MediaOrigin}:{}),...(publicValue?{publicDisplayEligible:publicValue==="true"}:{})};
}
export async function GET(request:NextRequest){const denied=authorizeEvidenceMedia(request);if(denied)return denied;try{const media=getEvidenceMedia(),assets=await media.list(filters(request.nextUrl.searchParams));return mediaOk({assets:assets.map(asset=>media.internalView(asset)),total:assets.length})}catch(error){return mediaError(error)}}
export async function POST(request:NextRequest){const denied=authorizeEvidenceMedia(request);if(denied)return denied;try{const media=getEvidenceMedia(),asset=await media.register(await request.json() as MediaAssetInput,mediaActor(request));return mediaOk({asset:media.internalView(asset)},201)}catch(error){return mediaError(error)}}
