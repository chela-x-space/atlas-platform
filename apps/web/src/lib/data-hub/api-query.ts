import type { AtlasEventCategory,AtlasEventQuery,AtlasEventSort,AtlasSeverity } from "@/types/atlas-data";

const categories=new Set<AtlasEventCategory>(["earthquake","cyclone","weather","space","technology","news","health","wildfire","flood","volcano","conflict","aviation","marine","market","cyber","energy","unknown"]);
const severities=new Set<AtlasSeverity>(["info","low","moderate","high","critical","unknown"]);
const sorts=new Set<AtlasEventSort>(["occurredAt:desc","occurredAt:asc","updatedAt:desc","severity:desc"]);

export function parseEventQuery(params:URLSearchParams):{ok:true;query:AtlasEventQuery}|{ok:false;message:string}{
  const list=(key:string)=>params.getAll(key).flatMap(value=>value.split(",")).filter(Boolean);
  const cs=list("category"),ss=list("severity"),sources=list("source");
  if(cs.length>20||ss.length>20||sources.length>20||sources.some(value=>value.length>100||!/^[a-z0-9-]+$/i.test(value)))return{ok:false,message:"Too many or invalid filter values"};
  if(cs.some(value=>!categories.has(value as AtlasEventCategory)))return{ok:false,message:"Invalid category"};
  if(ss.some(value=>!severities.has(value as AtlasSeverity)))return{ok:false,message:"Invalid severity"};
  const number=(key:string,min:number,max:number)=>{const raw=params.get(key);if(raw===null)return undefined;const value=Number(raw);return Number.isFinite(value)&&value>=min&&value<=max?value:null;};
  const lat=number("latitude",-90,90),lon=number("longitude",-180,180),radius=number("radiusKm",0,20_000),limit=number("limit",1,500);
  if(lat===null||lon===null||radius===null||limit===null)return{ok:false,message:"Invalid numeric parameter"};
  if([lat,lon,radius].filter(value=>value!==undefined).length!==0&&[lat,lon,radius].some(value=>value===undefined))return{ok:false,message:"latitude, longitude and radiusKm must be supplied together"};
  const after=params.get("after")??undefined,before=params.get("before")??undefined;
  if((after&&!Number.isFinite(Date.parse(after)))||(before&&!Number.isFinite(Date.parse(before)))||(after&&before&&Date.parse(after)>Date.parse(before)))return{ok:false,message:"Invalid date range"};
  const sort=params.get("sort")??undefined;if(sort&&!sorts.has(sort as AtlasEventSort))return{ok:false,message:"Invalid sort"};
  const search=params.get("search")?.trim()||undefined;if(search&&search.length>200)return{ok:false,message:"Search is too long"};
  const cursor=params.get("cursor")??undefined;if(cursor&&cursor.length>512)return{ok:false,message:"Cursor is too long"};
  return{ok:true,query:{...(cs.length?{categories:cs as AtlasEventCategory[]}:{}),...(ss.length?{severities:ss as AtlasSeverity[]}:{}),...(sources.length?{sourceIds:sources}:{}),...(search?{search}:{}),...(after?{occurredAfter:new Date(after).toISOString()}:{}),...(before?{occurredBefore:new Date(before).toISOString()}:{}),...(lat!==undefined?{latitude:lat}:{}),...(lon!==undefined?{longitude:lon}:{}),...(radius!==undefined?{radiusKilometers:radius}:{}),...(limit!==undefined?{limit}:{}),...(cursor?{cursor}:{}),...(sort?{sort:sort as AtlasEventSort}:{})}};
}
