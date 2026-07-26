import type { NextRequest } from "next/server";
import type { ProviderRuntimeDefinitionInput } from "@/lib/provider-runtime/provider-runtime-contracts";
import { authorizeProviderRuntime,runtimeActor,runtimeApiError,runtimeOk } from "@/lib/provider-runtime/internal-provider-runtime-api";
import { getProviderRuntime } from "@/lib/provider-runtime/provider-runtime-service";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){const denied=authorizeProviderRuntime(request);if(denied)return denied;try{return runtimeOk({runtimes:await getProviderRuntime().list()})}catch(error){return runtimeApiError(error)}}
export async function POST(request:NextRequest){const denied=authorizeProviderRuntime(request);if(denied)return denied;try{return runtimeOk({runtime:await getProviderRuntime().define(await request.json() as ProviderRuntimeDefinitionInput,runtimeActor(request))},201)}catch(error){return runtimeApiError(error)}}
