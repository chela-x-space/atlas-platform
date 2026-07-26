import type { SourceProvider } from "./source-registry-contracts";

const reviewsPassed = {
  legalReviewStatus: "PASSED",
  schemaReviewStatus: "PASSED",
  qualityReviewStatus: "PASSED",
  operationalReviewStatus: "PASSED",
  securityReviewStatus: "PASSED",
} as const;

const reviewsPending = {
  legalReviewStatus: "PENDING",
  schemaReviewStatus: "NOT_STARTED",
  qualityReviewStatus: "NOT_STARTED",
  operationalReviewStatus: "NOT_STARTED",
  securityReviewStatus: "NOT_STARTED",
} as const;

const operationalDefaults = {
  authenticationType: "NONE",
  credentialReference: null,
  retryPolicy: { maximumAttempts: 3, baseDelayMs: 1_000, maximumDelayMs: 10_000, backoff: "EXPONENTIAL" },
  timeoutPolicy: { requestTimeoutMs: 15_000 },
  redistributionPolicy: "ATTRIBUTION_REQUIRED",
  retentionPolicy: "PERMANENT",
  retentionDays: null,
  healthStatus: "UNKNOWN",
  lastSuccessfulCollectionAt: null,
  lastFailedCollectionAt: null,
  consecutiveFailureCount: 0,
  lastHealthCheckAt: null,
  lastHealthCheckOutcome: null,
  lastHealthMessage: null,
  extensions: {},
} as const;

function audit(now: string) {
  return { version: 1, createdAt: now, updatedAt: now, createdBy: "atlas:v2-seed", updatedBy: "atlas:v2-seed" };
}

