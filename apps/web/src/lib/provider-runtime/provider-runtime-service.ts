import { randomUUID } from "node:crypto";
import type { SourceProvider } from "@/lib/source-registry/source-registry-contracts";
import { getSourceRegistry } from "@/lib/source-registry/source-registry-service";
import type { CollectorCapability,ProviderCollectorBinding,ProviderCollectorBindingInput,ProviderExecutionAttempt,ProviderRuntimeDefinition,ProviderRuntimeDefinitionInput,ProviderRuntimeEventType,ProviderRuntimeState,RuntimeTickSummary } from "./provider-runtime-contracts";
import type { ProviderRuntimeDocument,ProviderRuntimeStore } from "./provider-runtime-store";
import { JsonFileProviderRuntimeStore } from "./provider-runtime-store";
import { getProviderCollectorRegistry,ProviderCollectorRegistry } from "./provider-collector-registry";
import { calculateHealth,evaluateConcurrency,evaluateRateLimit,evaluateRegistryEligibility,isDue,nextScheduleTime,retryDecision,runtimeError,safeRuntimeProjection,validateCollectorBinding,validateRuntimeDefinition,validateRuntimeTransition } from "./provider-runtime-logic.mjs";

export class ProviderRuntimeError extends Error {
  constructor(public readonly code:string,message:string,public readonly status:number,public readonly details?:unknown){super(message)}
}
export interface RuntimeProviderResolver { get(providerId:string):Promise<SourceProvider|null> }
type ExecuteOptions={bindingId?:string;trigger?:"MANUAL"|"SCHEDULED"|"RETRY";actor:string;correlationId?:string;ownerId?:string;attemptNumber?:number;requireDue?:boolean};
function assertFields(value:unknown,allowed:readonly string[],label:string){
  if(!value||typeof value!=="object"||Array.isArray(value))throw new ProviderRuntimeError("INVALID_POLICY",`${label} must be an object`,400);
  const unknown=Object.keys(value).filter(key=>!allowed.includes(key));if(unknown.length)throw new ProviderRuntimeError("INVALID_POLICY",`${label} contains unsupported fields`,400,{fields:unknown});
}

