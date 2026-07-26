const providerTypes=new Set(["NEWS","GOVERNMENT","FINANCIAL_REGULATOR","CENTRAL_BANK","MARKET_DATA","CYBERSECURITY","WEATHER","NATURAL_DISASTER","HEALTH","SPACE","ENERGY","RESEARCH","TECHNOLOGY","AI","TRANSPORTATION","MARITIME","AVIATION","SPORTS","OPEN_DATA","OTHER"]);
const trustLevels=new Set(["OFFICIAL_PRIMARY","TRUSTED_PRIMARY","TRUSTED_SECONDARY","COMMUNITY","EXPERIMENTAL","RESTRICTED"]);
const lifecycleStatuses=new Set(["DRAFT","REVIEW","APPROVED","ACTIVE","SUSPENDED","DEPRECATED","RETIRED"]);
const reviewStatuses=new Set(["NOT_STARTED","PENDING","PASSED","FAILED","WAIVED"]);
const healthStatuses=new Set(["UNKNOWN","HEALTHY","DEGRADED","FAILING","DISABLED"]);
const authenticationTypes=new Set(["NONE","API_KEY","BEARER_TOKEN","BASIC","OAUTH2","MUTUAL_TLS","SIGNED_REQUEST","OTHER"]);
const collectionMethods=new Set(["RSS","REST_API","GRAPHQL","WEBHOOK","FILE_DOWNLOAD","HTML","STREAM","MANUAL","OTHER"]);
const publicDisplayPolicies=new Set(["PUBLIC","ATTRIBUTION_REQUIRED","SUMMARY_ONLY","INTERNAL_ONLY","RESTRICTED"]);
const activationStatuses=new Set(["REGISTERED","APPROVED","ACTIVE"]);
const redistributionPolicies=new Set(["ALLOWED","ATTRIBUTION_REQUIRED","SUMMARY_ONLY","PROHIBITED","REVIEW_REQUIRED"]);
const retentionPolicies=new Set(["PERMANENT","BOUNDED","CACHE_ONLY","PROHIBITED"]);
const eventCategories=new Set(["earthquake","cyclone","weather","climate","space","science","earth-observation","technology","news","health","wildfire","flood","volcano","conflict","aviation","marine","market","cyber","energy","unknown"]);
const capabilities=new Set(["EVENTS","PUBLICATIONS","ADVISORIES","OBSERVATIONS","TIME_SERIES","FORECASTS","GEOSPATIAL","HISTORICAL_BACKFILL"]);
const sensitiveKey=/(secret|password|token|credential|api.?key|private.?key)/i;

function issue(code,field,message){return{code,field,message}}
function text(value){return typeof value==="string"&&value.trim().length>0}
function url(value,nullable=false){if(nullable&&(value===null||value===""))return true;if(!text(value))return false;try{const parsed=new URL(value);return parsed.protocol==="https:"}catch{return false}}
function whole(value,min,max=Number.MAX_SAFE_INTEGER){return Number.isInteger(value)&&value>=min&&value<=max}

