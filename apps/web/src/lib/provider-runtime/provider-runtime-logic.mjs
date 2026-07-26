const states=new Set(["UNCONFIGURED","READY","SCHEDULED","RUNNING","BACKING_OFF","RATE_LIMITED","PAUSED","DEGRADED","FAILED","DISABLED"]);
const transitions={
  UNCONFIGURED:new Set(["READY","DISABLED"]),READY:new Set(["SCHEDULED","RUNNING","PAUSED","DISABLED"]),SCHEDULED:new Set(["RUNNING","PAUSED","RATE_LIMITED","BACKING_OFF","DISABLED"]),
  RUNNING:new Set(["READY","SCHEDULED","BACKING_OFF","DEGRADED","FAILED","DISABLED"]),BACKING_OFF:new Set(["READY","SCHEDULED","RUNNING","PAUSED","DISABLED"]),
  RATE_LIMITED:new Set(["READY","SCHEDULED","RUNNING","PAUSED","DISABLED"]),PAUSED:new Set(["READY","SCHEDULED","DISABLED"]),
  DEGRADED:new Set(["READY","SCHEDULED","RUNNING","PAUSED","FAILED","DISABLED"]),FAILED:new Set(["READY","PAUSED","DISABLED"]),DISABLED:new Set(["READY"]),
};
const error=(code,message,retryable=false,classification=code)=>({code,classification,message,retryable});
const validDate=value=>typeof value==="string"&&Number.isFinite(Date.parse(value));
const positive=value=>Number.isInteger(value)&&value>0;

export function validateRuntimeDefinition(definition){
  const errors=[];
  if(!definition?.providerId)errors.push(error("INVALID_POLICY","providerId is required"));
  if(!definition?.schedule||!["MANUAL","INTERVAL","CRON","DISABLED"].includes(definition.schedule.type))errors.push(error("INVALID_POLICY","A supported schedule is required"));
  else{
    if(!isTimezone(definition.schedule.timezone))errors.push(error("INVALID_POLICY","Schedule timezone must be explicit and valid"));
    if(definition.schedule.type==="INTERVAL"&&!positive(definition.schedule.intervalSeconds))errors.push(error("INVALID_POLICY","Interval schedule requires positive intervalSeconds"));
    if(definition.schedule.type==="CRON"&&!parseCron(definition.schedule.cronExpression))errors.push(error("INVALID_POLICY","Cron schedule must use five supported fields"));
  }
  const retry=definition?.retryPolicy;
  if(!retry||!Number.isInteger(retry.maximumAttempts)||retry.maximumAttempts<1||retry.maximumAttempts>10||!["NONE","FIXED","EXPONENTIAL"].includes(retry.backoff?.type)||retry.backoff.baseDelaySeconds<0||retry.backoff.maximumDelaySeconds<retry.backoff.baseDelaySeconds)errors.push(error("INVALID_POLICY","Retry policy is invalid"));
  const rate=definition?.rateLimitPolicy;
  if(!rate||!positive(rate.maximumExecutions)||!positive(rate.windowSeconds)||!Number.isInteger(rate.minimumIntervalSeconds)||rate.minimumIntervalSeconds<0||rate.burstLimit!==null&&(!positive(rate.burstLimit)||rate.burstLimit>rate.maximumExecutions))errors.push(error("INVALID_POLICY","Rate-limit policy is invalid"));
  const concurrency=definition?.concurrencyPolicy;
  if(!concurrency||!["SERIAL","LIMITED"].includes(concurrency.mode)||!positive(concurrency.maximumConcurrency)||concurrency.mode==="SERIAL"&&concurrency.maximumConcurrency!==1||concurrency.maximumConcurrency>20)errors.push(error("INVALID_POLICY","Concurrency must be bounded and SERIAL must equal one"));
  if(!positive(definition?.timeoutPolicy?.timeoutMs)||definition.timeoutPolicy.timeoutMs>300000)errors.push(error("INVALID_POLICY","Timeout must be between 1 and 300000 milliseconds"));
  return{valid:errors.length===0,errors};
}

