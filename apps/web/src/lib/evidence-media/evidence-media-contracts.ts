export const MEDIA_TYPES=["OFFICIAL_IMAGE","SATELLITE_IMAGE","MAP","LOGO","CHART","GRAPH","INFOGRAPHIC","DOCUMENT","PDF","VIDEO","AUDIO","PRESS_RELEASE","SCREENSHOT","DATASET","OTHER"] as const;
export const MEDIA_STATUSES=["PENDING_VALIDATION","VERIFIED","BROKEN","DISABLED","EXPIRED"] as const;
export const MEDIA_QUALITIES=["ORIGINAL","HIGH","MEDIUM","LOW","UNKNOWN"] as const;
export const MEDIA_RIGHTS_POLICIES=["PUBLIC","ATTRIBUTION_REQUIRED","INTERNAL_ONLY","RESTRICTED","EXPIRED"] as const;
export const MEDIA_LICENSES=["PUBLIC_DOMAIN","CC0","CC_BY","CC_BY_SA","OFFICIAL_USE_POLICY","PROPRIETARY_LICENSED","RESTRICTED","UNKNOWN"] as const;
export const MEDIA_ORIGINS=["OFFICIAL_PROVIDER","OFFICIAL_SATELLITE","OFFICIAL_MAP","OFFICIAL_LOGO","LICENSED","OPEN_LICENSED","EVIDENCE_VISUALIZATION","THIRD_PARTY","AI_GENERATED"] as const;
export const MEDIA_RELATIONSHIPS=["FEATURED","EVIDENCE","CONTEXT","SOURCE_DOCUMENT","THUMBNAIL"] as const;
export const MEDIA_URL_STATUSES=["UNCHECKED","VERIFIED_REACHABLE","BROKEN"] as const;

export type MediaType=typeof MEDIA_TYPES[number];
export type MediaStatus=typeof MEDIA_STATUSES[number];
export type MediaQuality=typeof MEDIA_QUALITIES[number];
export type MediaRightsPolicy=typeof MEDIA_RIGHTS_POLICIES[number];
export type MediaLicense=typeof MEDIA_LICENSES[number];
export type MediaOrigin=typeof MEDIA_ORIGINS[number];
export type MediaRelationship=typeof MEDIA_RELATIONSHIPS[number];
export type MediaUrlStatus=typeof MEDIA_URL_STATUSES[number];

export type MediaRights={
  license:MediaLicense;
  licenseSummary:string;
  attributionRequired:boolean;
  attributionText:string;
  redistribution:"ALLOWED"|"ATTRIBUTION_REQUIRED"|"PROHIBITED"|"REVIEW_REQUIRED";
  expiresAt:string|null;
  termsUrl:string;
  usageRestrictions:readonly string[];
  policy:MediaRightsPolicy;
  publicDisplayEligible:boolean;
};

export type MediaSource={
  providerId:string;
  publisher:string;
  originalUrl:string;
  collectorReference:string;
  collectedAt:string;
  verifiedAt:string|null;
  contentType:string;
  checksum:string|null;
  urlStatus:MediaUrlStatus;
};

export type MediaVariant={
  variantId:string;
  purpose:"DISPLAY"|"THUMBNAIL"|"PREVIEW"|"ARCHIVE";
  url:string;
  contentType:string;
  width:number|null;
  height:number|null;
  byteSize:number|null;
};

export type MediaMetadata={
  width:number|null;
  height:number|null;
  durationSeconds:number|null;
  byteSize:number|null;
  pageCount:number|null;
  language:string|null;
};

export type MediaAsset={
  assetId:string;
  mediaType:MediaType;
  status:MediaStatus;
  quality:MediaQuality;
  origin:MediaOrigin;
  displayUrl:string;
  thumbnailUrl:string|null;
  privateUrl:string|null;
  caption:string;
  altText:string;
  source:MediaSource;
  rights:MediaRights;
  variants:readonly MediaVariant[];
  metadata:MediaMetadata;
  disabledReason:string|null;
  internalNotes:string|null;
  version:number;
  createdAt:string;
  updatedAt:string;
  createdBy:string;
  updatedBy:string;
};

export type MediaAssetInput=Omit<MediaAsset,"version"|"createdAt"|"updatedAt"|"createdBy"|"updatedBy">;
export type MediaReference={recordId:string;assetId:string;relationship:MediaRelationship};
export type MediaEvidence={reference:MediaReference;asset:MediaAsset};
export type MediaSelection={recordId:string;selected:MediaEvidence|null;candidatesEvaluated:number;reason:string};
export type MediaCollectionResult={providerId:string;collectorReference:string;collectedAt:string;candidates:readonly MediaAssetInput[];errors:readonly MediaValidationIssue[]};
export type MediaValidationIssue={code:string;field:string;message:string};
export type MediaValidationResult={valid:boolean;displayEligible:boolean;issues:readonly MediaValidationIssue[]};
export type MediaFilter={providerId?:string;mediaType?:MediaType;status?:MediaStatus;origin?:MediaOrigin;publicDisplayEligible?:boolean};
export type MediaVersionAction="CREATED"|"UPDATED"|"DISABLED";
export type MediaAssetVersion={assetId:string;version:number;action:MediaVersionAction;recordedAt:string;actor:string;asset:MediaAsset};

export type SafeMediaProjection={
  displayUrl:string;
  thumbnailUrl:string|null;
  caption:string;
  attribution:string;
  licenseSummary:string;
  mediaType:MediaType;
  verificationStatus:"VERIFIED";
};

export type ArticleMediaBinding={
  recordId:string;
  mediaReferences:readonly MediaReference[];
};
