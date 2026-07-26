import { mkdir,readFile,rename,writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { ExecutionClaim,ProviderCollectorBinding,ProviderExecutionAttempt,ProviderHealthObservation,ProviderRuntimeAuditRecord,ProviderRuntimeDefinition,ProviderRuntimeEvent } from "./provider-runtime-contracts";

export type RuntimeSnapshot<T>={version:number;recordedAt:string;actor:string;value:T};
export type ProviderRuntimeDocument={
  schemaVersion:1;
  definitions:ProviderRuntimeDefinition[];
  definitionHistory:RuntimeSnapshot<ProviderRuntimeDefinition>[];
  bindings:ProviderCollectorBinding[];
  bindingHistory:RuntimeSnapshot<ProviderCollectorBinding>[];
  executions:ProviderExecutionAttempt[];
  claims:ExecutionClaim[];
  rateLimitRecords:{providerId:string;bindingId:string;executionId:string;recordedAt:string}[];
  healthObservations:ProviderHealthObservation[];
  events:ProviderRuntimeEvent[];
  audit:ProviderRuntimeAuditRecord[];
};
export const emptyRuntimeDocument=():ProviderRuntimeDocument=>({schemaVersion:1,definitions:[],definitionHistory:[],bindings:[],bindingHistory:[],executions:[],claims:[],rateLimitRecords:[],healthObservations:[],events:[],audit:[]});
const copy=<T>(value:T):T=>structuredClone(value);

export interface ProviderRuntimeStore {
  read():Promise<ProviderRuntimeDocument>;
  mutate<T>(operation:(document:ProviderRuntimeDocument)=>T):Promise<T>;
}
export class InMemoryProviderRuntimeStore implements ProviderRuntimeStore {
  private document:ProviderRuntimeDocument;
  constructor(document:ProviderRuntimeDocument=emptyRuntimeDocument()){this.document=document}
  async read(){return copy(this.document)}
  async mutate<T>(operation:(document:ProviderRuntimeDocument)=>T){const working=copy(this.document),result=operation(working);this.document=working;return result}
}
export class JsonFileProviderRuntimeStore implements ProviderRuntimeStore {
  private queue:Promise<unknown>=Promise.resolve();
  private readonly filePath:string;
  constructor(filePath:string){this.filePath=filePath}
  private async load(){
    try{const parsed=JSON.parse(await readFile(this.filePath,"utf8")) as ProviderRuntimeDocument;if(parsed.schemaVersion!==1)throw new Error("Unsupported Provider Runtime schema");return parsed}
    catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;const document=emptyRuntimeDocument();await this.save(document);return document}
  }
  private async save(document:ProviderRuntimeDocument){
    await mkdir(dirname(this.filePath),{recursive:true});const temporary=`${this.filePath}.${randomUUID()}.tmp`;
    await writeFile(temporary,`${JSON.stringify(document,null,2)}\n`,{encoding:"utf8",mode:0o600});await rename(temporary,this.filePath);
  }
  private serialize<T>(operation:()=>Promise<T>){const result=this.queue.then(operation,operation);this.queue=result.then(()=>undefined,()=>undefined);return result}
  async read(){return this.serialize(async()=>copy(await this.load()))}
  async mutate<T>(operation:(document:ProviderRuntimeDocument)=>T){return this.serialize(async()=>{const document=await this.load(),result=operation(document);await this.save(document);return result})}
}
