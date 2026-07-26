import type { NextRequest } from "next/server";
import { authorizeSourceRegistry,registryError,registryOk } from "@/lib/source-registry/internal-source-registry-api";
import { getSourceRegistry } from "@/lib/source-registry/source-registry-service";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{providerId:string}>}){const denied=authorizeSourceRegistry(request);if(denied)return denied;try{const registry=getSourceRegistry(),history=await registry.history(decodeURIComponent((await params).providerId));return registryOk({history:history.map(version=>({...version,provider:registry.internalView(version.provider)}))})}catch(error){return registryError(error)}}