export function validateRuntimeTransition(from,to){
  if(!states.has(from)||!states.has(to)||!transitions[from]?.has(to))return{valid:false,from,to,error:error("INVALID_TRANSITION",`Cannot transition ${from} to ${to}`)};
  return{valid:true,from,to,error:null};
}
export function evaluateRegistryEligibility(provider,definition,capabilities,now){
  const errors=[];
  if(!provider)errors.push(error("PROVIDER_NOT_FOUND","Provider was not found"));
  else{
    if(provider.lifecycleStatus!=="ACTIVE")errors.push(error(provider.lifecycleStatus==="APPROVED"?"PROVIDER_NOT_ACTIVE":"PROVIDER_NOT_APPROVED","Provider lifecycle does not permit execution"));
    if(provider.activationStatus!=="ACTIVE")errors.push(error("PROVIDER_NOT_ACTIVE","Provider is not active"));
    if(provider.disabledReason||provider.healthStatus==="DISABLED")errors.push(error("PROVIDER_DISABLED","Provider is disabled"));
    if(provider.trustLevel==="RESTRICTED")errors.push(error("CAPABILITY_MISMATCH","Restricted provider trust does not permit collection"));
    if(!provider.baseUrl&&provider.collectionMethod!=="MANUAL")errors.push(error("PROVIDER_DISABLED","Provider collection configuration is incomplete"));
    for(const capability of capabilities)if(!provider.capabilities?.includes(capability))errors.push(error("CAPABILITY_MISMATCH",`Provider does not govern ${capability}`));
  }
  if(!definition.enabled)errors.push(error(definition.state==="PAUSED"?"RUNTIME_PAUSED":"RUNTIME_DISABLED","Provider Runtime is not enabled"));
  if(definition.state==="DISABLED")errors.push(error("RUNTIME_DISABLED","Provider Runtime is disabled"));
  if(definition.state==="PAUSED")errors.push(error("RUNTIME_PAUSED","Provider Runtime is paused"));
  if(definition.state==="BACKING_OFF"&&validDate(definition.nextEligibleExecutionAt)&&Date.parse(definition.nextEligibleExecutionAt)>Date.parse(now))errors.push(error("BACKING_OFF","Provider Runtime is backing off"));
  return{eligible:errors.length===0,errors};
}
export function validateCollectorBinding(provider,collector,binding,existing,definition){
  const errors=[];
  if(!provider)errors.push(error("PROVIDER_NOT_FOUND","Provider was not found"));
  if(!collector)errors.push(error("COLLECTOR_NOT_FOUND","Collector is not code-registered"));
  if(provider&&collector&&!collector.supportedProviderKinds.includes(provider.providerType))errors.push(error("CAPABILITY_MISMATCH","Collector does not support provider kind"));
  if(provider&&collector&&(binding.collectorVersion!==collector.collectorVersion||binding.declaredCapabilities.some(capability=>!collector.declaredCapabilities.includes(capability)||!provider.capabilities.includes(capability))))errors.push(error("CAPABILITY_MISMATCH","Collector binding capabilities or version are incompatible"));
  if(existing.some(item=>item.providerId===binding.providerId&&item.collectorId===binding.collectorId&&item.enabled))errors.push(error("CAPABILITY_MISMATCH","An active provider-collector binding already exists"));
  if(!definition||binding.scheduleId!==definition.schedule.scheduleId||binding.runtimePolicyReference!==`runtime:${definition?.providerId}:v${definition?.version}`)errors.push(error("INVALID_POLICY","Binding schedule or runtime policy reference is invalid"));
  return{valid:errors.length===0,errors};
}

