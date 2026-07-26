import type { LifecycleStatus,ProviderFilter,ProviderHealthCheck,ProviderValidationResult,ProviderVersionAction,SourceProvider,SourceProviderInput } from "./source-registry-contracts";
import type { SourceRegistryStore } from "./source-registry-store";
import { JsonFileSourceRegistryStore } from "./source-registry-store";
import { applyHealthCheck,canTransitionProvider,filterProviders,toInternalProviderView,toPublicSourceEntry,validateProvider,validateProviderUniqueness } from "./source-registry-logic.mjs";

export class SourceRegistryError extends Error {
  constructor(public readonly code:string,message:string,public readonly status:number,public readonly details?:unknown){super(message)}
}

type ProviderPatch = Partial<Omit<SourceProvider,"providerId"|"slug"|"version"|"createdAt"|"updatedAt"|"createdBy"|"updatedBy"|"lifecycleStatus"|"activationStatus"|"healthStatus"|"lastSuccessfulCollectionAt"|"lastFailedCollectionAt"|"consecutiveFailureCount"|"lastHealthCheckAt"|"lastHealthCheckOutcome"|"lastHealthMessage">>;

export class SourceRegistryService {
  constructor(private readonly store:SourceRegistryStore,private readonly now:()=>string=()=>new Date().toISOString()){}
  async list(filters:ProviderFilter={}){return filterProviders(await this.store.list(),filters)}
  async get(providerId:string){return this.store.get(providerId)}
  async require(providerId:string){const provider=await this.get(providerId);if(!provider)throw new SourceRegistryError("PROVIDER_NOT_FOUND","Provider was not found",404);return provider}
  async history(providerId:string){await this.require(providerId);return this.store.history(providerId)}
  validate(provider:Partial<SourceProvider>,forActivation=false):ProviderValidationResult{return validateProvider(provider,{forActivation})}
  private async ensureUnique(providerId:string,slug:string){
    const issues=validateProviderUniqueness({providerId,slug},await this.store.list());
    if(issues.length)throw new SourceRegistryError(issues[0].code,issues[0].message,409,issues);
  }
  private async persist(provider:SourceProvider,action:ProviderVersionAction,actor:string){return this.store.save(provider,action,actor)}
  async register(input:SourceProviderInput,actor:string){
    await this.ensureUnique(input.providerId,input.slug);
    const timestamp=this.now();
    const provider:SourceProvider={...structuredClone(input),healthStatus:input.lifecycleStatus==="SUSPENDED"||input.lifecycleStatus==="RETIRED"?"DISABLED":"UNKNOWN",lastSuccessfulCollectionAt:null,lastFailedCollectionAt:null,consecutiveFailureCount:0,lastHealthCheckAt:null,lastHealthCheckOutcome:null,lastHealthMessage:null,version:1,createdAt:timestamp,updatedAt:timestamp,createdBy:actor,updatedBy:actor};
    const result=this.validate(provider);
    if(!result.valid)throw new SourceRegistryError("PROVIDER_VALIDATION_FAILED","Provider registration failed validation",400,result.issues);
    if(provider.lifecycleStatus!=="DRAFT"||provider.activationStatus!=="REGISTERED")throw new SourceRegistryError("INVALID_INITIAL_STATE","New providers must begin as DRAFT and REGISTERED",400);
    return this.persist(provider,"CREATED",actor);
  }
  async update(providerId:string,patch:ProviderPatch,actor:string){
    const current=await this.require(providerId);
    const candidate=structuredClone(patch) as Record<string,unknown>;
    for(const field of ["providerId","slug","version","createdAt","updatedAt","createdBy","updatedBy","lifecycleStatus","activationStatus","healthStatus","lastSuccessfulCollectionAt","lastFailedCollectionAt","consecutiveFailureCount","lastHealthCheckAt","lastHealthCheckOutcome","lastHealthMessage"])delete candidate[field];
    const next={...current,...candidate,providerId:current.providerId,slug:current.slug,version:current.version+1,createdAt:current.createdAt,createdBy:current.createdBy,updatedAt:this.now(),updatedBy:actor} as SourceProvider;
    const result=this.validate(next);
    if(!result.valid)throw new SourceRegistryError("PROVIDER_VALIDATION_FAILED","Provider update failed validation",400,result.issues);
    return this.persist(next,"UPDATED",actor);
  }
  async transition(providerId:string,to:LifecycleStatus,actor:string){
    const current=await this.require(providerId);
    if(to==="ACTIVE")return this.activate(providerId,actor);
    if(to==="SUSPENDED")return this.suspend(providerId,"Suspended by registry administrator",actor);
    if(to==="RETIRED")return this.retire(providerId,actor);
    if(!canTransitionProvider(current.lifecycleStatus,to))throw new SourceRegistryError("INVALID_LIFECYCLE_TRANSITION",`Cannot transition ${current.lifecycleStatus} to ${to}`,409);
    const next={...current,lifecycleStatus:to,activationStatus:to==="APPROVED"?"APPROVED":current.activationStatus,version:current.version+1,updatedAt:this.now(),updatedBy:actor};
    return this.persist(next,"LIFECYCLE_TRANSITION",actor);
  }
  async activate(providerId:string,actor:string){
    const current=await this.require(providerId),result=this.validate(current,true);
    if(!result.activationEligible)throw new SourceRegistryError("ACTIVATION_VALIDATION_FAILED","Provider cannot be activated",409,result.issues);
    if(!canTransitionProvider(current.lifecycleStatus,"ACTIVE"))throw new SourceRegistryError("INVALID_LIFECYCLE_TRANSITION",`Cannot transition ${current.lifecycleStatus} to ACTIVE`,409);
    const next={...current,lifecycleStatus:"ACTIVE" as const,activationStatus:"ACTIVE" as const,healthStatus:"UNKNOWN" as const,version:current.version+1,updatedAt:this.now(),updatedBy:actor};
    return this.persist(next,"ACTIVATED",actor);
  }
  async suspend(providerId:string,reason:string,actor:string){
    const current=await this.require(providerId);
    if(!canTransitionProvider(current.lifecycleStatus,"SUSPENDED"))throw new SourceRegistryError("INVALID_LIFECYCLE_TRANSITION",`Cannot transition ${current.lifecycleStatus} to SUSPENDED`,409);
    if(!reason.trim())throw new SourceRegistryError("SUSPENSION_REASON_REQUIRED","Suspension requires a reason",400);
    const next={...current,lifecycleStatus:"SUSPENDED" as const,activationStatus:"APPROVED" as const,healthStatus:"DISABLED" as const,disabledReason:reason.trim(),version:current.version+1,updatedAt:this.now(),updatedBy:actor};
    return this.persist(next,"SUSPENDED",actor);
  }
  async retire(providerId:string,actor:string){
    const current=await this.require(providerId);
    if(!canTransitionProvider(current.lifecycleStatus,"RETIRED"))throw new SourceRegistryError("INVALID_LIFECYCLE_TRANSITION",`Cannot transition ${current.lifecycleStatus} to RETIRED`,409);
    const next={...current,lifecycleStatus:"RETIRED" as const,activationStatus:"REGISTERED" as const,healthStatus:"DISABLED" as const,disabledReason:current.disabledReason??"Provider retired",version:current.version+1,updatedAt:this.now(),updatedBy:actor};
    return this.persist(next,"RETIRED",actor);
  }
  async recordHealth(providerId:string,check:ProviderHealthCheck,actor:string){
    const current=await this.require(providerId);
    if(current.lifecycleStatus!=="ACTIVE")throw new SourceRegistryError("HEALTH_CHECK_NOT_ALLOWED","Health may be recorded only for active providers",409);
    if(!Number.isFinite(Date.parse(check.checkedAt))||!check.message.trim())throw new SourceRegistryError("INVALID_HEALTH_CHECK","Health check requires a timestamp and message",400);
    const next={...applyHealthCheck(current,check),version:current.version+1,updatedAt:this.now(),updatedBy:actor};
    return this.persist(next,"HEALTH_RECORDED",actor);
  }
  internalView(provider:SourceProvider){return toInternalProviderView(provider)}
  publicDirectory(providers:readonly SourceProvider[]){return providers.map(toPublicSourceEntry).filter(entry=>entry!==null)}
}

let registry:SourceRegistryService|undefined;
export function getSourceRegistry(){return registry??=new SourceRegistryService(new JsonFileSourceRegistryStore())}
