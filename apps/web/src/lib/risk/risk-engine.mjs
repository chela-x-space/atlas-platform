import { BREAKING_CATEGORIES, mapBreakingCategory, timelinePriority } from "../breaking/breaking-logic.mjs";

export const RISK_LEVELS=Object.freeze(["CRITICAL","HIGH","ELEVATED","WATCH","INFORMATIONAL"]);
const LEVEL_ORDER={CRITICAL:0,HIGH:1,ELEVATED:2,WATCH:3,INFORMATIONAL:4};
const PRIORITY_ORDER={critical:0,high:1,medium:2,information:3};
const RESOLVED=new Set(["resolved","closed","inactive","expired","cancelled","ended"]);
const ACTIVE_WARNING=new Set(["warning","emergency","active","ongoing"]);
const EXTREME_ALERTS=new Set(["extreme","emergency","red"]);

export const RISK_RULES=Object.freeze([
  {ruleId:"RISK-OFFICIAL-EXTREME",ruleVersion:"1.0.0",category:"all",inputFields:["metadata.alert","metadata.warningLevel"],resultingLevel:"CRITICAL",explanationTemplate:"Official provider alert state is extreme, emergency, or red.",precedence:1},
  {ruleId:"RISK-SEVERITY-CRITICAL",ruleVersion:"1.0.0",category:"all",inputFields:["severity"],resultingLevel:"CRITICAL",explanationTemplate:"Canonical event severity is critical.",precedence:2},
  {ruleId:"RISK-PRIORITY-CRITICAL",ruleVersion:"1.0.0",category:"all",inputFields:["canonicalPriority"],resultingLevel:"CRITICAL",explanationTemplate:"Canonical ATLAS priority is critical.",precedence:3},
  {ruleId:"RISK-SEVERITY-HIGH",ruleVersion:"1.0.0",category:"all",inputFields:["severity"],resultingLevel:"HIGH",explanationTemplate:"Canonical event severity is high.",precedence:4},
  {ruleId:"RISK-PRIORITY-HIGH",ruleVersion:"1.0.0",category:"all",inputFields:["canonicalPriority"],resultingLevel:"HIGH",explanationTemplate:"Canonical ATLAS priority is high.",precedence:5},
  {ruleId:"RISK-ACTIVE-REGIONAL-WARNING",ruleVersion:"1.0.0",category:"all",inputFields:["status","region","countryCode"],resultingLevel:"ELEVATED",explanationTemplate:"An active official warning has a verified regional or country scope.",precedence:6},
  {ruleId:"RISK-PRIORITY-MEDIUM",ruleVersion:"1.0.0",category:"all",inputFields:["canonicalPriority"],resultingLevel:"ELEVATED",explanationTemplate:"Canonical ATLAS priority is medium.",precedence:7},
  {ruleId:"RISK-RESOLVED",ruleVersion:"1.0.0",category:"all",inputFields:["status"],resultingLevel:"INFORMATIONAL",explanationTemplate:"Canonical event status is resolved or inactive.",precedence:8},
  {ruleId:"RISK-RECENT-VERIFIED",ruleVersion:"1.0.0",category:"all",inputFields:["occurredAt","verificationStatus"],resultingLevel:"WATCH",explanationTemplate:"Verified operational event was published within the last 24 hours without a severe designation.",precedence:9},
  {ruleId:"RISK-INFORMATIONAL-FALLBACK",ruleVersion:"1.0.0",category:"all",inputFields:["severity","status","canonicalPriority"],resultingLevel:"INFORMATIONAL",explanationTemplate:"No explicit severe, warning, or recent operational designation is available; classified conservatively.",precedence:10},
]);

