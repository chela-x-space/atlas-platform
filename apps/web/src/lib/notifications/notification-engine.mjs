export const DELIVERY_STATUSES=["PENDING","RUNNING","SUCCESS","FAILED","RETRYING","DEAD_LETTER","CANCELLED"];
export const MAX_ATTEMPTS=3;
export const TIMEOUT_MS=5000;
export function normalizeUrl(value){try{const u=new URL(String(value));if(u.protocol!=="http:"&&u.protocol!=="https:")return null;return u.toString()}catch{return null}}
export function backoffMs(attempt){return Math.min(60000,1000*Math.pow(2,Math.max(0,attempt-1)))}
export function statusSummary(jobs){return DELIVERY_STATUSES.reduce((a,s)=>(a[s]=jobs.filter(j=>j.status===s).length,a),{})}
export function sortJobs(jobs){return [...jobs].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id))}
