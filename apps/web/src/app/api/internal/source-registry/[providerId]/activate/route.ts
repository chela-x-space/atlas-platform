import type { NextRequest } from "next/server";
import { authorizeSourceRegistry,registryActor,registryError,registryOk } from "@/lib/source-registry/internal-source-registry-api";
import { getSourceRegistry } from "@/lib/source-registry/source-registry-service";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{providerId:string}>}){const denied=authorizeSourceRegistry(request);if(denied)return denied;try{const registry=getSourceRegistry(),provider=await registry.activate(decodeURIComponent((await params).providerId),registryActor(request));return registryOk({provider:registry.internalView(provider)})}catch(error){return registryError(error)}}
