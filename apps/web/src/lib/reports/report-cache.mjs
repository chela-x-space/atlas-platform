const store=new Map(),pending=new Map();
export async function withReportCache(key,ttlMs,staleMs,loader,now=Date.now()){
  const existing=store.get(key);if(existing&&existing.expiresAt>now)return existing.value;if(pending.has(key))return pending.get(key);
  const request=loader().then(value=>{store.set(key,{value,expiresAt:now+ttlMs,staleUntil:now+ttlMs+staleMs});return value}).catch(error=>{if(existing&&existing.staleUntil>now)return{...existing.value,degraded:true,stale:true};throw error}).finally(()=>pending.delete(key));pending.set(key,request);return request;
}
export function clearReportCache(){store.clear();pending.clear()}
