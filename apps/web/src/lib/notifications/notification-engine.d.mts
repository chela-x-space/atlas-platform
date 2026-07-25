export const DELIVERY_STATUSES: readonly string[];
export const MAX_ATTEMPTS:number;
export const TIMEOUT_MS:number;
export function normalizeUrl(value:unknown):string|null;
export function backoffMs(attempt:number):number;
export function statusSummary(jobs:readonly {status:string}[]):Record<string,number>;
export function sortJobs<T extends {createdAt:string;id:string}>(jobs:readonly T[]):T[];
