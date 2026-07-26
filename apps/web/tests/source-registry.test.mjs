import test from "node:test";
import assert from "node:assert/strict";
import { existsSync,readFileSync } from "node:fs";
import {
  applyHealthCheck,
  canTransitionProvider,
  filterProviders,
  isPubliclyDisplayable,
  toInternalProviderView,
  toPublicSourceEntry,
  validateProvider,
  validateProviderUniqueness,
} from "../src/lib/source-registry/source-registry-logic.mjs";

const base={
  providerId:"provider:example",slug:"example",displayName:"Example Authority",legalName:"Example Authority",description:"Official example provider.",homepageUrl:"https://example.test/",
  providerType:"GOVERNMENT",categories:["news"],capabilities:["PUBLICATIONS"],geographicCoverage:{scope:"GLOBAL",regions:[],countryCodes:[]},languageCoverage:["en"],
  trustLevel:"OFFICIAL_PRIMARY",lifecycleStatus:"APPROVED",activationStatus:"APPROVED",legalReviewStatus:"PASSED",schemaReviewStatus:"PASSED",qualityReviewStatus:"PASSED",operationalReviewStatus:"PASSED",securityReviewStatus:"PASSED",publicDisplayPolicy:"ATTRIBUTION_REQUIRED",collectorConnected:false,
  collectionMethod:"REST_API",baseUrl:"https://api.example.test/",authenticationType:"NONE",credentialReference:null,refreshPolicy:{intervalSeconds:300,jitterSeconds:10,maximumStaleSeconds:900},rateLimitPolicy:{requests:60,perSeconds:60,burst:10},retryPolicy:{maximumAttempts:3,baseDelayMs:1000,maximumDelayMs:10000,backoff:"EXPONENTIAL"},timeoutPolicy:{requestTimeoutMs:15000},
  licenseType:"Public terms",attributionRequired:true,attributionText:"Example Authority",redistributionPolicy:"ATTRIBUTION_REQUIRED",retentionPolicy:"PERMANENT",retentionDays:null,termsUrl:"https://example.test/terms",
  healthStatus:"UNKNOWN",lastSuccessfulCollectionAt:null,lastFailedCollectionAt:null,consecutiveFailureCount:0,lastHealthCheckAt:null,lastHealthCheckOutcome:null,lastHealthMessage:null,disabledReason:null,
  version:1,createdAt:"2026-07-26T00:00:00.000Z",updatedAt:"2026-07-26T00:00:00.000Z",createdBy:"test",updatedBy:"test",extensions:{},
};
const codes=result=>result.issues.map(item=>item.code);

test("valid provider passes domain and activation validation",()=>{
  assert.equal(validateProvider(base).valid,true);
  assert.equal(validateProvider(base,{forActivation:true}).activationEligible,true);
});

test("identity, uniqueness, URL, refresh, rate, and attribution failures are explicit",()=>{
  assert.ok(codes(validateProvider({...base,displayName:""})).includes("MISSING_IDENTITY"));
  assert.ok(codes(validateProvider({...base,homepageUrl:"http://example.test"})).includes("INVALID_URL"));
  assert.ok(codes(validateProvider({...base,refreshPolicy:{intervalSeconds:0,jitterSeconds:0,maximumStaleSeconds:0}})).includes("INVALID_REFRESH_POLICY"));
  assert.ok(codes(validateProvider({...base,rateLimitPolicy:{requests:0,perSeconds:0,burst:0}})).includes("INVALID_RATE_LIMIT"));
  assert.ok(codes(validateProvider({...base,attributionText:""})).includes("INVALID_ATTRIBUTION"));
  assert.deepEqual(validateProviderUniqueness(base,[base]).map(item=>item.code),["DUPLICATE_PROVIDER_ID","DUPLICATE_PROVIDER_SLUG"]);
});

test("invalid credential and secret-like extension configuration is rejected",()=>{
  assert.ok(codes(validateProvider({...base,authenticationType:"API_KEY",credentialReference:null})).includes("INVALID_CREDENTIAL_CONFIGURATION"));
  assert.ok(codes(validateProvider({...base,authenticationType:"API_KEY",credentialReference:"literal-secret"})).includes("INVALID_CREDENTIAL_CONFIGURATION"));
  assert.ok(codes(validateProvider({...base,extensions:{apiToken:"not-allowed"}})).includes("SENSITIVE_EXTENSION_KEY"));
});

test("activation requires every deterministic governance gate",()=>{
  for(const field of ["legalReviewStatus","schemaReviewStatus","qualityReviewStatus","operationalReviewStatus","securityReviewStatus"]){
    const result=validateProvider({...base,[field]:"PENDING"},{forActivation:true});
    assert.equal(result.activationEligible,false);
    assert.ok(result.issues.some(item=>item.code==="ACTIVATION_GATE_FAILED"&&item.field===field));
  }
  assert.ok(codes(validateProvider({...base,disabledReason:"Blocked"},{forActivation:true})).includes("ACTIVATION_GATE_FAILED"));
});

test("lifecycle transitions are deterministic and retired is terminal",()=>{
  assert.equal(canTransitionProvider("DRAFT","REVIEW"),true);
  assert.equal(canTransitionProvider("REVIEW","APPROVED"),true);
  assert.equal(canTransitionProvider("APPROVED","ACTIVE"),true);
  assert.equal(canTransitionProvider("ACTIVE","SUSPENDED"),true);
  assert.equal(canTransitionProvider("SUSPENDED","ACTIVE"),true);
  assert.equal(canTransitionProvider("RETIRED","ACTIVE"),false);
  assert.equal(canTransitionProvider("DRAFT","ACTIVE"),false);
});

