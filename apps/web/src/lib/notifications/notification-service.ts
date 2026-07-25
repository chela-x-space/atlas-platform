/* eslint-disable @typescript-eslint/no-explicit-any */
import {enqueue, listJobs, getJob, listAttempts, auditLog, cancelJob, deliverJob} from "./notification-store.mjs";
import {normalizeUrl,statusSummary} from "./notification-engine.mjs";
export function createWebhookJob(input:{alertId:string;url:string;payload?:Record<string,unknown>}):any{const target=normalizeUrl(input.url);if(!target)throw new Error("INVALID_WEBHOOK_URL");return enqueue({alertId:input.alertId,target,payload:input.payload??{type:"atlas.alert.test",alertId:input.alertId}})}
export async function executeJob(id:string):Promise<any>{return deliverJob(id)}
export function getNotification(id:string):any{const job=getJob(id);return job?{job,attempts:listAttempts(id),audit:auditLog().filter((entry:any)=>entry.jobId===id)}:null}
export function getNotificationSnapshot():any{const jobs:any[]=listJobs() as any[];return{jobs,statuses:statusSummary(jobs as any),attempts:jobs.reduce((n,j)=>n+listAttempts(String(j.id)).length,0),audit:auditLog(),generatedAt:new Date().toISOString()}}
export function cancelNotification(id:string):any{return cancelJob(id)}
