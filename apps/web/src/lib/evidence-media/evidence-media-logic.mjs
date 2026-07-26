const mediaTypes=new Set(["OFFICIAL_IMAGE","SATELLITE_IMAGE","MAP","LOGO","CHART","GRAPH","INFOGRAPHIC","DOCUMENT","PDF","VIDEO","AUDIO","PRESS_RELEASE","SCREENSHOT","DATASET","OTHER"]);
const statuses=new Set(["PENDING_VALIDATION","VERIFIED","BROKEN","DISABLED","EXPIRED"]);
const qualities=new Set(["ORIGINAL","HIGH","MEDIUM","LOW","UNKNOWN"]);
const origins=new Set(["OFFICIAL_PROVIDER","OFFICIAL_SATELLITE","OFFICIAL_MAP","OFFICIAL_LOGO","LICENSED","OPEN_LICENSED","EVIDENCE_VISUALIZATION","THIRD_PARTY","AI_GENERATED"]);
const licenses=new Set(["PUBLIC_DOMAIN","CC0","CC_BY","CC_BY_SA","OFFICIAL_USE_POLICY","PROPRIETARY_LICENSED","RESTRICTED","UNKNOWN"]);
const policies=new Set(["PUBLIC","ATTRIBUTION_REQUIRED","INTERNAL_ONLY","RESTRICTED","EXPIRED"]);
const redistributionPolicies=new Set(["ALLOWED","ATTRIBUTION_REQUIRED","PROHIBITED","REVIEW_REQUIRED"]);
const urlStatuses=new Set(["UNCHECKED","VERIFIED_REACHABLE","BROKEN"]);
const relationships=new Set(["FEATURED","EVIDENCE","CONTEXT","SOURCE_DOCUMENT","THUMBNAIL"]);
const supportedContentTypes=new Set(["image/jpeg","image/png","image/webp","image/gif","image/svg+xml","application/pdf","video/mp4","video/webm","audio/mpeg","audio/mp4","text/html","application/json","text/csv"]);
const priority=new Map(["OFFICIAL_PROVIDER","OFFICIAL_SATELLITE","OFFICIAL_MAP","OFFICIAL_LOGO","LICENSED","OPEN_LICENSED","EVIDENCE_VISUALIZATION"].map((value,index)=>[value,index]));

function issue(code,field,message){return{code,field,message}}
function text(value){return typeof value==="string"&&value.trim().length>0}
function https(value,nullable=false){if(nullable&&(value===null||value===""))return true;if(!text(value))return false;try{return new URL(value).protocol==="https:"}catch{return false}}
function timestamp(value,nullable=false){return nullable&&value===null||text(value)&&Number.isFinite(Date.parse(value))}
function nonnegative(value,nullable=true){return nullable&&value===null||Number.isInteger(value)&&value>=0}