test("health records distinguish data, valid empty, provider failure, auth, rate, and schema outcomes",()=>{
  const success=applyHealthCheck({...base,lifecycleStatus:"ACTIVE",activationStatus:"ACTIVE"},{outcome:"SUCCESS_WITH_DATA",checkedAt:"2026-07-26T01:00:00Z",message:"12 records"});
  assert.equal(success.healthStatus,"HEALTHY");assert.equal(success.consecutiveFailureCount,0);
  const empty=applyHealthCheck(success,{outcome:"SUCCESS_EMPTY",checkedAt:"2026-07-26T02:00:00Z",message:"Valid empty response"});
  assert.equal(empty.healthStatus,"HEALTHY");assert.equal(empty.lastHealthCheckOutcome,"SUCCESS_EMPTY");
  const failed=applyHealthCheck(empty,{outcome:"PROVIDER_FAILURE",checkedAt:"2026-07-26T03:00:00Z",message:"HTTP 503"});
  assert.equal(failed.healthStatus,"DEGRADED");assert.equal(failed.consecutiveFailureCount,1);
  const rate=applyHealthCheck(failed,{outcome:"RATE_LIMITED",checkedAt:"2026-07-26T04:00:00Z",message:"HTTP 429"});
  assert.equal(rate.healthStatus,"DEGRADED");
  const auth=applyHealthCheck(empty,{outcome:"AUTHENTICATION_FAILURE",checkedAt:"2026-07-26T05:00:00Z",message:"HTTP 401"});
  assert.equal(auth.healthStatus,"FAILING");
  const schema=applyHealthCheck(empty,{outcome:"SCHEMA_VALIDATION_FAILURE",checkedAt:"2026-07-26T06:00:00Z",message:"Invalid payload"});
  assert.equal(schema.healthStatus,"FAILING");
});

test("restricted and inactive providers never enter public projections",()=>{
  const active={...base,lifecycleStatus:"ACTIVE",activationStatus:"ACTIVE",healthStatus:"HEALTHY"};
  assert.equal(isPubliclyDisplayable(active),true);
  assert.equal(toPublicSourceEntry(active)?.providerId,active.providerId);
  assert.equal(toPublicSourceEntry({...active,trustLevel:"RESTRICTED"}),null);
  assert.equal(toPublicSourceEntry({...active,publicDisplayPolicy:"INTERNAL_ONLY"}),null);
  assert.equal(toPublicSourceEntry({...active,lifecycleStatus:"SUSPENDED"}),null);
});

test("secret references and internal-only configuration never appear in projections",()=>{
  const credentialed={...base,authenticationType:"API_KEY",credentialReference:"env:EXAMPLE_API_KEY"};
  const internal=toInternalProviderView(credentialed);
  assert.equal(internal.credentialConfigured,true);
  assert.equal("credentialReference" in internal,false);
  const publicEntry=toPublicSourceEntry({...credentialed,lifecycleStatus:"ACTIVE",activationStatus:"ACTIVE"});
  assert.equal(publicEntry&&"credentialReference" in publicEntry,false);
  assert.equal(publicEntry&&"legalReviewStatus" in publicEntry,false);
  assert.equal(publicEntry&&"baseUrl" in publicEntry,false);
});

test("filters cover governance, health, geography, language, and public eligibility",()=>{
  const active={...base,lifecycleStatus:"ACTIVE",activationStatus:"ACTIVE",healthStatus:"HEALTHY"};
  assert.equal(filterProviders([active],{providerType:"GOVERNMENT",category:"news",trustLevel:"OFFICIAL_PRIMARY",lifecycleStatus:"ACTIVE",healthStatus:"HEALTHY",geographicCoverage:"global",language:"EN",publicDisplayEligible:true}).length,1);
  assert.equal(filterProviders([active],{language:"th"}).length,0);
});

test("persistent store, service, internal routes, and frozen public boundary are wired",()=>{
  const store=readFileSync(new URL("../src/lib/source-registry/source-registry-store.ts",import.meta.url),"utf8");
  const service=readFileSync(new URL("../src/lib/source-registry/source-registry-service.ts",import.meta.url),"utf8");
  const auth=readFileSync(new URL("../src/lib/source-registry/internal-source-registry-api.ts",import.meta.url),"utf8");
  assert.match(store,/JsonFileSourceRegistryStore/);assert.match(store,/rename\(temporary/);assert.match(store,/history/);
  assert.match(service,/ACTIVATION_VALIDATION_FAILED/);assert.match(service,/HEALTH_RECORDED/);assert.match(service,/version:current\.version\+1/);
  assert.match(auth,/ATLAS_INTERNAL_ADMIN_TOKEN/);assert.match(auth,/timingSafeEqual/);
  for(const path of ["route.ts","[providerId]/route.ts","[providerId]/validate/route.ts","[providerId]/activate/route.ts","[providerId]/suspend/route.ts","[providerId]/retire/route.ts","[providerId]/history/route.ts","[providerId]/health/route.ts"])assert.equal(existsSync(new URL(`../src/app/api/internal/source-registry/${path}`,import.meta.url)),true,path);
  assert.equal(existsSync(new URL("../src/app/api/v1/source-registry/route.ts",import.meta.url)),false);
});

test("seed set is bounded and distinguishes connected from registered providers",()=>{
  const seeds=readFileSync(new URL("../src/lib/source-registry/source-registry-seeds.ts",import.meta.url),"utf8");
  for(const id of ["provider:usgs","provider:noaa-nhc","provider:nasa","provider:cisa","provider:who"])assert.match(seeds,new RegExp(id));
  assert.match(seeds,/collectorConnected:true/);
  assert.match(seeds,/collectorConnected:false/);
  assert.match(seeds,/activationStatus:"REGISTERED"/);
});
