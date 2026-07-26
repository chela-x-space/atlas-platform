import type { AtlasEventCategory, JsonPrimitive } from "@/types/atlas-data";

export const PROVIDER_TYPES = ["NEWS","GOVERNMENT","FINANCIAL_REGULATOR","CENTRAL_BANK","MARKET_DATA","CYBERSECURITY","WEATHER","NATURAL_DISASTER","HEALTH","SPACE","ENERGY","RESEARCH","TECHNOLOGY","AI","TRANSPORTATION","MARITIME","AVIATION","SPORTS","OPEN_DATA","OTHER"] as const;
export const TRUST_LEVELS = ["OFFICIAL_PRIMARY","TRUSTED_PRIMARY","TRUSTED_SECONDARY","COMMUNITY","EXPERIMENTAL","RESTRICTED"] as const;
export const LIFECYCLE_STATUSES = ["DRAFT","REVIEW","APPROVED","ACTIVE","SUSPENDED","DEPRECATED","RETIRED"] as const;
export const REVIEW_STATUSES = ["NOT_STARTED","PENDING","PASSED","FAILED","WAIVED"] as const;
export const HEALTH_STATUSES = ["UNKNOWN","HEALTHY","DEGRADED","FAILING","DISABLED"] as const;
export const AUTHENTICATION_TYPES = ["NONE","API_KEY","BEARER_TOKEN","BASIC","OAUTH2","MUTUAL_TLS","SIGNED_REQUEST","OTHER"] as const;
export const COLLECTION_METHODS = ["RSS","REST_API","GRAPHQL","WEBHOOK","FILE_DOWNLOAD","HTML","STREAM","MANUAL","OTHER"] as const;
export const PUBLIC_DISPLAY_POLICIES = ["PUBLIC","ATTRIBUTION_REQUIRED","SUMMARY_ONLY","INTERNAL_ONLY","RESTRICTED"] as const;
export const ACTIVATION_STATUSES = ["REGISTERED","APPROVED","ACTIVE"] as const;
export const REDISTRIBUTION_POLICIES = ["ALLOWED","ATTRIBUTION_REQUIRED","SUMMARY_ONLY","PROHIBITED","REVIEW_REQUIRED"] as const;
export const RETENTION_POLICIES = ["PERMANENT","BOUNDED","CACHE_ONLY","PROHIBITED"] as const;
export const HEALTH_CHECK_OUTCOMES = ["SUCCESS_WITH_DATA","SUCCESS_EMPTY","PROVIDER_FAILURE","AUTHENTICATION_FAILURE","RATE_LIMITED","SCHEMA_VALIDATION_FAILURE"] as const;

export type ProviderType = typeof PROVIDER_TYPES[number];
export type TrustLevel = typeof TRUST_LEVELS[number];
export type LifecycleStatus = typeof LIFECYCLE_STATUSES[number];
export type ReviewStatus = typeof REVIEW_STATUSES[number];
export type HealthStatus = typeof HEALTH_STATUSES[number];
export type AuthenticationType = typeof AUTHENTICATION_TYPES[number];
export type CollectionMethod = typeof COLLECTION_METHODS[number];
export type PublicDisplayPolicy = typeof PUBLIC_DISPLAY_POLICIES[number];
export type ActivationStatus = typeof ACTIVATION_STATUSES[number];
export type RedistributionPolicy = typeof REDISTRIBUTION_POLICIES[number];
export type RetentionPolicy = typeof RETENTION_POLICIES[number];
export type HealthCheckOutcome = typeof HEALTH_CHECK_OUTCOMES[number];

export type ProviderCapability = "EVENTS"|"PUBLICATIONS"|"ADVISORIES"|"OBSERVATIONS"|"TIME_SERIES"|"FORECASTS"|"GEOSPATIAL"|"HISTORICAL_BACKFILL";
export type ProviderExtensionValue = JsonPrimitive | readonly JsonPrimitive[];

export type GeographicCoverage = {
  scope: "GLOBAL"|"MULTI_REGION"|"REGIONAL"|"NATIONAL"|"LOCAL";
  regions: readonly string[];
  countryCodes: readonly string[];
};

