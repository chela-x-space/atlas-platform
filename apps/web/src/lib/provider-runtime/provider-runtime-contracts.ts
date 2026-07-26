import type { ProviderCapability,ProviderType,TrustLevel } from "@/lib/source-registry/source-registry-contracts";

export const PROVIDER_RUNTIME_STATES=["UNCONFIGURED","READY","SCHEDULED","RUNNING","BACKING_OFF","RATE_LIMITED","PAUSED","DEGRADED","FAILED","DISABLED"] as const;
export const PROVIDER_EXECUTION_STATES=["PENDING","STARTED","SUCCEEDED","FAILED","TIMED_OUT","REJECTED","CANCELLED","RETRY_SCHEDULED"] as const;
export const PROVIDER_SCHEDULE_TYPES=["MANUAL","INTERVAL","CRON","DISABLED"] as const;
export const PROVIDER_HEALTH_STATES=["UNKNOWN","HEALTHY","DEGRADED","UNHEALTHY","PAUSED","DISABLED"] as const;
export const RUNTIME_EVENT_TYPES=["RUNTIME_DEFINED","RUNTIME_UPDATED","RUNTIME_ENABLED","RUNTIME_PAUSED","RUNTIME_DISABLED","BINDING_CREATED","BINDING_UPDATED","BINDING_DISABLED","EXECUTION_REQUESTED","EXECUTION_REJECTED","EXECUTION_CLAIMED","EXECUTION_STARTED","EXECUTION_SUCCEEDED","EXECUTION_FAILED","EXECUTION_TIMED_OUT","RETRY_SCHEDULED","RATE_LIMIT_APPLIED","BACKOFF_STARTED","BACKOFF_COMPLETED","CLAIM_EXPIRED","HEALTH_RECALCULATED"] as const;
export const RUNTIME_ERROR_CODES=["PROVIDER_NOT_FOUND","PROVIDER_NOT_ACTIVE","PROVIDER_NOT_APPROVED","PROVIDER_DISABLED","RUNTIME_NOT_CONFIGURED","RUNTIME_DISABLED","RUNTIME_PAUSED","BINDING_NOT_FOUND","BINDING_DISABLED","COLLECTOR_NOT_FOUND","CAPABILITY_MISMATCH","NOT_DUE","CLAIM_CONFLICT","CONCURRENCY_LIMIT","RATE_LIMITED","BACKING_OFF","INVALID_TRANSITION","INVALID_POLICY","EXECUTION_TIMEOUT","COLLECTOR_FAILURE","PERSISTENCE_FAILURE","INTERNAL_ERROR"] as const;

export type ProviderRuntimeState=typeof PROVIDER_RUNTIME_STATES[number];
export type ProviderExecutionState=typeof PROVIDER_EXECUTION_STATES[number];
export type ProviderScheduleType=typeof PROVIDER_SCHEDULE_TYPES[number];
export type ProviderHealthState=typeof PROVIDER_HEALTH_STATES[number];
export type ProviderRuntimeEventType=typeof RUNTIME_EVENT_TYPES[number];
export type RuntimeErrorCode=typeof RUNTIME_ERROR_CODES[number];
export type CollectorCapability=ProviderCapability;

