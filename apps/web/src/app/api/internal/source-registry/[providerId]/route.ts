import type { NextRequest } from "next/server";
import { authorizeSourceRegistry,registryActor,registryError,registryOk } from "@/lib/source-registry/internal-source-registry-api";
import { getSourceRegistry } from "@/lib/source-registry/source-registry-service";
export const dynamic="force-dynamic";
type Context={params:Promise<{providerId:string}>};
export async function GET(request:NextRequest,{params}:Context){const denied=authorizeSourceRegistry(request);if(denied)return denied;try{const registry=getSourceRegistry(),provider=await registry.require(decodeURIComponent((await params).providerId));return registryOk({provider:registry.internalView(provider)})}catch(error){return registryError(error)}}
export async function PATCH(request:NextRequest,{params}:Context){const denied=authorizeSourceRegistry(request);if(denied)return denied;try{const registry=getSourceRegistry(),provider=await registry.update(decodeURIComponent((await params).providerId),await request.json(),registryActor(request));return registryOk({provider:registry.internalView(provider)})}catch(error){return registryError(error)}}