export function sourceRegistrySeeds(now = "2026-07-26T00:00:00.000Z"): SourceProvider[] {
  return [
    {
      ...operationalDefaults,...reviewsPassed,...audit(now),
      providerId:"provider:usgs",slug:"usgs",displayName:"U.S. Geological Survey",legalName:"U.S. Geological Survey",description:"Official United States earth science agency and earthquake authority.",homepageUrl:"https://www.usgs.gov/",
      providerType:"GOVERNMENT",categories:["earthquake"],capabilities:["EVENTS","GEOSPATIAL","HISTORICAL_BACKFILL"],geographicCoverage:{scope:"GLOBAL",regions:[],countryCodes:[]},languageCoverage:["en"],
      trustLevel:"OFFICIAL_PRIMARY",lifecycleStatus:"ACTIVE",activationStatus:"ACTIVE",publicDisplayPolicy:"ATTRIBUTION_REQUIRED",collectorConnected:true,
      collectionMethod:"REST_API",baseUrl:"https://earthquake.usgs.gov/",refreshPolicy:{intervalSeconds:60,jitterSeconds:5,maximumStaleSeconds:300},rateLimitPolicy:{requests:60,perSeconds:60,burst:10},
      licenseType:"US Government Work",attributionRequired:true,attributionText:"Earthquake data courtesy of the U.S. Geological Survey",termsUrl:"https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits",disabledReason:null,
    },
    {
      ...operationalDefaults,...reviewsPassed,...audit(now),
      providerId:"provider:noaa-nhc",slug:"noaa-nhc",displayName:"NOAA National Hurricane Center",legalName:"National Hurricane Center",description:"Official tropical cyclone authority for its defined service areas.",homepageUrl:"https://www.nhc.noaa.gov/",
      providerType:"WEATHER",categories:["cyclone"],capabilities:["ADVISORIES","EVENTS","FORECASTS","GEOSPATIAL"],geographicCoverage:{scope:"MULTI_REGION",regions:["Atlantic","Eastern Pacific","Central Pacific"],countryCodes:[]},languageCoverage:["en"],
      trustLevel:"OFFICIAL_PRIMARY",lifecycleStatus:"ACTIVE",activationStatus:"ACTIVE",publicDisplayPolicy:"ATTRIBUTION_REQUIRED",collectorConnected:true,
      collectionMethod:"RSS",baseUrl:"https://www.nhc.noaa.gov/",refreshPolicy:{intervalSeconds:300,jitterSeconds:15,maximumStaleSeconds:900},rateLimitPolicy:{requests:30,perSeconds:60,burst:5},
      licenseType:"US Government Work",attributionRequired:true,attributionText:"NOAA/National Hurricane Center",termsUrl:"https://www.weather.gov/disclaimer",disabledReason:null,
    },
    {
      ...operationalDefaults,...reviewsPassed,...audit(now),
      providerId:"provider:nasa",slug:"nasa",displayName:"NASA",legalName:"National Aeronautics and Space Administration",description:"Official United States civil space agency publications.",homepageUrl:"https://www.nasa.gov/",
      providerType:"SPACE",categories:["space","science","technology"],capabilities:["PUBLICATIONS"],geographicCoverage:{scope:"GLOBAL",regions:[],countryCodes:[]},languageCoverage:["en"],
      trustLevel:"OFFICIAL_PRIMARY",lifecycleStatus:"ACTIVE",activationStatus:"ACTIVE",publicDisplayPolicy:"ATTRIBUTION_REQUIRED",collectorConnected:true,
      collectionMethod:"RSS",baseUrl:"https://www.nasa.gov/",refreshPolicy:{intervalSeconds:900,jitterSeconds:30,maximumStaleSeconds:3600},rateLimitPolicy:{requests:30,perSeconds:60,burst:5},
      licenseType:"NASA Media Usage Guidelines",attributionRequired:true,attributionText:"National Aeronautics and Space Administration (NASA)",termsUrl:"https://www.nasa.gov/nasa-brand-center/images-and-media/",disabledReason:null,
    },
    {
      ...operationalDefaults,...reviewsPending,...audit(now),
      providerId:"provider:cisa",slug:"cisa",displayName:"CISA",legalName:"Cybersecurity and Infrastructure Security Agency",description:"Official United States cybersecurity advisories and vulnerability publications.",homepageUrl:"https://www.cisa.gov/",
      providerType:"CYBERSECURITY",categories:["cyber"],capabilities:["ADVISORIES","PUBLICATIONS"],geographicCoverage:{scope:"NATIONAL",regions:[],countryCodes:["US"]},languageCoverage:["en"],
      trustLevel:"OFFICIAL_PRIMARY",lifecycleStatus:"DRAFT",activationStatus:"REGISTERED",publicDisplayPolicy:"INTERNAL_ONLY",collectorConnected:false,
      collectionMethod:"REST_API",baseUrl:"https://www.cisa.gov/",refreshPolicy:{intervalSeconds:3600,jitterSeconds:60,maximumStaleSeconds:86400},rateLimitPolicy:{requests:10,perSeconds:60,burst:2},
      licenseType:"Review required",attributionRequired:true,attributionText:"Cybersecurity and Infrastructure Security Agency (CISA)",termsUrl:"https://www.cisa.gov/about/website-policies",disabledReason:"Collector and governance reviews are not complete",
    },
    {
      ...operationalDefaults,...reviewsPending,...audit(now),
      providerId:"provider:who",slug:"who",displayName:"World Health Organization",legalName:"World Health Organization",description:"Official international public-health publications and outbreak notices.",homepageUrl:"https://www.who.int/",
      providerType:"HEALTH",categories:["health"],capabilities:["PUBLICATIONS","ADVISORIES"],geographicCoverage:{scope:"GLOBAL",regions:[],countryCodes:[]},languageCoverage:["en"],
      trustLevel:"OFFICIAL_PRIMARY",lifecycleStatus:"DRAFT",activationStatus:"REGISTERED",publicDisplayPolicy:"INTERNAL_ONLY",collectorConnected:false,
      collectionMethod:"REST_API",baseUrl:"https://www.who.int/",refreshPolicy:{intervalSeconds:3600,jitterSeconds:60,maximumStaleSeconds:86400},rateLimitPolicy:{requests:10,perSeconds:60,burst:2},
      licenseType:"WHO copyright review required",attributionRequired:true,attributionText:"World Health Organization",termsUrl:"https://www.who.int/about/policies/publishing/copyright",disabledReason:"Stable collection contract and legal review are not complete",
    },
  ];
}