export type ProviderSchedule={
  scheduleId:string;
  type:ProviderScheduleType;
  intervalSeconds:number|null;
  cronExpression:string|null;
  timezone:string;
};
export type ProviderBackoffPolicy={type:"NONE"|"FIXED"|"EXPONENTIAL";baseDelaySeconds:number;maximumDelaySeconds:number};
export type ProviderRetryPolicy={maximumAttempts:number;backoff:ProviderBackoffPolicy;retryableErrors:readonly string[];nonRetryableErrors:readonly string[]};
export type ProviderRateLimitPolicy={maximumExecutions:number;windowSeconds:number;minimumIntervalSeconds:number;burstLimit:number|null};
export type ProviderConcurrencyPolicy={mode:"SERIAL"|"LIMITED";maximumConcurrency:number};
export type ProviderTimeoutPolicy={timeoutMs:number};
export type ProviderRuntimeDefinition={
  providerId:string;enabled:boolean;state:ProviderRuntimeState;schedule:ProviderSchedule;retryPolicy:ProviderRetryPolicy;
  rateLimitPolicy:ProviderRateLimitPolicy;concurrencyPolicy:ProviderConcurrencyPolicy;timeoutPolicy:ProviderTimeoutPolicy;
  nextEligibleExecutionAt:string|null;version:number;createdAt:string;updatedAt:string;createdBy:string;updatedBy:string;
};
export type ProviderCollectorBinding={
  bindingId:string;providerId:string;collectorId:string;collectorVersion:string;declaredCapabilities:readonly CollectorCapability[];
  enabled:boolean;scheduleId:string;runtimePolicyReference:string;version:number;createdAt:string;updatedAt:string;createdBy:string;updatedBy:string;
};
export type ProviderExecutionTrigger={type:"MANUAL"|"SCHEDULED"|"RETRY";requestedBy:string};
export type ProviderExecutionError={code:RuntimeErrorCode|string;classification:string;message:string;retryable:boolean};
export type ProviderExecutionResult={status:ProviderExecutionState;recordsProduced:number;completedAt:string;error:ProviderExecutionError|null};
export type ProviderExecutionAttempt={
  executionId:string;providerId:string;bindingId:string;trigger:ProviderExecutionTrigger;requestedAt:string;startedAt:string|null;completedAt:string|null;
  attemptNumber:number;runtimeVersion:number;state:ProviderExecutionState;result:ProviderExecutionResult|null;error:ProviderExecutionError|null;
  retryDecision:{scheduled:boolean;reason:string}|null;nextEligibleExecutionAt:string|null;actor:string;correlationId:string;
};
export type CollectorExecutionContext={
  providerId:string;providerType:ProviderType;trustLevel:TrustLevel;publicConfiguration:{homepageUrl:string;baseUrl:string|null;collectionMethod:string};
  credentialReferenceId:string|null;executionId:string;correlationId:string;attemptNumber:number;deadline:string;
  signal:AbortSignal;declaredCapabilities:readonly CollectorCapability[];runtimePolicy:{timeoutMs:number;maximumAttempts:number};
};
export type CollectorExecutionResult={status:"SUCCEEDED"|"FAILED";recordsProduced:number;error:{classification:string;message:string;retryable:boolean}|null};
export interface CollectorRuntimeAdapter {
  readonly collectorId:string;readonly collectorVersion:string;readonly supportedProviderKinds:readonly ProviderType[];
  readonly declaredCapabilities:readonly CollectorCapability[];
  execute(context:CollectorExecutionContext):Promise<CollectorExecutionResult>;
}
export type ExecutionClaim={claimId:string;providerId:string;bindingId:string;executionId:string;ownerId:string;claimedAt:string;expiresAt:string;status:"ACTIVE"|"RELEASED"|"EXPIRED"};
export type ProviderHealthObservation={
  observationId:string;providerId:string;observedAt:string;basedOnExecutionIds:readonly string[];successCount:number;failureCount:number;
  timeoutCount:number;consecutiveFailureCount:number;lastSuccessAt:string|null;lastFailureAt:string|null;state:ProviderHealthState;calculationPolicyVersion:"v1";
};
export type ProviderRuntimeEvent={
  eventId:string;type:ProviderRuntimeEventType;providerId:string;bindingId:string|null;executionId:string|null;timestamp:string;actor:string;
  correlationId:string;previousState:ProviderRuntimeState|null;newState:ProviderRuntimeState|null;reason:{code:string;message:string}|null;runtimeVersion:number;
};
export type ProviderRuntimeAuditRecord=ProviderRuntimeEvent;
export type RuntimeEligibilityResult={eligible:boolean;errors:readonly ProviderExecutionError[]};
export type RuntimeTransitionResult={valid:boolean;from:ProviderRuntimeState;to:ProviderRuntimeState;error:ProviderExecutionError|null};
export type RuntimeProjection={
  providerId:string;enabled:boolean;state:ProviderRuntimeState;scheduleType:ProviderScheduleType;nextEligibleExecutionAt:string|null;
  bindingCount:number;activeClaimCount:number;health:ProviderHealthState;version:number;
};
export type ProviderRuntimeDefinitionInput=Omit<ProviderRuntimeDefinition,"enabled"|"state"|"nextEligibleExecutionAt"|"version"|"createdAt"|"updatedAt"|"createdBy"|"updatedBy">;
export type ProviderCollectorBindingInput=Omit<ProviderCollectorBinding,"version"|"createdAt"|"updatedAt"|"createdBy"|"updatedBy">;
export type RuntimeTickSummary={tickId:string;startedAt:string;completedAt:string;candidatesEvaluated:number;executionsClaimed:number;executionsSucceeded:number;executionsFailed:number;executionsTimedOut:number;executionsRejected:number;retriesScheduled:number;rateLimitedCount:number;skippedCount:number};
