import type { NextRequest } from "next/server";
import { LIFECYCLE_STATUSES,type LifecycleStatus } from "@/lib/source-registry/source-registry-contracts";
import { authorizeSourceRegistry,registryActor,registryError,registryOk } from "@/lib/source-registry/internal-source-registry-api";
import { getSourceRegistry,SourceRegistryError } from "@/lib/source-registry/source-registry-service";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{providerId:string}>}){const denied=authorizeSourceRegistry(request);if(denied)return denied;try{const body=await request.json();if(!LIFECYCLE_STATUSES.includes(body?.status as LifecycleStatus))throw new SourceRegistryError("INVALID_LIFECYCLE_STATUS","A supported lifecycle status is required",400);const registry=getSourceRegistry(),provider=await registry.transition(decodeURIComponent((await params).providerId),body.status,registryActor(request));return registryOk({provider:registry.internalView(provider)})}catch(error){return registryError(error)}}
