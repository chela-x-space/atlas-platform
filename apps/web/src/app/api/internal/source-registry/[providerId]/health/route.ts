import type { NextRequest } from "next/server";
import { HEALTH_CHECK_OUTCOMES,type HealthCheckOutcome } from "@/lib/source-registry/source-registry-contracts";
import { authorizeSourceRegistry,registryActor,registryError,registryOk } from "@/lib/source-registry/internal-source-registry-api";
import { getSourceRegistry,SourceRegistryError } from "@/lib/source-registry/source-registry-service";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{providerId:string}>}){const denied=authorizeSourceRegistry(request);if(denied)return denied;try{const body=await request.json();if(!HEALTH_CHECK_OUTCOMES.includes(body?.outcome as HealthCheckOutcome))throw new SourceRegistryError("INVALID_HEALTH_OUTCOME","A supported health outcome is required",400);const registry=getSourceRegistry(),provider=await registry.recordHealth(decodeURIComponent((await params).providerId),{outcome:body.outcome,checkedAt:String(body.checkedAt??""),message:String(body.message??"")},registryActor(request));return registryOk({provider:registry.internalView(provider)})}catch(error){return registryError(error)}}
