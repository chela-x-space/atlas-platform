import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp,readFile,rm,stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  calculateHealth,evaluateConcurrency,evaluateRateLimit,evaluateRegistryEligibility,isDue,nextScheduleTime,
  retryDecision,safeRuntimeProjection,validateCollectorBinding,validateRuntimeDefinition,validateRuntimeTransition,
} from "../src/lib/provider-runtime/provider-runtime-logic.mjs";

const now="2026-07-27T02:00:00.000Z";
const schedule={scheduleId:"schedule:test",type:"INTERVAL",intervalSeconds:300,cronExpression:null,timezone:"UTC"};
const definition={
  providerId:"provider:usgs",enabled:true,state:"SCHEDULED",schedule,
  retryPolicy:{maximumAttempts:3,backoff:{type:"EXPONENTIAL",baseDelaySeconds:10,maximumDelaySeconds:60},retryableErrors:["TRANSIENT","EXECUTION_TIMEOUT"],nonRetryableErrors:["AUTH"]},
  rateLimitPolicy:{maximumExecutions:3,windowSeconds:60,minimumIntervalSeconds:10,burstLimit:2},
  concurrencyPolicy:{mode:"SERIAL",maximumConcurrency:1},timeoutPolicy:{timeoutMs:5000},nextEligibleExecutionAt:now,
  version:1,createdAt:now,updatedAt:now,createdBy:"test",updatedBy:"test",
};
const provider={
  providerId:"provider:usgs",providerType:"GOVERNMENT",lifecycleStatus:"ACTIVE",activationStatus:"ACTIVE",disabledReason:null,healthStatus:"UNKNOWN",
  trustLevel:"OFFICIAL_PRIMARY",baseUrl:"https://earthquake.usgs.gov/",collectionMethod:"REST_API",capabilities:["EVENTS","GEOSPATIAL"],
};
const collector={collectorId:"test",collectorVersion:"1.0.0",supportedProviderKinds:["GOVERNMENT"],declaredCapabilities:["EVENTS"]};
const binding={bindingId:"binding:test",providerId:"provider:usgs",collectorId:"test",collectorVersion:"1.0.0",declaredCapabilities:["EVENTS"],enabled:true,scheduleId:"schedule:test",runtimePolicyReference:"runtime:provider:usgs:v1"};
const execution=(id,state,completedAt,error=null)=>({executionId:id,providerId:"provider:usgs",bindingId:"binding:test",state,completedAt,result:{status:state,completedAt,error},requestedAt:completedAt});

test("runtime policies require bounded timeout, concurrency, rate limits, retries, and timezone",()=>{
  assert.equal(validateRuntimeDefinition(definition).valid,true);
  for(const invalid of [
    {...definition,timeoutPolicy:{timeoutMs:0}},
    {...definition,concurrencyPolicy:{mode:"LIMITED",maximumConcurrency:0}},
    {...definition,rateLimitPolicy:{maximumExecutions:0,windowSeconds:60,minimumIntervalSeconds:0,burstLimit:null}},
    {...definition,retryPolicy:{...definition.retryPolicy,maximumAttempts:11}},
    {...definition,schedule:{...schedule,timezone:""}},
  ])assert.equal(validateRuntimeDefinition(invalid).valid,false);
});

test("runtime state transitions are explicit and invalid transitions fail",()=>{
  assert.equal(validateRuntimeTransition("READY","SCHEDULED").valid,true);
  assert.equal(validateRuntimeTransition("SCHEDULED","RUNNING").valid,true);
  assert.equal(validateRuntimeTransition("RUNNING","BACKING_OFF").valid,true);
  assert.equal(validateRuntimeTransition("PAUSED","RUNNING").valid,false);
  assert.equal(validateRuntimeTransition("DISABLED","RUNNING").error.code,"INVALID_TRANSITION");
});

test("Source Registry eligibility rejects unknown, inactive, unapproved, disabled, restricted, and mismatched providers",()=>{
  assert.equal(evaluateRegistryEligibility(provider,definition,["EVENTS"],now).eligible,true);
  assert.equal(evaluateRegistryEligibility(null,definition,[],now).errors[0].code,"PROVIDER_NOT_FOUND");
  assert.ok(evaluateRegistryEligibility({...provider,lifecycleStatus:"APPROVED",activationStatus:"APPROVED"},definition,[],now).errors.some(item=>item.code==="PROVIDER_NOT_ACTIVE"));
  assert.ok(evaluateRegistryEligibility({...provider,lifecycleStatus:"DRAFT"},definition,[],now).errors.some(item=>item.code==="PROVIDER_NOT_APPROVED"));
  assert.ok(evaluateRegistryEligibility({...provider,disabledReason:"governance hold"},definition,[],now).errors.some(item=>item.code==="PROVIDER_DISABLED"));
  assert.ok(evaluateRegistryEligibility({...provider,trustLevel:"RESTRICTED"},definition,[],now).errors.some(item=>item.code==="CAPABILITY_MISMATCH"));
  assert.ok(evaluateRegistryEligibility(provider,definition,["PUBLICATIONS"],now).errors.some(item=>item.code==="CAPABILITY_MISMATCH"));
  assert.ok(evaluateRegistryEligibility(provider,{...definition,enabled:false,state:"PAUSED"},[],now).errors.some(item=>item.code==="RUNTIME_PAUSED"));
});