export function validateMediaAsset(asset,{knownProviderIds=[],maximumBytes=25_000_000}={}){
  const issues=[],known=new Set(knownProviderIds);
  if(!text(asset?.assetId)||!/^media:[a-z0-9]+(?:[-:][a-z0-9]+)*$/.test(asset.assetId))issues.push(issue("INVALID_MEDIA_ID","assetId","assetId must use media:<stable-id> format"));
  if(!mediaTypes.has(asset?.mediaType))issues.push(issue("UNSUPPORTED_MEDIA_TYPE","mediaType","Media type is not supported"));
  if(!statuses.has(asset?.status))issues.push(issue("INVALID_MEDIA_STATUS","status","Media status is not supported"));
  if(!qualities.has(asset?.quality))issues.push(issue("INVALID_MEDIA_QUALITY","quality","Media quality is not supported"));
  if(!origins.has(asset?.origin))issues.push(issue("INVALID_MEDIA_ORIGIN","origin","Media origin is not supported"));
  if(asset?.origin==="AI_GENERATED")issues.push(issue("AI_MEDIA_PROHIBITED","origin","AI-generated media cannot be canonical evidence"));
  if(!https(asset?.displayUrl))issues.push(issue("INVALID_MEDIA_URL","displayUrl","Display URL must use HTTPS"));
  if(!https(asset?.thumbnailUrl,true))issues.push(issue("INVALID_MEDIA_URL","thumbnailUrl","Thumbnail URL must use HTTPS"));
  if(!https(asset?.privateUrl,true))issues.push(issue("INVALID_MEDIA_URL","privateUrl","Private URL must use HTTPS"));
  if(!text(asset?.caption)||!text(asset?.altText))issues.push(issue("MISSING_PRESENTATION_TEXT","caption","Caption and alternative text are required"));
  if(!text(asset?.source?.providerId)||!known.has(asset.source.providerId))issues.push(issue("UNKNOWN_PROVIDER","source.providerId","Media must reference a known Source Registry provider"));
  if(!text(asset?.source?.publisher)||!https(asset?.source?.originalUrl)||!text(asset?.source?.collectorReference))issues.push(issue("INVALID_PROVENANCE","source","Publisher, original HTTPS URL, and collector reference are required"));
  if(!timestamp(asset?.source?.collectedAt)||!timestamp(asset?.source?.verifiedAt,true))issues.push(issue("INVALID_PROVENANCE_TIME","source","Collection and verification timestamps are invalid"));
  if(!supportedContentTypes.has(asset?.source?.contentType))issues.push(issue("INVALID_CONTENT_TYPE","source.contentType","Content type is not supported"));
  if(!urlStatuses.has(asset?.source?.urlStatus))issues.push(issue("INVALID_URL_STATUS","source.urlStatus","URL validation status is not supported"));
  if(asset?.source?.urlStatus==="BROKEN"||asset?.status==="BROKEN")issues.push(issue("BROKEN_MEDIA_URL","source.urlStatus","Broken media cannot be registered as evidence"));
  if(asset?.status==="VERIFIED"&&asset?.source?.urlStatus!=="VERIFIED_REACHABLE")issues.push(issue("URL_NOT_VERIFIED","source.urlStatus","Verified media requires a successful URL check"));
  const rights=asset?.rights;
  if(!licenses.has(rights?.license)||!policies.has(rights?.policy)||!text(rights?.licenseSummary)||!https(rights?.termsUrl))issues.push(issue("INVALID_MEDIA_RIGHTS","rights","License, policy, summary, and HTTPS terms URL are required"));
  if(!redistributionPolicies.has(rights?.redistribution))issues.push(issue("INVALID_REDISTRIBUTION_RIGHTS","rights.redistribution","Redistribution policy is required"));
  if(rights?.attributionRequired&&!text(rights?.attributionText))issues.push(issue("MISSING_MEDIA_ATTRIBUTION","rights.attributionText","Required attribution is missing"));
  if(!Array.isArray(rights?.usageRestrictions))issues.push(issue("INVALID_USAGE_RESTRICTIONS","rights.usageRestrictions","Usage restrictions must be explicit"));
  if(!timestamp(rights?.expiresAt,true))issues.push(issue("INVALID_RIGHTS_EXPIRATION","rights.expiresAt","Rights expiration is invalid"));
  if(rights?.expiresAt&&Date.parse(rights.expiresAt)<=Date.parse(asset?.source?.collectedAt))issues.push(issue("EXPIRED_MEDIA_RIGHTS","rights.expiresAt","Rights expired before collection"));
  if(rights?.publicDisplayEligible&&["INTERNAL_ONLY","RESTRICTED","EXPIRED"].includes(rights?.policy))issues.push(issue("INVALID_PUBLIC_DISPLAY_RIGHTS","rights.publicDisplayEligible","Restricted rights cannot be publicly displayed"));
  if(!nonnegative(asset?.metadata?.width)||!nonnegative(asset?.metadata?.height)||!nonnegative(asset?.metadata?.durationSeconds)||!nonnegative(asset?.metadata?.byteSize)||!nonnegative(asset?.metadata?.pageCount))issues.push(issue("INVALID_MEDIA_METADATA","metadata","Media dimensions, duration, size, and page count must be non-negative"));
  if((asset?.metadata?.byteSize??0)>maximumBytes)issues.push(issue("MEDIA_TOO_LARGE","metadata.byteSize",`Media exceeds the ${maximumBytes} byte policy`));
  if(!Array.isArray(asset?.variants)||asset.variants.some(variant=>!text(variant.variantId)||!https(variant.url)||!supportedContentTypes.has(variant.contentType)))issues.push(issue("INVALID_MEDIA_VARIANT","variants","Variants require stable identity, HTTPS URLs, and supported content types"));
  return{valid:issues.length===0,displayEligible:issues.length===0&&asset.status==="VERIFIED"&&Boolean(rights?.publicDisplayEligible),issues};
}

