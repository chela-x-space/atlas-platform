export function withReportCache<T extends object>(key:string,ttlMs:number,staleMs:number,loader:()=>Promise<T>,now?:number):Promise<T>;
export function clearReportCache():void;