test("collector bindings reject unknown collectors, kind and capability mismatch, duplicates, and missing policy links",()=>{
  assert.equal(validateCollectorBinding(provider,collector,binding,[],definition).valid,true);
  assert.equal(validateCollectorBinding(provider,null,binding,[],definition).errors[0].code,"COLLECTOR_NOT_FOUND");
  assert.ok(validateCollectorBinding(provider,{...collector,supportedProviderKinds:["SPACE"]},binding,[],definition).errors.some(item=>item.code==="CAPABILITY_MISMATCH"));
  assert.ok(validateCollectorBinding(provider,collector,{...binding,declaredCapabilities:["GEOSPATIAL"]},[],definition).errors.some(item=>item.code==="CAPABILITY_MISMATCH"));
  assert.ok(validateCollectorBinding(provider,collector,binding,[binding],definition).errors.some(item=>item.code==="CAPABILITY_MISMATCH"));
  assert.ok(validateCollectorBinding(provider,collector,{...binding,scheduleId:"missing"},[],definition).errors.some(item=>item.code==="INVALID_POLICY"));
});

test("manual, interval, and cron scheduling are deterministic with explicit timezone",()=>{
  assert.equal(nextScheduleTime({...schedule,type:"MANUAL",intervalSeconds:null},now),null);
  assert.equal(nextScheduleTime(schedule,now),"2026-07-27T02:05:00.000Z");
  assert.equal(nextScheduleTime({scheduleId:"cron",type:"CRON",intervalSeconds:null,cronExpression:"0 9 * * *",timezone:"Asia/Bangkok"},"2026-07-27T01:59:00.000Z"),"2026-07-27T02:00:00.000Z");
  assert.equal(isDue(definition,now),true);
  assert.equal(isDue({...definition,nextEligibleExecutionAt:"2026-07-27T03:00:00Z"},now),false);
});

test("due projections and deterministic ordering fields remain safe",()=>{
  const projection=safeRuntimeProjection(definition,[binding],[],null);
  assert.deepEqual(projection,{providerId:"provider:usgs",enabled:true,state:"SCHEDULED",scheduleType:"INTERVAL",nextEligibleExecutionAt:now,bindingCount:1,activeClaimCount:0,health:"UNKNOWN",version:1});
  assert.equal(safeRuntimeProjection({...definition,state:"PAUSED"},[binding],[],{state:"HEALTHY"}).health,"PAUSED");
  assert.equal(JSON.stringify(projection).includes("credential"),false);
});

test("claims enforce serial and limited concurrency and recover expiration deterministically",()=>{
  const claims=[
    {claimId:"expired",providerId:"provider:usgs",bindingId:"binding:test",status:"ACTIVE",expiresAt:"2026-07-27T01:00:00Z"},
    {claimId:"active",providerId:"provider:usgs",bindingId:"binding:test",status:"ACTIVE",expiresAt:"2026-07-27T03:00:00Z"},
  ];
  const serial=evaluateConcurrency({mode:"SERIAL",maximumConcurrency:1},claims,"provider:usgs","binding:test",now);
  assert.equal(serial.allowed,false);assert.deepEqual(serial.expiredClaimIds,["expired"]);assert.equal(serial.error.code,"CLAIM_CONFLICT");
  assert.equal(evaluateConcurrency({mode:"LIMITED",maximumConcurrency:2},claims,"provider:usgs","binding:test",now).allowed,true);
});

test("rate-limit windows, minimum intervals, and persisted usage are deterministic",()=>{
  const first=evaluateRateLimit(definition.rateLimitPolicy,[],now);assert.equal(first.allowed,true);
  const minimum=evaluateRateLimit(definition.rateLimitPolicy,["2026-07-27T01:59:55Z"],now);assert.equal(minimum.allowed,false);assert.equal(minimum.nextEligibleAt,"2026-07-27T02:00:05.000Z");
  const window=evaluateRateLimit({...definition.rateLimitPolicy,minimumIntervalSeconds:0,burstLimit:null},["2026-07-27T01:59:10Z","2026-07-27T01:59:20Z","2026-07-27T01:59:30Z"],now);
  assert.equal(window.allowed,false);assert.equal(window.currentUsage,3);assert.equal(window.limit,3);
});

test("fixed and exponential retries respect classifications, maximum attempts, and no hidden retry",()=>{
  const retryable={code:"COLLECTOR_FAILURE",classification:"TRANSIENT",message:"temporary",retryable:true};
  assert.equal(retryDecision({...definition.retryPolicy,backoff:{type:"FIXED",baseDelaySeconds:10,maximumDelaySeconds:10}},1,retryable,now).nextEligibleAt,"2026-07-27T02:00:10.000Z");
  assert.equal(retryDecision(definition.retryPolicy,2,retryable,now).nextEligibleAt,"2026-07-27T02:00:20.000Z");
  assert.equal(retryDecision(definition.retryPolicy,3,retryable,now).scheduled,false);
  assert.equal(retryDecision(definition.retryPolicy,1,{...retryable,classification:"AUTH",retryable:false},now).scheduled,false);
  assert.equal(retryDecision({...definition.retryPolicy,backoff:{type:"NONE",baseDelaySeconds:0,maximumDelaySeconds:0}},1,retryable,now).scheduled,false);
});

