import type { NextRequest } from "next/server";
import { authorizeProviderRuntime,runtimeActor,runtimeApiError,runtimeOk } from "@/lib/provider-runtime/internal-provider-runtime-api";
import { getProviderRuntime } from "@/lib/provider-runtime/provider-runtime-service";
export const dynamic="force-dynamic";type Context={params:Promise<{providerId:string}>};
export async function GET(request:NextRequest,{params}:Context){const denied=authorizeProviderRuntime(request);if(denied)return denied;try{return runtimeOk(await getProviderRuntime().details(decodeURIComponent((await params).providerId)))}catch(error){return runtimeApiError(error)}}
export async function PATCH(request:NextRequest,{params}:Context){const denied=authorizeProviderRuntime(request);if(denied)return denied;try{return runtimeOk({runtime:await getProviderRuntime().update(decodeURIComponent((await params).providerId),await request.json(),runtimeActor(request))})}catch(error){return runtimeApiError(error)}}