export class ProviderRuntimeService {
  constructor(
    private readonly store:ProviderRuntimeStore,
    private readonly providers:RuntimeProviderResolver,
    private readonly collectors:ProviderCollectorRegistry,
    private readonly now:()=>string=()=>new Date().toISOString(),
    private readonly id:(prefix:string)=>string=prefix=>`${prefix}:${randomUUID()}`,
  ){}
  private event(document:ProviderRuntimeDocument,type:ProviderRuntimeEventType,definition:ProviderRuntimeDefinition,actor:string,correlationId:string,options:{bindingId?:string;executionId?:string;previousState?:ProviderRuntimeState;newState?:ProviderRuntimeState;code?:string;message?:string}={}){
    const event={eventId:this.id("runtime-event"),type,providerId:definition.providerId,bindingId:options.bindingId??null,executionId:options.executionId??null,timestamp:this.now(),actor,correlationId,previousState:options.previousState??null,newState:options.newState??null,reason:options.code?{code:options.code,message:options.message??options.code}:null,runtimeVersion:definition.version};
    document.events.push(event);document.audit.push(structuredClone(event));return event;
  }
  private requireDefinition(document:ProviderRuntimeDocument,providerId:string){const definition=document.definitions.find(item=>item.providerId===providerId);if(!definition)throw new ProviderRuntimeError("RUNTIME_NOT_CONFIGURED","Provider Runtime is not configured",404);return definition}
  async list(){const document=await this.store.read();return document.definitions.sort((a,b)=>a.providerId.localeCompare(b.providerId)).map(definition=>safeRuntimeProjection(definition,document.bindings,document.claims,document.healthObservations.filter(item=>item.providerId===definition.providerId).at(-1)??null))}
  async details(providerId:string){const document=await this.store.read(),definition=this.requireDefinition(document,providerId);return{runtime:safeRuntimeProjection(definition,document.bindings,document.claims,document.healthObservations.filter(item=>item.providerId===providerId).at(-1)??null),definition,bindings:document.bindings.filter(item=>item.providerId===providerId),latestHealth:document.healthObservations.filter(item=>item.providerId===providerId).at(-1)??null}}
  async history(providerId:string){const document=await this.store.read();this.requireDefinition(document,providerId);return{definitions:document.definitionHistory.filter(item=>item.value.providerId===providerId),bindings:document.bindingHistory.filter(item=>item.value.providerId===providerId),events:document.events.filter(item=>item.providerId===providerId)}}
  async executions(providerId:string,limit=100){const document=await this.store.read();this.requireDefinition(document,providerId);return document.executions.filter(item=>item.providerId===providerId).sort((a,b)=>Date.parse(b.requestedAt)-Date.parse(a.requestedAt)||a.executionId.localeCompare(b.executionId)).slice(0,Math.max(1,Math.min(limit,500)))}
  async define(input:ProviderRuntimeDefinitionInput,actor:string){
    assertFields(input,["providerId","schedule","retryPolicy","rateLimitPolicy","concurrencyPolicy","timeoutPolicy"],"runtime definition");
    assertFields(input.schedule,["scheduleId","type","intervalSeconds","cronExpression","timezone"],"schedule");
    assertFields(input.retryPolicy,["maximumAttempts","backoff","retryableErrors","nonRetryableErrors"],"retry policy");
    assertFields(input.retryPolicy?.backoff,["type","baseDelaySeconds","maximumDelaySeconds"],"backoff policy");
    assertFields(input.rateLimitPolicy,["maximumExecutions","windowSeconds","minimumIntervalSeconds","burstLimit"],"rate-limit policy");
    assertFields(input.concurrencyPolicy,["mode","maximumConcurrency"],"concurrency policy");
    assertFields(input.timeoutPolicy,["timeoutMs"],"timeout policy");
    const provider=await this.providers.get(input.providerId);if(!provider)throw new ProviderRuntimeError("PROVIDER_NOT_FOUND","Provider was not found",404);
    const timestamp=this.now(),definition:ProviderRuntimeDefinition={...structuredClone(input),enabled:false,state:"READY",nextEligibleExecutionAt:null,version:1,createdAt:timestamp,updatedAt:timestamp,createdBy:actor,updatedBy:actor};
    const validation=validateRuntimeDefinition(definition);if(!validation.valid)throw new ProviderRuntimeError("INVALID_POLICY","Runtime definition is invalid",400,validation.errors);
    return this.store.mutate(document=>{if(document.definitions.some(item=>item.providerId===definition.providerId))throw new ProviderRuntimeError("INVALID_POLICY","Runtime definition already exists",409);document.definitions.push(definition);document.definitionHistory.push({version:1,recordedAt:timestamp,actor,value:structuredClone(definition)});this.event(document,"RUNTIME_DEFINED",definition,actor,this.id("correlation"));return definition});
  }
  async update(providerId:string,patch:Partial<Pick<ProviderRuntimeDefinition,"schedule"|"retryPolicy"|"rateLimitPolicy"|"concurrencyPolicy"|"timeoutPolicy">>,actor:string){
    assertFields(patch,["schedule","retryPolicy","rateLimitPolicy","concurrencyPolicy","timeoutPolicy"],"runtime update");
    return this.store.mutate(document=>{const current=this.requireDefinition(document,providerId),next={...current,...structuredClone(patch),providerId:current.providerId,enabled:current.enabled,state:current.state,version:current.version+1,createdAt:current.createdAt,createdBy:current.createdBy,updatedAt:this.now(),updatedBy:actor};const validation=validateRuntimeDefinition(next);if(!validation.valid)throw new ProviderRuntimeError("INVALID_POLICY","Runtime update is invalid",400,validation.errors);document.definitions[document.definitions.indexOf(current)]=next;document.definitionHistory.push({version:next.version,recordedAt:next.updatedAt,actor,value:structuredClone(next)});this.event(document,"RUNTIME_UPDATED",next,actor,this.id("correlation"));return next});
  }
  private async setEnabled(providerId:string,mode:"enable"|"pause"|"disable",actor:string){
    const provider=await this.providers.get(providerId);
    return this.store.mutate(document=>{const current=this.requireDefinition(document,providerId),target:ProviderRuntimeState=mode==="pause"?"PAUSED":mode==="disable"?"DISABLED":current.schedule.type==="MANUAL"?"READY":"SCHEDULED";if(mode==="enable"){const eligibility=evaluateRegistryEligibility(provider,{...current,enabled:true,state:target},[],this.now());if(!eligibility.eligible)throw new ProviderRuntimeError(eligibility.errors[0].code,eligibility.errors[0].message,409,eligibility.errors)}
      const transition=current.state===target&&mode==="enable"?{valid:true}:validateRuntimeTransition(current.state,target);if(!transition.valid)throw new ProviderRuntimeError("INVALID_TRANSITION","error" in transition?transition.error!.message:"Runtime transition is invalid",409);
      const next={...current,enabled:mode==="enable",state:target,nextEligibleExecutionAt:mode==="enable"?nextScheduleTime(current.schedule,this.now()):null,version:current.version+1,updatedAt:this.now(),updatedBy:actor};document.definitions[document.definitions.indexOf(current)]=next;document.definitionHistory.push({version:next.version,recordedAt:next.updatedAt,actor,value:structuredClone(next)});this.event(document,mode==="enable"?"RUNTIME_ENABLED":mode==="pause"?"RUNTIME_PAUSED":"RUNTIME_DISABLED",next,actor,this.id("correlation"),{previousState:current.state,newState:target});return next});
  }
  enable(providerId:string,actor:string){return this.setEnabled(providerId,"enable",actor)}
  pause(providerId:string,actor:string){return this.setEnabled(providerId,"pause",actor)}
  disable(providerId:string,actor:string){return this.setEnabled(providerId,"disable",actor)}
  async createBinding(input:ProviderCollectorBindingInput,actor:string){
    assertFields(input,["bindingId","providerId","collectorId","collectorVersion","declaredCapabilities","enabled","scheduleId","runtimePolicyReference"],"collector binding");
    const provider=await this.providers.get(input.providerId);if(!provider)throw new ProviderRuntimeError("PROVIDER_NOT_FOUND","Provider was not found",404);
    const collector=this.collectors.get(input.collectorId);if(!collector)throw new ProviderRuntimeError("COLLECTOR_NOT_FOUND","Collector is not code-registered",404);
    const timestamp=this.now(),binding:ProviderCollectorBinding={...structuredClone(input),version:1,createdAt:timestamp,updatedAt:timestamp,createdBy:actor,updatedBy:actor};
    return this.store.mutate(document=>{const definition=this.requireDefinition(document,input.providerId),validation=validateCollectorBinding(provider,collector,input,document.bindings,definition);if(!validation.valid)throw new ProviderRuntimeError(validation.errors[0].code,validation.errors[0].message,validation.errors[0].code==="INVALID_POLICY"?400:409,validation.errors);document.bindings.push(binding);document.bindingHistory.push({version:1,recordedAt:timestamp,actor,value:structuredClone(binding)});this.event(document,"BINDING_CREATED",definition,actor,this.id("correlation"),{bindingId:binding.bindingId});return binding});
  }
  async updateBinding(bindingId:string,patch:{enabled?:boolean;declaredCapabilities?:readonly CollectorCapability[]},actor:string){
    assertFields(patch,["enabled","declaredCapabilities"],"collector binding update");
    return this.store.mutate(document=>{const current=document.bindings.find(item=>item.bindingId===bindingId);if(!current)throw new ProviderRuntimeError("BINDING_NOT_FOUND","Collector binding was not found",404);const definition=this.requireDefinition(document,current.providerId),collector=this.collectors.get(current.collectorId);if(!collector)throw new ProviderRuntimeError("COLLECTOR_NOT_FOUND","Collector is not code-registered",404);const next={...current,...structuredClone(patch),bindingId:current.bindingId,providerId:current.providerId,collectorId:current.collectorId,collectorVersion:current.collectorVersion,version:current.version+1,createdAt:current.createdAt,createdBy:current.createdBy,updatedAt:this.now(),updatedBy:actor};if(next.declaredCapabilities.some(capability=>!collector.declaredCapabilities.includes(capability)))throw new ProviderRuntimeError("CAPABILITY_MISMATCH","Binding capability is incompatible",409);document.bindings[document.bindings.indexOf(current)]=next;document.bindingHistory.push({version:next.version,recordedAt:next.updatedAt,actor,value:structuredClone(next)});this.event(document,next.enabled?"BINDING_UPDATED":"BINDING_DISABLED",definition,actor,this.id("correlation"),{bindingId});return next});
  }
  async due(now=this.now()){
    const document=await this.store.read();return document.definitions.filter(definition=>isDue(definition,now)).flatMap(definition=>document.bindings.filter(binding=>binding.providerId===definition.providerId&&binding.enabled).map(binding=>({providerId:definition.providerId,bindingId:binding.bindingId,nextEligibleExecutionAt:definition.nextEligibleExecutionAt}))).sort((a,b)=>Date.parse(a.nextEligibleExecutionAt!)-Date.parse(b.nextEligibleExecutionAt!)||a.providerId.localeCompare(b.providerId)||a.bindingId.localeCompare(b.bindingId));
  }
  private recoverExpired(document:ProviderRuntimeDocument,actor:string,correlationId:string){
    const now=Date.parse(this.now());for(const claim of document.claims.filter(item=>item.status==="ACTIVE"&&Date.parse(item.expiresAt)<=now)){claim.status="EXPIRED";const definition=this.requireDefinition(document,claim.providerId);this.event(document,"CLAIM_EXPIRED",definition,actor,correlationId,{bindingId:claim.bindingId,executionId:claim.executionId,code:"CLAIM_EXPIRED",message:"Expired execution claim recovered"})}
  }
  async execute(providerId:string,options:ExecuteOptions){
    const actor=options.actor,correlationId=options.correlationId??this.id("correlation"),ownerId=options.ownerId??"atlas:runtime",requestedAt=this.now(),provider=await this.providers.get(providerId),controller=new AbortController();
    let prepared;
    try{prepared=await this.store.mutate(document=>{
      this.recoverExpired(document,actor,correlationId);const definition=this.requireDefinition(document,providerId),binding=options.bindingId?document.bindings.find(item=>item.bindingId===options.bindingId&&item.providerId===providerId):document.bindings.filter(item=>item.providerId===providerId&&item.enabled).sort((a,b)=>a.bindingId.localeCompare(b.bindingId))[0];
      if(!binding)throw new ProviderRuntimeError("BINDING_NOT_FOUND","Enabled collector binding was not found",404);if(!binding.enabled)throw new ProviderRuntimeError("BINDING_DISABLED","Collector binding is disabled",409);
      const collector=this.collectors.get(binding.collectorId);if(!collector)throw new ProviderRuntimeError("COLLECTOR_NOT_FOUND","Collector is not code-registered",404);
      const eligibility=evaluateRegistryEligibility(provider,definition,binding.declaredCapabilities,this.now());if(!eligibility.eligible)throw new ProviderRuntimeError(eligibility.errors[0].code,eligibility.errors[0].message,409,eligibility.errors);
      if(options.requireDue&&!isDue(definition,requestedAt))throw new ProviderRuntimeError("NOT_DUE","Provider binding is not due",409);
      const concurrency=evaluateConcurrency(definition.concurrencyPolicy,document.claims,providerId,binding.bindingId,requestedAt);
      if(!concurrency.allowed)throw new ProviderRuntimeError(concurrency.error!.code,concurrency.error!.message,409,concurrency);
      const times=document.rateLimitRecords.filter(item=>item.providerId===providerId).map(item=>item.recordedAt),rate=evaluateRateLimit(definition.rateLimitPolicy,times,requestedAt);
      if(!rate.allowed){const previous=definition.state;definition.state="RATE_LIMITED";definition.nextEligibleExecutionAt=rate.nextEligibleAt;this.event(document,"RATE_LIMIT_APPLIED",definition,actor,correlationId,{bindingId:binding.bindingId,previousState:previous,newState:"RATE_LIMITED",code:"RATE_LIMITED",message:rate.reason!});throw new ProviderRuntimeError("RATE_LIMITED","Configured runtime rate limit reached",429,rate)}
      const executionId=this.id("execution"),attemptNumber=options.attemptNumber??1,attempt:ProviderExecutionAttempt={executionId,providerId,bindingId:binding.bindingId,trigger:{type:options.trigger??"MANUAL",requestedBy:actor},requestedAt,startedAt:null,completedAt:null,attemptNumber,runtimeVersion:definition.version,state:"PENDING",result:null,error:null,retryDecision:null,nextEligibleExecutionAt:null,actor,correlationId};
      const claim={claimId:this.id("claim"),providerId,bindingId:binding.bindingId,executionId,ownerId,claimedAt:requestedAt,expiresAt:new Date(Date.parse(requestedAt)+definition.timeoutPolicy.timeoutMs+30000).toISOString(),status:"ACTIVE" as const};
      document.executions.push(attempt);document.claims.push(claim);document.rateLimitRecords.push({providerId,bindingId:binding.bindingId,executionId,recordedAt:requestedAt});this.event(document,"EXECUTION_REQUESTED",definition,actor,correlationId,{bindingId:binding.bindingId,executionId});this.event(document,"EXECUTION_CLAIMED",definition,actor,correlationId,{bindingId:binding.bindingId,executionId});const previous=definition.state;if(options.trigger==="RETRY"&&previous==="BACKING_OFF")this.event(document,"BACKOFF_COMPLETED",definition,actor,correlationId,{bindingId:binding.bindingId,executionId,previousState:previous,newState:"RUNNING"});definition.state="RUNNING";attempt.state="STARTED";attempt.startedAt=this.now();this.event(document,"EXECUTION_STARTED",definition,actor,correlationId,{bindingId:binding.bindingId,executionId,previousState:previous,newState:"RUNNING"});
      const context={providerId,providerType:provider!.providerType,trustLevel:provider!.trustLevel,publicConfiguration:{homepageUrl:provider!.homepageUrl,baseUrl:provider!.baseUrl,collectionMethod:provider!.collectionMethod},credentialReferenceId:provider!.credentialReference,executionId,correlationId,attemptNumber,deadline:new Date(Date.parse(attempt.startedAt)+definition.timeoutPolicy.timeoutMs).toISOString(),signal:controller.signal,declaredCapabilities:binding.declaredCapabilities,runtimePolicy:{timeoutMs:definition.timeoutPolicy.timeoutMs,maximumAttempts:definition.retryPolicy.maximumAttempts}};
      return{definition:structuredClone(definition),binding:structuredClone(binding),collector,context,executionId,claimId:claim.claimId};
    })}catch(error){
      if(error instanceof ProviderRuntimeError){await this.store.mutate(document=>{const definition=document.definitions.find(item=>item.providerId===providerId);if(definition){if(error.code==="RATE_LIMITED"&&typeof error.details==="object"&&error.details&&"nextEligibleAt" in error.details){const previous=definition.state;definition.state="RATE_LIMITED";definition.nextEligibleExecutionAt=String(error.details.nextEligibleAt);this.event(document,"RATE_LIMIT_APPLIED",definition,actor,correlationId,{bindingId:options.bindingId,previousState:previous,newState:"RATE_LIMITED",code:error.code,message:error.message})}this.event(document,"EXECUTION_REJECTED",definition,actor,correlationId,{bindingId:options.bindingId,code:error.code,message:error.message})}});throw error}
      throw error;
    }
    let timer:ReturnType<typeof setTimeout>|undefined,result:{status:"SUCCEEDED"|"FAILED";recordsProduced:number;error:{classification:string;message:string;retryable:boolean}|null},timedOut=false;
    try{
      result=await Promise.race([prepared.collector.execute(prepared.context),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error("EXECUTION_TIMEOUT"))},prepared.definition.timeoutPolicy.timeoutMs)})]);
    }catch(error){
      timedOut=(error as Error).message==="EXECUTION_TIMEOUT";result={status:"FAILED",recordsProduced:0,error:{classification:timedOut?"EXECUTION_TIMEOUT":"COLLECTOR_FAILURE",message:timedOut?"Collector execution timed out":"Collector execution failed",retryable:timedOut}};
    }finally{if(timer)clearTimeout(timer)}
    return this.store.mutate(document=>{
      const definition=this.requireDefinition(document,providerId),attempt=document.executions.find(item=>item.executionId===prepared.executionId)!,claim=document.claims.find(item=>item.claimId===prepared.claimId)!;const completedAt=this.now(),executionError=result.error?runtimeError(timedOut?"EXECUTION_TIMEOUT":"COLLECTOR_FAILURE",result.error.message,result.error.retryable,result.error.classification):null;
      attempt.completedAt=completedAt;attempt.state=timedOut?"TIMED_OUT":result.status==="SUCCEEDED"?"SUCCEEDED":"FAILED";attempt.error=executionError;attempt.result={status:attempt.state,recordsProduced:Math.max(0,Math.trunc(result.recordsProduced)),completedAt,error:executionError};const retry=retryDecision(definition.retryPolicy,attempt.attemptNumber,executionError,completedAt);attempt.retryDecision={scheduled:retry.scheduled,reason:retry.reason};attempt.nextEligibleExecutionAt=retry.nextEligibleAt;claim.status="RELEASED";
      const previous=definition.state;if(retry.scheduled){attempt.state="RETRY_SCHEDULED";definition.state="BACKING_OFF";definition.nextEligibleExecutionAt=retry.nextEligibleAt;this.event(document,"RETRY_SCHEDULED",definition,actor,correlationId,{bindingId:prepared.binding.bindingId,executionId:attempt.executionId,previousState:previous,newState:"BACKING_OFF",code:"RETRY_SCHEDULED",message:retry.reason});this.event(document,"BACKOFF_STARTED",definition,actor,correlationId,{bindingId:prepared.binding.bindingId,executionId:attempt.executionId})}
      else{definition.state=result.status==="SUCCEEDED"?(definition.schedule.type==="MANUAL"?"READY":"SCHEDULED"):"DEGRADED";definition.nextEligibleExecutionAt=nextScheduleTime(definition.schedule,completedAt)}
      this.event(document,timedOut?"EXECUTION_TIMED_OUT":result.status==="SUCCEEDED"?"EXECUTION_SUCCEEDED":"EXECUTION_FAILED",definition,actor,correlationId,{bindingId:prepared.binding.bindingId,executionId:attempt.executionId,previousState:previous,newState:definition.state,code:executionError?.code,message:executionError?.message});
      const observation=calculateHealth(providerId,document.executions.filter(item=>item.providerId===providerId),completedAt);document.healthObservations.push(observation);this.event(document,"HEALTH_RECALCULATED",definition,actor,correlationId,{executionId:attempt.executionId,code:"HEALTH_RECALCULATED",message:`Runtime-observed health is ${observation.state}`});return structuredClone(attempt);
    });
  }
  async tick(maxExecutions=10,actor="atlas:runtime-tick"){
    const limit=Math.max(1,Math.min(Math.trunc(maxExecutions),50)),startedAt=this.now(),tickId=this.id("tick"),candidates=(await this.due(startedAt)).slice(0,limit);const summary:RuntimeTickSummary={tickId,startedAt,completedAt:startedAt,candidatesEvaluated:candidates.length,executionsClaimed:0,executionsSucceeded:0,executionsFailed:0,executionsTimedOut:0,executionsRejected:0,retriesScheduled:0,rateLimitedCount:0,skippedCount:0};
    for(const candidate of candidates){try{const document=await this.store.read(),prior=document.executions.filter(item=>item.providerId===candidate.providerId&&item.bindingId===candidate.bindingId).sort((a,b)=>Date.parse(b.requestedAt)-Date.parse(a.requestedAt))[0],retry=prior?.state==="RETRY_SCHEDULED";const attempt=await this.execute(candidate.providerId,{bindingId:candidate.bindingId,trigger:retry?"RETRY":"SCHEDULED",attemptNumber:retry?prior.attemptNumber+1:1,actor,correlationId:tickId,ownerId:tickId,requireDue:true});summary.executionsClaimed++;if(attempt.result?.status==="SUCCEEDED")summary.executionsSucceeded++;else if(attempt.result?.status==="TIMED_OUT")summary.executionsTimedOut++;else summary.executionsFailed++;if(attempt.state==="RETRY_SCHEDULED")summary.retriesScheduled++}catch(error){summary.executionsRejected++;if(error instanceof ProviderRuntimeError&&error.code==="RATE_LIMITED")summary.rateLimitedCount++;else summary.skippedCount++}}
    summary.completedAt=this.now();return summary;
  }
}

let runtime:ProviderRuntimeService|undefined;
export function getProviderRuntime(){
  const path=process.env.ATLAS_PROVIDER_RUNTIME_PATH;if(!path)throw new ProviderRuntimeError("RUNTIME_NOT_CONFIGURED","Provider Runtime storage is not configured",503);
  return runtime??=new ProviderRuntimeService(new JsonFileProviderRuntimeStore(path),{get:providerId=>getSourceRegistry().get(providerId)},getProviderCollectorRegistry());
}