test("health starts UNKNOWN and derives only from recorded success, failure, and timeout outcomes",()=>{
  assert.equal(calculateHealth("provider:usgs",[],now).state,"UNKNOWN");
  assert.equal(calculateHealth("provider:usgs",[execution("1","SUCCEEDED","2026-07-27T01:00:00Z")],now).state,"HEALTHY");
  assert.equal(calculateHealth("provider:usgs",[execution("1","SUCCEEDED","2026-07-27T01:00:00Z"),execution("2","FAILED","2026-07-27T01:10:00Z")],now).state,"DEGRADED");
  const unhealthy=calculateHealth("provider:usgs",[execution("1","FAILED","2026-07-27T01:00:00Z"),execution("2","TIMED_OUT","2026-07-27T01:10:00Z"),execution("3","FAILED","2026-07-27T01:20:00Z")],now);
  assert.equal(unhealthy.state,"UNHEALTHY");assert.equal(unhealthy.timeoutCount,1);assert.equal(unhealthy.consecutiveFailureCount,3);
});

test("persistent store survives restart, writes atomically, and returns immutable copies",async()=>{
  const directory=await mkdtemp(join(tmpdir(),"atlas-runtime-test-")),path=join(directory,"runtime.json");
  try{
    const{JsonFileProviderRuntimeStore}=await import("../src/lib/provider-runtime/provider-runtime-store.ts");
    const first=new JsonFileProviderRuntimeStore(path);await first.mutate(document=>{document.definitions.push(structuredClone(definition));document.definitionHistory.push({version:1,recordedAt:now,actor:"test",value:structuredClone(definition)})});
    const read=await first.read();read.definitions[0].state="FAILED";
    const restarted=new JsonFileProviderRuntimeStore(path),persisted=await restarted.read();
    assert.equal(persisted.definitions[0].state,"SCHEDULED");assert.equal(persisted.definitionHistory[0].value.state,"SCHEDULED");
    assert.equal((await stat(path)).mode&0o777,0o600);assert.equal(JSON.parse(await readFile(path,"utf8")).schemaVersion,1);
  }finally{await rm(directory,{recursive:true,force:true})}
});

test("service, timeout, audit, tick, authentication, safe context, and optional fallback boundaries are present",async()=>{
  const paths=["../src/lib/provider-runtime/provider-runtime-service.ts","../src/lib/provider-runtime/provider-runtime-store.ts","../src/lib/provider-runtime/provider-collector-registry.ts","../src/lib/provider-runtime/internal-provider-runtime-api.ts","../src/app/api/internal/provider-runtime/tick/route.ts","../src/app/api/internal/provider-runtime/[providerId]/execute/route.ts"];
  const[service,store,collectors,auth,tick,execute]=await Promise.all(paths.map(path=>readFile(new URL(path,import.meta.url),"utf8")));
  assert.match(service,/getSourceRegistry/);assert.match(service,/Promise\.race/);assert.match(service,/controller\.abort\(\)/);assert.match(service,/EXECUTION_TIMED_OUT/);assert.match(service,/CLAIM_EXPIRED/);assert.match(service,/HEALTH_RECALCULATED/);assert.match(service,/ATLAS_PROVIDER_RUNTIME_PATH/);
  assert.match(service,/current\.state===target&&mode==="enable"/);
  assert.match(store,/rename\(temporary/);assert.match(store,/mode:0o600/);assert.match(store,/schemaVersion:1/);
  assert.match(collectors,/SafeTestCollector/);assert.match(collectors,/Never registered by production defaults/);
  assert.match(auth,/timingSafeEqual/);assert.match(auth,/ATLAS_INTERNAL_ADMIN_TOKEN/);
  assert.match(tick,/maximumExecutions/);assert.match(tick,/maximum>50/);assert.match(execute,/trigger:"MANUAL"/);
  assert.doesNotMatch(service,/process\.env\.[A-Z_]+_API_KEY/);assert.doesNotMatch(service,/EvidenceMedia|dashboard|api\/v1/);
});

test("internal routes are complete while public API and OpenAPI remain outside runtime scope",async()=>{
  const{existsSync}=await import("node:fs");
  for(const path of ["route.ts","due/route.ts","tick/route.ts","bindings/route.ts","bindings/[bindingId]/route.ts","[providerId]/route.ts","[providerId]/enable/route.ts","[providerId]/pause/route.ts","[providerId]/disable/route.ts","[providerId]/history/route.ts","[providerId]/executions/route.ts","[providerId]/execute/route.ts"])assert.equal(existsSync(new URL(`../src/app/api/internal/provider-runtime/${path}`,import.meta.url)),true,path);
  assert.equal(existsSync(new URL("../src/app/api/v1/provider-runtime/route.ts",import.meta.url)),false);
});
