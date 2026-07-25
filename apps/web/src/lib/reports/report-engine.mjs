import {BREAKING_CATEGORIES} from "../breaking/breaking-logic.mjs";
import {RISK_LEVELS} from "../risk/risk-engine.mjs";

export const REPORT_TYPES=Object.freeze([
  {id:"daily-global",label:"Daily Global Report",defaultHistory:"24h",categories:[],description:"Verified global events from the last 24 hours."},
  {id:"weekly-global",label:"Weekly Global Report",defaultHistory:"7d",categories:[],description:"Verified global events from the last seven days."},
  {id:"ai-technology",label:"AI Technology Report",defaultHistory:"30d",categories:["ai"],description:"Verified AI and technology records."},
  {id:"cybersecurity",label:"Cybersecurity Report",defaultHistory:"30d",categories:["cyber"],description:"Verified cybersecurity records."},
  {id:"natural-disaster",label:"Natural Disaster Report",defaultHistory:"30d",categories:["earthquake","weather","volcano","disaster"],description:"Verified natural hazard and disaster records."},
  {id:"space-activity",label:"Space Activity Report",defaultHistory:"30d",categories:["space"],description:"Verified space activity records."},
  {id:"breaking-news",label:"Breaking News Report",defaultHistory:"24h",categories:[],description:"Current verified operational events ordered by canonical priority."},
  {id:"risk-summary",label:"Risk Summary Report",defaultHistory:"30d",categories:[],description:"Verified events grouped by deterministic ATLAS risk level."},
]);
const TYPE_IDS=new Set(REPORT_TYPES.map(x=>x.id)),HISTORY=new Set(["today","24h","7d","30d"]);
function boundary(history,to){const end=Date.parse(to);if(history==="today"){const d=new Date(end);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())}return end-({"24h":1,"7d":7,"30d":30}[history])*86_400_000}
function counted(items,key,order=[]){const counts=new Map();for(const item of items){const value=item[key];if(value)counts.set(value,(counts.get(value)??0)+1)}return[...counts].map(([value,count])=>({value,count})).sort((a,b)=>b.count-a.count||(order.indexOf(a.value)-order.indexOf(b.value))||String(a.value).localeCompare(String(b.value)))}
export function filterReportAlerts(alerts,filters,generatedAt){
  const definition=REPORT_TYPES.find(x=>x.id===filters.type),from=boundary(filters.history,generatedAt),search=filters.search.trim().toLowerCase(),region=filters.region.trim().toLowerCase();
  const allowed=filters.categories.length?filters.categories:definition.categories;
  return alerts.filter(x=>Date.parse(x.occurredAt)>=from&&Date.parse(x.occurredAt)<=Date.parse(generatedAt)&&(!allowed.length||allowed.includes(x.sourceCategory))&&(!filters.provider||x.providerId===filters.provider)&&(!filters.risks.length||filters.risks.includes(x.level))&&(!region||(x.location??"").toLowerCase().includes(region))&&(!search||[x.title,x.location??"",x.providerId,x.providerName,x.sourceAttribution].join(" ").toLowerCase().includes(search))).sort((a,b)=>Date.parse(b.occurredAt)-Date.parse(a.occurredAt)||a.canonicalId.localeCompare(b.canonicalId));
}
function event(alert){return{canonicalId:alert.canonicalId,title:alert.title,category:alert.sourceCategory,occurredAt:alert.occurredAt,location:alert.location,providerId:alert.providerId,providerName:alert.providerName,attribution:alert.sourceAttribution,riskLevel:alert.level,canonicalTarget:alert.canonicalTarget,timelineTarget:alert.timelineTarget}}
export function generateReport(input,filters){
  const definition=REPORT_TYPES.find(x=>x.id===filters.type);if(!definition)throw new TypeError("Unsupported report type");
  const alerts=filterReportAlerts(input.alerts,filters,input.generatedAt),events=alerts.map(event),coveredFrom=new Date(boundary(filters.history,input.generatedAt)).toISOString();
  const categories=counted(events,"category"),risks=counted(events,"riskLevel",RISK_LEVELS),regions=counted(events,"location").slice(0,10);
  const providerMap=new Map();for(const x of events){const current=providerMap.get(x.providerId)??{id:x.providerId,name:x.providerName,attribution:new Set()};current.attribution.add(x.attribution);providerMap.set(x.providerId,current)}
  const providers=[...providerMap.values()].map(x=>({id:x.id,name:x.name,attribution:[...x.attribution].sort()})).sort((a,b)=>a.id.localeCompare(b.id));
  const reportId=`${filters.type}:${coveredFrom}:${input.generatedAt}`;
  return{reportId,reportType:filters.type,title:definition.label,generatedAt:input.generatedAt,coveredFrom,coveredTo:input.generatedAt,sourceCount:providers.length,eventCount:events.length,categories:categories.map(x=>x.value),providers,canonicalReferences:events.map(x=>x.canonicalTarget),summary:{eventCount:events.length,sourceCount:providers.length,categoryCount:categories.length,regionCount:regions.length},keyEvents:events.slice(0,10),categoryBreakdown:categories.map(x=>({category:x.value,count:x.count})),timeline:events,riskBreakdown:risks.map(x=>({level:x.value,count:x.count})),topRegions:regions.map(x=>({region:x.value,count:x.count})),officialSources:providers.map(x=>({providerId:x.id,providerName:x.name,attribution:x.attribution})),degraded:input.degraded,stale:input.stale};
}
export function exportReport(report,format){
  if(format==="json")return JSON.stringify(report,null,2);
  const lines=[report.title,`Report ID: ${report.reportId}`,`Generated: ${report.generatedAt}`,`Coverage: ${report.coveredFrom} — ${report.coveredTo}`,`Events: ${report.eventCount}`,`Sources: ${report.sourceCount}`,"","Key Events",...report.keyEvents.map(x=>`- ${x.occurredAt} | ${x.title} | ${x.providerName} | ${x.attribution} | ${x.canonicalTarget}`),"","Risk Breakdown",...report.riskBreakdown.map(x=>`- ${x.level}: ${x.count}`),"","Official Sources",...report.officialSources.map(x=>`- ${x.providerName}: ${x.attribution.join("; ")}`)];
  if(format==="text")return lines.join("\n");
  return lines.map((line,index)=>index===0?`# ${line}`:line==="Key Events"||line==="Risk Breakdown"||line==="Official Sources"?`## ${line}`:line).join("\n");
}
export function parseReportQuery(params){
  const allowed=new Set(["type","history","category","provider","risk","region","search"]);for(const key of params.keys())if(!allowed.has(key))return{ok:false,code:"INVALID_PARAMETERS",message:`Unsupported parameter: ${key}`};
  const type=params.get("type")??"daily-global",definition=REPORT_TYPES.find(x=>x.id===type),history=params.get("history")??definition?.defaultHistory??"24h",list=key=>[...new Set((params.get(key)??"").split(",").map(x=>x.trim()).filter(Boolean))],categories=list("category"),risks=list("risk"),search=params.get("search")??"";
  if(!TYPE_IDS.has(type)||!HISTORY.has(history)||categories.some(x=>!BREAKING_CATEGORIES.includes(x))||risks.some(x=>!RISK_LEVELS.includes(x))||search.length>200)return{ok:false,code:"INVALID_PARAMETERS",message:"Report filters are invalid"};
  return{ok:true,filters:{type,history,categories,provider:params.get("provider")??"",risks,region:params.get("region")??"",search}};
}
export function parseExportQuery(params){const reportParams=new URLSearchParams(params);reportParams.delete("format");const parsed=parseReportQuery(reportParams),format=params.get("format")??"markdown";if(!["markdown","json","text"].includes(format))return{ok:false,code:"INVALID_FORMAT",message:"format must be markdown, json, or text"};return parsed.ok?{...parsed,format}:parsed}
