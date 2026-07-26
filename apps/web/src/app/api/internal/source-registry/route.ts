import type { NextRequest } from "next/server";
import { PROVIDER_TYPES,TRUST_LEVELS,LIFECYCLE_STATUSES,HEALTH_STATUSES } from "@/lib/source-registry/source-registry-contracts";
import type { AtlasEventCategory } from "@/types/atlas-data";
import type { ProviderFilter,ProviderType,TrustLevel,LifecycleStatus,HealthStatus,SourceProviderInput } from "@/lib/source-registry/source-registry-contracts";
import { authorizeSourceRegistry,registryActor,registryError,registryOk } from "@/lib/source-registry/internal-source-registry-api";
import { getSourceRegistry,SourceRegistryError } from "@/lib/source-registry/source-registry-service";

export const dynamic="force-dynamic";
const categories=new Set<AtlasEventCategory>(["earthquake","cyclone","weather","climate","space","science","earth-observation","technology","news","health","wildfire","flood","volcano","conflict","aviation","marine","market","cyber","energy","unknown"]);

function filters(params:URLSearchParams):ProviderFilter{
  const providerType=params.get("providerType"),category=params.get("category"),trustLevel=params.get("trustLevel"),lifecycleStatus=params.get("lifecycleStatus"),healthStatus=params.get("healthStatus"),publicValue=params.get("publicDisplayEligible");
  if(providerType&&!PROVIDER_TYPES.includes(providerType as ProviderType))throw new SourceRegistryError("INVALID_FILTER","Unsupported providerType filter",400);
  if(category&&!categories.has(category as AtlasEventCategory))throw new SourceRegistryError("INVALID_FILTER","Unsupported category filter",400);
  if(trustLevel&&!TRUST_LEVELS.includes(trustLevel as TrustLevel))throw new SourceRegistryError("INVALID_FILTER","Unsupported trustLevel filter",400);
  if(lifecycleStatus&&!LIFECYCLE_STATUSES.includes(lifecycleStatus as LifecycleStatus))throw new SourceRegistryError("INVALID_FILTER","Unsupported lifecycleStatus filter",400);
  if(healthStatus&&!HEALTH_STATUSES.includes(healthStatus as HealthStatus))throw new SourceRegistryError("INVALID_FILTER","Unsupported healthStatus filter",400);
  if(publicValue&&!["true","false"].includes(publicValue))throw new SourceRegistryError("INVALID_FILTER","publicDisplayEligible must be true or false",400);
  return{...(providerType?{providerType:providerType as ProviderType}:{}),...(category?{category:category as AtlasEventCategory}:{}),...(trustLevel?{trustLevel:trustLevel as TrustLevel}:{}),...(lifecycleStatus?{lifecycleStatus:lifecycleStatus as LifecycleStatus}:{}),...(healthStatus?{healthStatus:healthStatus as HealthStatus}:{}),...(params.get("geographicCoverage")?{geographicCoverage:params.get("geographicCoverage")!}:{}),...(params.get("language")?{language:params.get("language")!}:{}),...(publicValue?{publicDisplayEligible:publicValue==="true"}:{})};
}

export async function GET(request:NextRequest){const denied=authorizeSourceRegistry(request);if(denied)return denied;try{const registry=getSourceRegistry(),providers=await registry.list(filters(request.nextUrl.searchParams));return registryOk({providers:providers.map(provider=>registry.internalView(provider)),total:providers.length})}catch(error){return registryError(error)}}
export async function POST(request:NextRequest){const denied=authorizeSourceRegistry(request);if(denied)return denied;try{const registry=getSourceRegistry(),provider=await registry.register(await request.json() as SourceProviderInput,registryActor(request));return registryOk({provider:registry.internalView(provider)},201)}catch(error){return registryError(error)}}