function text(value){return typeof value==="string"?value.trim().toLowerCase():""}
function officialAlert(item){return text(item.metadata?.alert??item.metadata?.warningLevel)}
function chooseRule(item,priority,evaluatedAt){
  if(EXTREME_ALERTS.has(officialAlert(item)))return RISK_RULES[0];
  if(item.severity==="critical")return RISK_RULES[1];
  if(priority==="critical")return RISK_RULES[2];
  if(item.severity==="high")return RISK_RULES[3];
  if(priority==="high")return RISK_RULES[4];
  const status=text(item.status);
  if(ACTIVE_WARNING.has(status)&&(item.location||item.countries?.length))return RISK_RULES[5];
  if(priority==="medium")return RISK_RULES[6];
  if(RESOLVED.has(status))return RISK_RULES[7];
  const age=Date.parse(evaluatedAt)-Date.parse(item.occurredAt);
  if(item.verificationStatus==="verified"&&age>=0&&age<=86_400_000)return RISK_RULES[8];
  return RISK_RULES[9];
}
function activity(status){return RESOLVED.has(text(status))?"resolved":"active"}
export function evaluateRiskItem(item,evaluatedAt){
  if(!item||item.verificationStatus!=="verified"||!Number.isFinite(Date.parse(evaluatedAt)))return null;
  const category=mapBreakingCategory(item),priority=timelinePriority(item,category),rule=chooseRule(item,priority,evaluatedAt);
  const canonicalId=item.relatedEventId??item.relatedReportId??item.id;
  const lat=Number.isFinite(item.coordinates?.latitude)?item.coordinates.latitude:null;
  const lon=Number.isFinite(item.coordinates?.longitude)?item.coordinates.longitude:null;
  const canonicalTarget=item.relatedEventId?`/app/events/${encodeURIComponent(canonicalId)}`:`/app/timeline?search=${encodeURIComponent(item.title)}`;
  return {canonicalId,level:rule.resultingLevel,ruleId:rule.ruleId,ruleVersion:rule.ruleVersion,explanation:rule.explanationTemplate,evaluatedAt,sourceEventId:item.id,sourceCategory:category,sourceAttribution:item.attribution,canonicalTarget,title:item.title,providerId:item.sourceId,providerName:item.sourceName,priority,location:item.location??item.countries?.[0]??null,occurredAt:item.occurredAt,updatedAt:item.updatedAt,activity:activity(item.status),latitude:lat,longitude:lon,mapTarget:lat!==null&&lon!==null?`/app/map?event=${encodeURIComponent(canonicalId)}&focus=1`:null,timelineTarget:`/app/timeline?search=${encodeURIComponent(item.title)}`,breakingTarget:`/app/breaking?category=${encodeURIComponent(category)}`,stale:Boolean(item.stale)};
}
export function sortRiskAlerts(alerts){return[...alerts].sort((a,b)=>LEVEL_ORDER[a.level]-LEVEL_ORDER[b.level]||PRIORITY_ORDER[a.priority]-PRIORITY_ORDER[b.priority]||Date.parse(b.occurredAt)-Date.parse(a.occurredAt)||a.canonicalId.localeCompare(b.canonicalId))}
export function filterRiskAlerts(alerts,filters){
  const search=filters.search.trim().toLowerCase(),from=filters.from?Date.parse(filters.from):null,to=filters.to?Date.parse(filters.to):null;
  return sortRiskAlerts(alerts).filter(item=>(!filters.levels.length||filters.levels.includes(item.level))&&(!filters.categories.length||filters.categories.includes(item.sourceCategory))&&(!filters.provider||item.providerId===filters.provider)&&(!filters.activity||item.activity===filters.activity)&&(!filters.coordinates||(filters.coordinates==="available"?(item.latitude!==null&&item.longitude!==null):(item.latitude===null||item.longitude===null)))&&(from===null||Date.parse(item.occurredAt)>=from)&&(to===null||Date.parse(item.occurredAt)<=to)&&(!search||[item.title,item.location??"",item.providerName,item.providerId].join(" ").toLowerCase().includes(search))).slice(0,filters.limit);
}
export function generateRiskSnapshot(input,evaluatedAt){
  const alerts=sortRiskAlerts(input.items.map(item=>evaluateRiskItem(item,evaluatedAt)).filter(Boolean));
  const stale=input.providers.some(provider=>provider.stale)||alerts.some(item=>item.stale);
  const degraded=stale||input.providers.some(provider=>provider.status!=="online");
  const counts=Object.fromEntries(RISK_LEVELS.map(level=>[level,alerts.filter(item=>item.level===level).length]));
  return{riskVersion:"atlas-risk-v1.1",evaluatedAt,degraded,stale,alerts,summary:{totalEvaluated:alerts.length,counts,categories:[...new Set(alerts.map(item=>item.sourceCategory))].sort(),evaluatedAt,degraded,stale},rules:RISK_RULES,providers:input.providers.map(provider=>({sourceId:provider.sourceId,sourceName:provider.sourceName,status:provider.status,stale:provider.stale}))};
}
const PARAMS=new Set(["level","category","provider","from","to","activity","coordinates","search","limit"]);
export function parseRiskQuery(params){
  for(const key of params.keys())if(!PARAMS.has(key))return{ok:false,code:"INVALID_PARAMETERS",message:`Unsupported parameter: ${key}`};
  const list=key=>[...new Set((params.get(key)??"").split(",").map(x=>x.trim()).filter(Boolean))];
  const levels=list("level"),categories=list("category"),activity=params.get("activity")??"",coordinates=params.get("coordinates")??"",limit=Number(params.get("limit")??100);
  const search=params.get("search")??"";
  if(levels.some(x=>!RISK_LEVELS.includes(x))||categories.some(x=>!BREAKING_CATEGORIES.includes(x))||!["","active","resolved"].includes(activity)||!["","available","unavailable"].includes(coordinates)||!Number.isInteger(limit)||limit<1||limit>200||search.length>200)return{ok:false,code:"INVALID_PARAMETERS",message:"Risk filters are invalid"};
  const from=params.get("from"),to=params.get("to");if((from&&!Number.isFinite(Date.parse(from)))||(to&&!Number.isFinite(Date.parse(to)))||(from&&to&&Date.parse(from)>Date.parse(to)))return{ok:false,code:"INVALID_PARAMETERS",message:"Risk time range is invalid"};
  return{ok:true,filters:{levels,categories,provider:params.get("provider")??"",from,to,activity,coordinates,search,limit}};
}
