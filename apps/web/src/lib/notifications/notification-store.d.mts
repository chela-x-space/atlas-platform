/* eslint-disable @typescript-eslint/no-unsafe-function-type */
export function enqueue(input:Record<string,unknown>):Record<string,unknown>;
export function listJobs():Record<string,unknown>[];
export function getJob(id:string):Record<string,unknown>|null;
export function listAttempts(id:string):Record<string,unknown>[];
export function auditLog():Record<string,unknown>[];
export function cancelJob(id:string):Record<string,unknown>|null;
export function deliverJob(id:string,fetchImpl?:Function):Promise<Record<string,unknown>|null>;
export function clearNotificationStore():void;