export function isTimezone(timezone){if(typeof timezone!=="string"||!timezone)return false;try{new Intl.DateTimeFormat("en-US",{timeZone:timezone}).format(0);return true}catch{return false}}
function field(token,min,max){
  if(token==="*")return()=>true;
  const step=token.match(/^\*\/(\d+)$/);if(step){const value=Number(step[1]);return positive(value)?candidate=>(candidate-min)%value===0:null}
  const values=token.split(",").map(Number);if(values.length&&values.every(value=>Number.isInteger(value)&&value>=min&&value<=max)){const set=new Set(values);return candidate=>set.has(candidate)}
  return null;
}
export function parseCron(expression){
  if(typeof expression!=="string")return null;const parts=expression.trim().split(/\s+/);if(parts.length!==5)return null;
  const matchers=[field(parts[0],0,59),field(parts[1],0,23),field(parts[2],1,31),field(parts[3],1,12),field(parts[4],0,6)];
  return matchers.every(Boolean)?matchers:null;
}
function zonedParts(date,timezone){
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:timezone,minute:"numeric",hour:"numeric",day:"numeric",month:"numeric",weekday:"short",hourCycle:"h23"}).formatToParts(date);
  const value=type=>parts.find(part=>part.type===type)?.value;return[Number(value("minute")),Number(value("hour")),Number(value("day")),Number(value("month")),["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(value("weekday"))];
}
export function nextScheduleTime(schedule,from){
  const start=Date.parse(from);if(!Number.isFinite(start))return null;
  if(schedule.type==="DISABLED"||schedule.type==="MANUAL")return null;
  if(schedule.type==="INTERVAL")return new Date(start+schedule.intervalSeconds*1000).toISOString();
  const matchers=parseCron(schedule.cronExpression);if(!matchers||!isTimezone(schedule.timezone))return null;
  let cursor=Math.floor(start/60000)*60000+60000;for(let count=0;count<527040;count++,cursor+=60000){const values=zonedParts(new Date(cursor),schedule.timezone);if(matchers.every((match,index)=>match(values[index])))return new Date(cursor).toISOString()}return null;
}
export function isDue(definition,now){return definition.enabled&&["INTERVAL","CRON"].includes(definition.schedule.type)&&validDate(definition.nextEligibleExecutionAt)&&Date.parse(definition.nextEligibleExecutionAt)<=Date.parse(now)}

export function evaluateRateLimit(policy,executionTimes,now){
  const timestamp=Date.parse(now),windowStart=timestamp-policy.windowSeconds*1000,recent=executionTimes.map(Date.parse).filter(value=>Number.isFinite(value)&&value>=windowStart&&value<=timestamp).sort((a,b)=>a-b);
  const latest=recent.at(-1),minimumNext=latest===undefined?timestamp:latest+policy.minimumIntervalSeconds*1000;
  const windowNext=recent.length>=policy.maximumExecutions?recent[recent.length-policy.maximumExecutions]+policy.windowSeconds*1000:timestamp;
  const burstBlocked=policy.burstLimit!==null&&recent.filter(value=>value>=timestamp-policy.minimumIntervalSeconds*1000).length>=policy.burstLimit;
  const next=Math.max(timestamp,minimumNext,windowNext,burstBlocked&&latest!==undefined?latest+Math.max(1,policy.minimumIntervalSeconds)*1000:timestamp);
  return{allowed:next<=timestamp,reason:next<=timestamp?null:"Configured provider rate limit reached",currentUsage:recent.length,limit:policy.maximumExecutions,windowStart:new Date(windowStart).toISOString(),windowEnd:new Date(timestamp).toISOString(),nextEligibleAt:new Date(next).toISOString()};
}
export function evaluateConcurrency(policy,claims,providerId,bindingId,now){
  const timestamp=Date.parse(now),expired=claims.filter(item=>item.providerId===providerId&&item.bindingId===bindingId&&item.status==="ACTIVE"&&Date.parse(item.expiresAt)<=timestamp).map(item=>item.claimId);
  const active=claims.filter(item=>item.providerId===providerId&&item.bindingId===bindingId&&item.status==="ACTIVE"&&!expired.includes(item.claimId));
  return{allowed:active.length<policy.maximumConcurrency,activeCount:active.length,limit:policy.maximumConcurrency,expiredClaimIds:expired,error:active.length>=policy.maximumConcurrency?error(active.length?"CLAIM_CONFLICT":"CONCURRENCY_LIMIT","Provider binding concurrency limit reached"):null};
}
export function retryDecision(policy,attemptNumber,executionError,completedAt){
  if(!executionError)return{scheduled:false,reason:"Execution succeeded",nextEligibleAt:null};
  if(policy.nonRetryableErrors.includes(executionError.classification)||!executionError.retryable)return{scheduled:false,reason:"Error classification is non-retryable",nextEligibleAt:null};
  if(!policy.retryableErrors.includes(executionError.classification))return{scheduled:false,reason:"Error classification is not allowlisted for retry",nextEligibleAt:null};
  if(attemptNumber>=policy.maximumAttempts||policy.backoff.type==="NONE")return{scheduled:false,reason:"Retry policy exhausted or disabled",nextEligibleAt:null};
  const raw=policy.backoff.type==="FIXED"?policy.backoff.baseDelaySeconds:policy.backoff.baseDelaySeconds*2**(attemptNumber-1),delay=Math.min(raw,policy.backoff.maximumDelaySeconds);
  return{scheduled:true,reason:`${policy.backoff.type} retry scheduled`,nextEligibleAt:new Date(Date.parse(completedAt)+delay*1000).toISOString()};
}
export function calculateHealth(providerId,attempts,observedAt){
  const terminal=attempts.map(item=>({...item,observedState:item.result?.status??item.state})).filter(item=>["SUCCEEDED","FAILED","TIMED_OUT"].includes(item.observedState)).sort((a,b)=>Date.parse(a.completedAt)-Date.parse(b.completedAt)),recent=terminal.slice(-10);
  let consecutive=0;for(let index=recent.length-1;index>=0&&recent[index].observedState!=="SUCCEEDED";index--)consecutive++;
  const successes=recent.filter(item=>item.observedState==="SUCCEEDED"),failures=recent.filter(item=>item.observedState==="FAILED"),timeouts=recent.filter(item=>item.observedState==="TIMED_OUT");
  const state=!recent.length?"UNKNOWN":consecutive>=3?"UNHEALTHY":consecutive>0?"DEGRADED":"HEALTHY";
  return{observationId:`health:${providerId}:${Date.parse(observedAt)}`,providerId,observedAt,basedOnExecutionIds:recent.map(item=>item.executionId),successCount:successes.length,failureCount:failures.length,timeoutCount:timeouts.length,consecutiveFailureCount:consecutive,lastSuccessAt:successes.at(-1)?.completedAt??null,lastFailureAt:[...failures,...timeouts].sort((a,b)=>Date.parse(a.completedAt)-Date.parse(b.completedAt)).at(-1)?.completedAt??null,state,calculationPolicyVersion:"v1"};
}
export function safeRuntimeProjection(definition,bindings,claims,health){
  return{providerId:definition.providerId,enabled:definition.enabled,state:definition.state,scheduleType:definition.schedule.type,nextEligibleExecutionAt:definition.nextEligibleExecutionAt,bindingCount:bindings.filter(item=>item.providerId===definition.providerId&&item.enabled).length,activeClaimCount:claims.filter(item=>item.providerId===definition.providerId&&item.status==="ACTIVE").length,health:definition.state==="PAUSED"?"PAUSED":definition.state==="DISABLED"?"DISABLED":health?.state??"UNKNOWN",version:definition.version};
}
export { error as runtimeError };