export function validateProvider(provider,{forActivation=false}={}){
  const issues=[];
  if(!text(provider?.providerId)||!/^provider:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(provider.providerId))issues.push(issue("INVALID_PROVIDER_ID","providerId","providerId must use provider:<slug> format"));
  if(!text(provider?.slug)||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(provider.slug))issues.push(issue("INVALID_SLUG","slug","slug must be lowercase kebab-case"));
  for(const field of ["displayName","legalName","description"])if(!text(provider?.[field]))issues.push(issue("MISSING_IDENTITY",field,`${field} is required`));
  if(!url(provider?.homepageUrl))issues.push(issue("INVALID_URL","homepageUrl","homepageUrl must be a valid HTTPS URL"));
  if(!providerTypes.has(provider?.providerType))issues.push(issue("INVALID_ENUM","providerType","providerType is not supported"));
  if(!trustLevels.has(provider?.trustLevel))issues.push(issue("INVALID_ENUM","trustLevel","trustLevel is not supported"));
  if(!lifecycleStatuses.has(provider?.lifecycleStatus))issues.push(issue("INVALID_ENUM","lifecycleStatus","lifecycleStatus is not supported"));
  if(!activationStatuses.has(provider?.activationStatus))issues.push(issue("INVALID_ENUM","activationStatus","activationStatus is not supported"));
  if(!publicDisplayPolicies.has(provider?.publicDisplayPolicy))issues.push(issue("INVALID_ENUM","publicDisplayPolicy","publicDisplayPolicy is not supported"));
  for(const field of ["legalReviewStatus","schemaReviewStatus","qualityReviewStatus","operationalReviewStatus","securityReviewStatus"])if(!reviewStatuses.has(provider?.[field]))issues.push(issue("INVALID_ENUM",field,`${field} is not supported`));
  if(!healthStatuses.has(provider?.healthStatus))issues.push(issue("INVALID_ENUM","healthStatus","healthStatus is not supported"));
  if(!collectionMethods.has(provider?.collectionMethod))issues.push(issue("INVALID_ENUM","collectionMethod","collectionMethod is not supported"));
  if(!authenticationTypes.has(provider?.authenticationType))issues.push(issue("INVALID_ENUM","authenticationType","authenticationType is not supported"));
  if(!redistributionPolicies.has(provider?.redistributionPolicy))issues.push(issue("INVALID_ENUM","redistributionPolicy","redistributionPolicy is not supported"));
  if(!retentionPolicies.has(provider?.retentionPolicy))issues.push(issue("INVALID_ENUM","retentionPolicy","retentionPolicy is not supported"));
  if(!Array.isArray(provider?.categories)||provider.categories.length===0||provider.categories.some(value=>!eventCategories.has(value)))issues.push(issue("INVALID_CATEGORIES","categories","At least one supported category is required"));
  if(!Array.isArray(provider?.capabilities)||provider.capabilities.length===0||provider.capabilities.some(value=>!capabilities.has(value)))issues.push(issue("INVALID_CAPABILITIES","capabilities","At least one supported capability is required"));
  if(!provider?.geographicCoverage||!["GLOBAL","MULTI_REGION","REGIONAL","NATIONAL","LOCAL"].includes(provider.geographicCoverage.scope))issues.push(issue("INVALID_COVERAGE","geographicCoverage","A supported geographic coverage scope is required"));
  if(!Array.isArray(provider?.languageCoverage)||provider.languageCoverage.length===0||provider.languageCoverage.some(value=>!/^([a-z]{2,3})(-[A-Z]{2})?$/.test(value)))issues.push(issue("INVALID_LANGUAGES","languageCoverage","At least one valid language code is required"));
  if(provider?.collectionMethod!=="MANUAL"&&!url(provider?.baseUrl))issues.push(issue("INVALID_COLLECTION_URL","baseUrl","A valid HTTPS baseUrl is required for collected providers"));
  if(provider?.authenticationType==="NONE"&&provider?.credentialReference)issues.push(issue("UNEXPECTED_CREDENTIAL_REFERENCE","credentialReference","Unauthenticated providers must not configure a credential reference"));
  if(provider?.authenticationType!=="NONE"&&(!text(provider?.credentialReference)||!/^(env|vault|secret):[A-Za-z0-9_./:-]+$/.test(provider.credentialReference)))issues.push(issue("INVALID_CREDENTIAL_CONFIGURATION","credentialReference","Authenticated providers require an indirect env:, vault:, or secret: reference"));
  const refresh=provider?.refreshPolicy;
  if(!refresh||!whole(refresh.intervalSeconds,15)||!whole(refresh.jitterSeconds,0)||refresh.jitterSeconds>=refresh.intervalSeconds||!whole(refresh.maximumStaleSeconds,refresh?.intervalSeconds??15))issues.push(issue("INVALID_REFRESH_POLICY","refreshPolicy","Refresh interval, jitter, and maximum stale time are invalid"));
  const rate=provider?.rateLimitPolicy;
  if(!rate||!whole(rate.requests,1)||!whole(rate.perSeconds,1)||!whole(rate.burst,1)||rate.burst>rate.requests)issues.push(issue("INVALID_RATE_LIMIT","rateLimitPolicy","Rate limit requests, period, and burst must be positive and bounded"));
  const retry=provider?.retryPolicy;
  if(!retry||!whole(retry.maximumAttempts,0,10)||!whole(retry.baseDelayMs,0)||!whole(retry.maximumDelayMs,retry?.baseDelayMs??0)||!["FIXED","EXPONENTIAL"].includes(retry.backoff))issues.push(issue("INVALID_RETRY_POLICY","retryPolicy","Retry policy is invalid"));
  if(!whole(provider?.timeoutPolicy?.requestTimeoutMs,100,120000))issues.push(issue("INVALID_TIMEOUT_POLICY","timeoutPolicy","Request timeout must be between 100 and 120000 milliseconds"));
  if(!text(provider?.licenseType)||!url(provider?.termsUrl))issues.push(issue("INVALID_RIGHTS","licenseType","License type and HTTPS terms URL are required"));
  const attributionNeeded=provider?.attributionRequired||!["INTERNAL_ONLY","RESTRICTED"].includes(provider?.publicDisplayPolicy);
  if(attributionNeeded&&!text(provider?.attributionText))issues.push(issue("INVALID_ATTRIBUTION","attributionText","Required attribution text is missing"));
  if(provider?.retentionPolicy==="BOUNDED"&&!whole(provider?.retentionDays,1))issues.push(issue("INVALID_RETENTION","retentionDays","Bounded retention requires a positive retentionDays value"));
  if(provider?.disabledReason!==null&&provider?.disabledReason!==undefined&&!text(provider.disabledReason))issues.push(issue("INVALID_DISABLED_REASON","disabledReason","disabledReason must be null or non-empty"));
  for(const[key,value]of Object.entries(provider?.extensions??{})){
    if(sensitiveKey.test(key))issues.push(issue("SENSITIVE_EXTENSION_KEY",`extensions.${key}`,"Secret-like extension keys are prohibited"));
    const validValue=value===null||["string","number","boolean"].includes(typeof value)||Array.isArray(value)&&value.every(item=>item===null||["string","number","boolean"].includes(typeof item));
    if(!validValue)issues.push(issue("INVALID_EXTENSION_VALUE",`extensions.${key}`,"Extension values must be JSON primitives or primitive arrays"));
  }
  if(forActivation){
    for(const field of ["legalReviewStatus","schemaReviewStatus","qualityReviewStatus","operationalReviewStatus","securityReviewStatus"])if(provider?.[field]!=="PASSED")issues.push(issue("ACTIVATION_GATE_FAILED",field,`${field} must be PASSED`));
    if(provider?.lifecycleStatus!=="APPROVED"&&provider?.lifecycleStatus!=="SUSPENDED")issues.push(issue("ACTIVATION_GATE_FAILED","lifecycleStatus","Provider must be APPROVED or SUSPENDED before activation"));
    if(provider?.activationStatus!=="APPROVED"&&provider?.activationStatus!=="ACTIVE")issues.push(issue("ACTIVATION_GATE_FAILED","activationStatus","Provider activation status must be APPROVED"));
    if(provider?.disabledReason)issues.push(issue("ACTIVATION_GATE_FAILED","disabledReason","Disabled reason must be resolved before activation"));
  }
  return{valid:issues.length===0,activationEligible:forActivation&&issues.length===0,issues};
}

