export const BREAKING_CATEGORIES=Object.freeze(["earthquake","weather","volcano","disaster","conflict","economy","ai","cyber","space","health","marine","aviation","energy"]);
export const BREAKING_PRIORITIES=Object.freeze(["critical","high","medium","information"]);
const PRIORITY_ORDER={critical:0,high:1,medium:2,information:3};
const PARAMETERS=new Set(["category","priority","country","provider","limit"]);

export function earthquakePriority(magnitude){
  if(typeof magnitude!=="number"||!Number.isFinite(magnitude))return "information";
  if(magnitude>=7.5)return "critical";if(magnitude>=6.5)return "high";if(magnitude>=5.5)return "medium";return "information";
}
export function weatherPriority(title,status=""){
  const value=`${title} ${status}`.toLowerCase();
  if(value.includes("hurricane warning"))return "critical";
  if(value.includes("tropical storm"))return "high";
  return "medium";
}
export function aiReleasePriority(release){
  const version=String(release.version??"").replace(/^v/i,"");
  const parts=version.split(".").map(Number);
  return (release.category==="model"||release.category==="agent")&&parts.length>=2&&Number.isFinite(parts[0])&&parts[0]>=1&&parts.slice(1).every(part=>part===0)?"medium":"information";
}
function mapCategory(item){
  if(item.category==="earthquake")return"earthquake";
  if(item.category==="cyclone"||item.category==="weather"||item.category==="climate")return"weather";
  if(item.category==="space"||item.category==="science"||item.category==="earth-observation")return"space";
  if(item.category==="technology"||item.category==="news")return"ai";
  if(item.category==="market")return"economy";
  if(item.category==="wildfire"||item.category==="flood"||item.category==="unknown")return"disaster";
  return BREAKING_CATEGORIES.includes(item.category)?item.category:"disaster";
}
function timelinePriority(item,category){
  if(category==="earthquake")return earthquakePriority(item.metadata?.magnitude);
  if(category==="weather")return weatherPriority(`${item.title} ${item.summary}`,item.status);
  return item.severity==="critical"?"critical":item.severity==="high"?"high":item.severity==="moderate"?"medium":"information";
}
function timelineEvent(item){
  const category=mapCategory(item),priority=timelinePriority(item,category);
  if(category==="earthquake"&&priority==="information")return null;
  if(!item.sourceUrl)return null;
  const canonicalId=item.relatedEventId??item.relatedReportId??item.id;
  const title=item.sourceId==="usgs-earthquakes"&&item.summary?item.summary:item.title;
  return {canonicalId,category,priority,title,providerId:item.sourceId,providerName:item.sourceName,country:item.countries?.[0]??null,region:item.location??null,latitude:item.coordinates?.latitude??null,longitude:item.coordinates?.longitude??null,publishedAt:item.occurredAt,updatedAt:item.updatedAt,verified:true,sourceUrl:item.sourceUrl,relatedTimelineEvent:item.id,eventDetailUrl:`/app/events/${encodeURIComponent(canonicalId)}`,timelineUrl:`/app/timeline?search=${encodeURIComponent(title)}`,graphUrl:`/app/graph/${encodeURIComponent(canonicalId)}`,provenance:{providerId:item.sourceId,sourceUrl:item.sourceUrl,attribution:item.attribution,sourceRecordId:item.metadata?.sourceRecordId??canonicalId}};
}
function aiEvent(release){
  return {canonicalId:release.id,category:"ai",priority:aiReleasePriority(release),title:release.name,providerId:release.provenance.providerId,providerName:release.company,country:null,region:null,latitude:null,longitude:null,publishedAt:release.releaseDate,updatedAt:release.releaseDate,verified:true,sourceUrl:release.provenance.sourceUrl,relatedTimelineEvent:null,eventDetailUrl:null,timelineUrl:"/app/ai",graphUrl:null,provenance:{providerId:release.provenance.providerId,sourceUrl:release.provenance.sourceUrl,attribution:release.provenance.attribution,sourceRecordId:release.id}};
}
function healthStatus(value){
  if(value==="online"||value==="operational")return"operational";
  if(value==="configuration_required")return"configuration_required";
  if(value==="disabled")return"disabled";
  if(value==="degraded"||value==="rate_limited"||value==="paused")return"degraded";
  return"unavailable";
}
export function generateBreakingSnapshot(inputs,generatedAt){
  const now=Date.parse(generatedAt);if(!Number.isFinite(now))throw new TypeError("generatedAt must be valid");
  const timelineBoundary=now-24*60*60_000,releaseBoundary=now-7*24*60*60_000;
  const timeline=inputs.timelineItems.filter(item=>item.verificationStatus==="verified"&&Date.parse(item.occurredAt)>=timelineBoundary&&Date.parse(item.occurredAt)<=now).map(timelineEvent).filter(Boolean);
  const releases=inputs.aiReleases.filter(item=>Date.parse(item.releaseDate)>=releaseBoundary&&Date.parse(item.releaseDate)<=now).map(aiEvent);
  const candidates=[...timeline,...releases];
  const unique=new Map();
  for(const event of candidates.sort((a,b)=>a.canonicalId.localeCompare(b.canonicalId)))if(!unique.has(event.canonicalId))unique.set(event.canonicalId,event);
  const events=[...unique.values()].sort((a,b)=>PRIORITY_ORDER[a.priority]-PRIORITY_ORDER[b.priority]||Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||a.canonicalId.localeCompare(b.canonicalId));
  const providers=[
    ...inputs.timelineProviders.map(item=>({providerId:item.sourceId,providerName:item.sourceName,status:healthStatus(item.status),stale:item.stale,itemCount:item.itemCount,checkedAt:item.checkedAt,message:item.errorMessage})),
    ...inputs.aiProviders.map(item=>({providerId:item.id,providerName:item.name,status:healthStatus(item.state),stale:false,itemCount:item.itemCount,checkedAt:item.checkedAt,message:item.message??null})),
  ].sort((a,b)=>a.providerId.localeCompare(b.providerId));
  const dedupedProviders=[...new Map(providers.map(item=>[item.providerId,item])).values()];
  const partial=dedupedProviders.some(item=>item.status!=="operational"||item.stale);
  return {breakingVersion:"atlas-breaking-news-v1",generatedAt,partial,stale:false,providerCount:dedupedProviders.length,activeBreakingEvents:events.length,status:{earthquakes:events.filter(item=>item.category==="earthquake").length,storms:events.filter(item=>item.category==="weather").length,aiReleases:events.filter(item=>item.category==="ai"&&item.relatedTimelineEvent===null).length,spaceEvents:events.filter(item=>item.category==="space").length},events,providers:dedupedProviders,inputSummary:{timelineRecords:inputs.timelineItems.length,aiReleases:inputs.aiReleases.length,excludedRecords:inputs.timelineItems.length+inputs.aiReleases.length-candidates.length,duplicateRecords:candidates.length-events.length}};
}
export function filterBreakingEvents(events,filters){
  return events.filter(item=>(!filters.categories.length||filters.categories.includes(item.category))&&(!filters.priorities.length||filters.priorities.includes(item.priority))&&(!filters.country||`${item.country??""} ${item.region??""}`.toLowerCase().includes(filters.country.toLowerCase()))&&(!filters.provider||item.providerId===filters.provider)).slice(0,filters.limit);
}
export function parseBreakingQuery(params){
  for(const key of params.keys())if(!PARAMETERS.has(key))return{ok:false,code:"INVALID_PARAMETERS",message:`Unsupported parameter: ${key}`};
  const values=(key)=>[...new Set((params.get(key)??"").split(",").map(value=>value.trim()).filter(Boolean))];
  const categories=values("category"),priorities=values("priority"),rawLimit=params.get("limit"),limit=rawLimit===null?100:Number(rawLimit);
  if(categories.some(value=>!BREAKING_CATEGORIES.includes(value)))return{ok:false,code:"INVALID_CATEGORY",message:"Unknown breaking-news category"};
  if(priorities.some(value=>!BREAKING_PRIORITIES.includes(value)))return{ok:false,code:"INVALID_PRIORITY",message:"Unknown priority"};
  if(!Number.isInteger(limit)||limit<1||limit>200)return{ok:false,code:"INVALID_LIMIT",message:"limit must be an integer from 1 to 200"};
  return{ok:true,filters:{categories,priorities,country:params.get("country")??"",provider:params.get("provider")??"",limit}};
}
