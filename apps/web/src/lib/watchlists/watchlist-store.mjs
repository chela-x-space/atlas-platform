import {sortWatchlists} from "./watchlist-engine.mjs";
const store=new Map(), statuses=new Map(), seenMatches=new Set();
function idFor(name,now){const base=`watch:${now}:${String(name).trim().toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu,"-")||"list"}`;let id=base,n=2;while(store.has(id))id=`${base}:${n++}`;return id}
export function listWatchlists(){return sortWatchlists([...store.values()])}
export function createWatchlist(input,now=Date.now()){const timestamp=new Date(now).toISOString(),name=String(input?.name??"").trim(),value=String(input?.target?.value??"").trim();if(!name||!value)return null;const item={id:idFor(name,now),name,enabled:input?.enabled!==false,target:{type:input.target.type,value},createdAt:timestamp,updatedAt:timestamp,lastMatchAt:null,totalMatchCount:0};store.set(item.id,item);return item}
export function getWatchlist(id){return store.get(id)??null}
export function updateWatchlist(id,patch,now=Date.now()){const current=getWatchlist(id);if(!current)return null;const next={...current,...(patch.name!==undefined?{name:String(patch.name).trim()||current.name}:{}),...(patch.enabled!==undefined?{enabled:Boolean(patch.enabled)}:{}),...(patch.target?.value?{target:{...current.target,value:String(patch.target.value).trim()}}:{}),updatedAt:new Date(now).toISOString()};store.set(id,next);return next}
export function deleteWatchlist(id){return store.delete(id)}
export function recordMatches(alerts){const byId=new Map();for(const alert of alerts){const current=byId.get(alert.watchlistId)??getWatchlist(alert.watchlistId);if(current){const isNew=!seenMatches.has(alert.id);seenMatches.add(alert.id);byId.set(alert.watchlistId,{...current,lastMatchAt:current.lastMatchAt&&Date.parse(current.lastMatchAt)>Date.parse(alert.timestamp)?current.lastMatchAt:alert.timestamp,totalMatchCount:current.totalMatchCount+(isNew?1:0)})}}for(const [id,item] of byId)store.set(id,item);return alerts}
export function getAlertStatuses(){return new Map(statuses)}
export function setAlertStatus(id,status){statuses.set(id,status);return status}
export function clearWatchlistStore(){store.clear();statuses.clear();seenMatches.clear()}