export function validateProviderUniqueness(provider,providers){
  const issues=[];
  if(providers.some(item=>item.providerId===provider.providerId))issues.push(issue("DUPLICATE_PROVIDER_ID","providerId","providerId is already registered"));
  if(providers.some(item=>item.slug===provider.slug))issues.push(issue("DUPLICATE_PROVIDER_SLUG","slug","slug is already registered"));
  return issues;
}

const transitions={
  DRAFT:new Set(["REVIEW","RETIRED"]),
  REVIEW:new Set(["DRAFT","APPROVED","RETIRED"]),
  APPROVED:new Set(["ACTIVE","SUSPENDED","DEPRECATED","RETIRED"]),
  ACTIVE:new Set(["SUSPENDED","DEPRECATED","RETIRED"]),
  SUSPENDED:new Set(["ACTIVE","DEPRECATED","RETIRED"]),
  DEPRECATED:new Set(["RETIRED"]),
  RETIRED:new Set(),
};
export function canTransitionProvider(from,to){return transitions[from]?.has(to)??false}

export function applyHealthCheck(provider,check){
  const failed=!["SUCCESS_WITH_DATA","SUCCESS_EMPTY"].includes(check.outcome);
  const failures=failed?(provider.consecutiveFailureCount??0)+1:0;
  let healthStatus;
  if(!failed)healthStatus="HEALTHY";
  else if(["AUTHENTICATION_FAILURE","SCHEMA_VALIDATION_FAILURE"].includes(check.outcome)||failures>=3)healthStatus="FAILING";
  else healthStatus="DEGRADED";
  return{...provider,healthStatus,lastHealthCheckAt:check.checkedAt,lastHealthCheckOutcome:check.outcome,lastHealthMessage:check.message,consecutiveFailureCount:failures,...(failed?{lastFailedCollectionAt:check.checkedAt}:{lastSuccessfulCollectionAt:check.checkedAt})};
}

export function filterProviders(providers,filters={}){
  return providers.filter(provider=>
    (!filters.providerType||provider.providerType===filters.providerType)&&
    (!filters.category||provider.categories.includes(filters.category))&&
    (!filters.trustLevel||provider.trustLevel===filters.trustLevel)&&
    (!filters.lifecycleStatus||provider.lifecycleStatus===filters.lifecycleStatus)&&
    (!filters.healthStatus||provider.healthStatus===filters.healthStatus)&&
    (!filters.geographicCoverage||[provider.geographicCoverage.scope,...provider.geographicCoverage.regions,...provider.geographicCoverage.countryCodes].some(value=>value.toLowerCase()===filters.geographicCoverage.toLowerCase()))&&
    (!filters.language||provider.languageCoverage.some(value=>value.toLowerCase()===filters.language.toLowerCase()))&&
    (filters.publicDisplayEligible===undefined||isPubliclyDisplayable(provider)===filters.publicDisplayEligible)
  ).sort((a,b)=>a.displayName.localeCompare(b.displayName)||a.providerId.localeCompare(b.providerId));
}

export function isPubliclyDisplayable(provider){
  return provider.lifecycleStatus==="ACTIVE"&&provider.activationStatus==="ACTIVE"&&
    !["INTERNAL_ONLY","RESTRICTED"].includes(provider.publicDisplayPolicy)&&
    provider.trustLevel!=="RESTRICTED";
}

export function toInternalProviderView(provider){
  const{credentialReference,...safe}=provider;
  return{...safe,credentialConfigured:Boolean(credentialReference)};
}

export function toPublicSourceEntry(provider){
  if(!isPubliclyDisplayable(provider))return null;
  const{providerId,displayName,description,providerType,categories,trustLevel,healthStatus,attributionText,homepageUrl,geographicCoverage,languageCoverage}=provider;
  return{providerId,displayName,description,providerType,categories,trustLevel,healthStatus,attributionText,homepageUrl,geographicCoverage,languageCoverage};
}
