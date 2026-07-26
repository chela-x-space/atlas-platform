import type { NextRequest } from "next/server";
import { authorizeSourceRegistry,registryActor,registryError,registryOk } from "@/lib/source-registry/internal-source-registry-api";
import { getSourceRegistry } from "@/lib/source-registry/source-registry-service";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{providerId:string}>}){const denied=authorizeSourceRegistry(request);if(denied)return denied;try{const body=await request.json(),registry=getSourceRegistry(),provider=await registry.suspend(decodeURIComponent((await params).providerId),String(body?.reason??""),registryActor(request));return registryOk({provider:registry.internalView(provider)})}catch(error){return registryError(error)}}