export function mediaDuplicateIssues(asset,assets){
  const issues=[];
  if(assets.some(item=>item.assetId===asset.assetId))issues.push(issue("DUPLICATE_MEDIA_ID","assetId","assetId is already registered"));
  if(assets.some(item=>item.source.originalUrl===asset.source.originalUrl))issues.push(issue("DUPLICATE_MEDIA_URL","source.originalUrl","Original media URL is already registered"));
  if(asset.source.checksum&&assets.some(item=>item.source.checksum&&item.source.checksum===asset.source.checksum))issues.push(issue("DUPLICATE_MEDIA_CHECKSUM","source.checksum","Media checksum is already registered"));
  return issues;
}

export function rankMediaEvidence(evidence){
  return [...evidence].filter(item=>item.asset.status==="VERIFIED"&&item.asset.rights.publicDisplayEligible&&priority.has(item.asset.origin)&&item.asset.origin!=="AI_GENERATED").sort((left,right)=>
    priority.get(left.asset.origin)-priority.get(right.asset.origin)||
    Number(right.asset.source.verifiedAt!==null)-Number(left.asset.source.verifiedAt!==null)||
    (Date.parse(right.asset.source.verifiedAt??right.asset.source.collectedAt)||0)-(Date.parse(left.asset.source.verifiedAt??left.asset.source.collectedAt)||0)||
    left.asset.assetId.localeCompare(right.asset.assetId)
  );
}

export function selectEvidenceMedia(recordId,evidence){
  const matching=evidence.filter(item=>item.reference.recordId===recordId),ranked=rankMediaEvidence(matching);
  return{recordId,selected:ranked[0]??null,candidatesEvaluated:matching.length,reason:ranked.length?`Selected ${ranked[0].asset.origin} by deterministic media priority`:"No display-eligible evidence media"};
}

export function toSafeMediaProjection(asset){
  if(asset.status!=="VERIFIED"||!asset.rights.publicDisplayEligible||["INTERNAL_ONLY","RESTRICTED","EXPIRED"].includes(asset.rights.policy)||asset.origin==="AI_GENERATED")return null;
  return{displayUrl:asset.displayUrl,thumbnailUrl:asset.thumbnailUrl,caption:asset.caption,attribution:asset.rights.attributionText,licenseSummary:asset.rights.licenseSummary,mediaType:asset.mediaType,verificationStatus:"VERIFIED"};
}

export function filterMediaAssets(assets,filters={}){
  return assets.filter(asset=>
    (!filters.providerId||asset.source.providerId===filters.providerId)&&
    (!filters.mediaType||asset.mediaType===filters.mediaType)&&
    (!filters.status||asset.status===filters.status)&&
    (!filters.origin||asset.origin===filters.origin)&&
    (filters.publicDisplayEligible===undefined||Boolean(toSafeMediaProjection(asset))===filters.publicDisplayEligible)
  ).sort((a,b)=>a.assetId.localeCompare(b.assetId));
}

export function bindArticleMedia(recordId,assetIds,relationship="EVIDENCE"){
  if(!text(recordId)||!relationships.has(relationship))throw new Error("Invalid article media binding");
  return{recordId,mediaReferences:[...new Set(assetIds)].sort().map(assetId=>({recordId,assetId,relationship}))};
}