export type RefreshPolicy = {
  intervalSeconds: number;
  jitterSeconds: number;
  maximumStaleSeconds: number;
};

export type RateLimitPolicy = {
  requests: number;
  perSeconds: number;
  burst: number;
};

export type RetryPolicy = {
  maximumAttempts: number;
  baseDelayMs: number;
  maximumDelayMs: number;
  backoff: "FIXED"|"EXPONENTIAL";
};

export type TimeoutPolicy = {
  requestTimeoutMs: number;
};

export type SourceProvider = {
  providerId: string;
  slug: string;
  displayName: string;
  legalName: string;
  description: string;
  homepageUrl: string;

  providerType: ProviderType;
  categories: readonly AtlasEventCategory[];
  capabilities: readonly ProviderCapability[];
  geographicCoverage: GeographicCoverage;
  languageCoverage: readonly string[];

  trustLevel: TrustLevel;
  lifecycleStatus: LifecycleStatus;
  activationStatus: ActivationStatus;
  legalReviewStatus: ReviewStatus;
  schemaReviewStatus: ReviewStatus;
  qualityReviewStatus: ReviewStatus;
  operationalReviewStatus: ReviewStatus;
  securityReviewStatus: ReviewStatus;
  publicDisplayPolicy: PublicDisplayPolicy;
  collectorConnected: boolean;

  collectionMethod: CollectionMethod;
  baseUrl: string | null;
  authenticationType: AuthenticationType;
  credentialReference: string | null;
  refreshPolicy: RefreshPolicy;
  rateLimitPolicy: RateLimitPolicy;
  retryPolicy: RetryPolicy;
  timeoutPolicy: TimeoutPolicy;

  licenseType: string;
  attributionRequired: boolean;
  attributionText: string;
  redistributionPolicy: RedistributionPolicy;
  retentionPolicy: RetentionPolicy;
  retentionDays: number | null;
  termsUrl: string;

  healthStatus: HealthStatus;
  lastSuccessfulCollectionAt: string | null;
  lastFailedCollectionAt: string | null;
  consecutiveFailureCount: number;
  lastHealthCheckAt: string | null;
  lastHealthCheckOutcome: HealthCheckOutcome | null;
  lastHealthMessage: string | null;
  disabledReason: string | null;

  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  extensions: Readonly<Record<string, ProviderExtensionValue>>;
};

export type SourceProviderInput = Omit<SourceProvider,
  "version"|"createdAt"|"updatedAt"|"createdBy"|"updatedBy"|
  "healthStatus"|"lastSuccessfulCollectionAt"|"lastFailedCollectionAt"|
  "consecutiveFailureCount"|"lastHealthCheckAt"|"lastHealthCheckOutcome"|"lastHealthMessage"
>;

export type ProviderValidationIssue = {
  code: string;
  field: string;
  message: string;
};

export type ProviderValidationResult = {
  valid: boolean;
  activationEligible: boolean;
  issues: readonly ProviderValidationIssue[];
};

export type ProviderFilter = {
  providerType?: ProviderType;
  category?: AtlasEventCategory;
  trustLevel?: TrustLevel;
  lifecycleStatus?: LifecycleStatus;
  healthStatus?: HealthStatus;
  geographicCoverage?: string;
  language?: string;
  publicDisplayEligible?: boolean;
};

export type ProviderVersionAction = "CREATED"|"UPDATED"|"LIFECYCLE_TRANSITION"|"ACTIVATED"|"SUSPENDED"|"RETIRED"|"HEALTH_RECORDED";
export type SourceProviderVersion = {
  providerId: string;
  version: number;
  action: ProviderVersionAction;
  recordedAt: string;
  actor: string;
  provider: SourceProvider;
};

export type ProviderHealthCheck = {
  outcome: HealthCheckOutcome;
  checkedAt: string;
  message: string;
};

export type InternalProviderView = Omit<SourceProvider, "credentialReference"> & {
  credentialConfigured: boolean;
};

export type PublicSourceDirectoryEntry = Pick<SourceProvider,
  "providerId"|"displayName"|"description"|"providerType"|"categories"|"trustLevel"|
  "healthStatus"|"attributionText"|"homepageUrl"|"geographicCoverage"|"languageCoverage"
>;
