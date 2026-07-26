import { mkdir,readFile,rename,writeFile } from "node:fs/promises";
import { dirname,join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import type { ProviderVersionAction,SourceProvider,SourceProviderVersion } from "./source-registry-contracts";
import { sourceRegistrySeeds } from "./source-registry-seeds";

type RegistryDocument = {
  schemaVersion: 1;
  providers: SourceProvider[];
  history: SourceProviderVersion[];
};

export interface SourceRegistryStore {
  list(): Promise<SourceProvider[]>;
  get(providerId:string): Promise<SourceProvider|null>;
  getBySlug(slug:string): Promise<SourceProvider|null>;
  save(provider:SourceProvider,action:ProviderVersionAction,actor:string): Promise<SourceProvider>;
  history(providerId:string): Promise<SourceProviderVersion[]>;
}

function copy<T>(value:T):T{return structuredClone(value)}
function initialDocument(seeds:readonly SourceProvider[]):RegistryDocument{
  return{schemaVersion:1,providers:copy([...seeds]),history:seeds.map(provider=>({providerId:provider.providerId,version:provider.version,action:"CREATED",recordedAt:provider.createdAt,actor:provider.createdBy,provider:copy(provider)}))};
}

export class InMemorySourceRegistryStore implements SourceRegistryStore {
  private document:RegistryDocument;
  constructor(seeds:readonly SourceProvider[]=[]){this.document=initialDocument(seeds)}
  async list(){return copy(this.document.providers)}
  async get(providerId:string){return copy(this.document.providers.find(provider=>provider.providerId===providerId)??null)}
  async getBySlug(slug:string){return copy(this.document.providers.find(provider=>provider.slug===slug)??null)}
  async save(provider:SourceProvider,action:ProviderVersionAction,actor:string){
    const index=this.document.providers.findIndex(item=>item.providerId===provider.providerId);
    if(index>=0)this.document.providers[index]=copy(provider);else this.document.providers.push(copy(provider));
    this.document.history.push({providerId:provider.providerId,version:provider.version,action,recordedAt:provider.updatedAt,actor,provider:copy(provider)});
    return copy(provider);
  }
  async history(providerId:string){return copy(this.document.history.filter(item=>item.providerId===providerId).sort((a,b)=>a.version-b.version))}
}

export class JsonFileSourceRegistryStore implements SourceRegistryStore {
  private queue:Promise<unknown>=Promise.resolve();
  constructor(private readonly filePath=process.env.ATLAS_SOURCE_REGISTRY_PATH||join(tmpdir(),"atlas-source-registry-v2.json"),private readonly seeds:readonly SourceProvider[]=sourceRegistrySeeds()){}
  private async read():Promise<RegistryDocument>{
    try{
      const parsed=JSON.parse(await readFile(this.filePath,"utf8")) as RegistryDocument;
      if(parsed.schemaVersion!==1||!Array.isArray(parsed.providers)||!Array.isArray(parsed.history))throw new Error("Unsupported source registry document");
      return parsed;
    }catch(error){
      if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;
      const document=initialDocument(this.seeds);await this.write(document);return document;
    }
  }
  private async write(document:RegistryDocument){
    await mkdir(dirname(this.filePath),{recursive:true});
    const temporary=`${this.filePath}.${randomUUID()}.tmp`;
    await writeFile(temporary,`${JSON.stringify(document,null,2)}\n`,{encoding:"utf8",mode:0o600});
    await rename(temporary,this.filePath);
  }
  private serialize<T>(operation:()=>Promise<T>):Promise<T>{
    const result=this.queue.then(operation,operation);this.queue=result.then(()=>undefined,()=>undefined);return result;
  }
  async list(){return this.serialize(async()=>copy((await this.read()).providers))}
  async get(providerId:string){return this.serialize(async()=>copy((await this.read()).providers.find(provider=>provider.providerId===providerId)??null))}
  async getBySlug(slug:string){return this.serialize(async()=>copy((await this.read()).providers.find(provider=>provider.slug===slug)??null))}
  async save(provider:SourceProvider,action:ProviderVersionAction,actor:string){return this.serialize(async()=>{const document=await this.read(),index=document.providers.findIndex(item=>item.providerId===provider.providerId);if(index>=0)document.providers[index]=copy(provider);else document.providers.push(copy(provider));document.history.push({providerId:provider.providerId,version:provider.version,action,recordedAt:provider.updatedAt,actor,provider:copy(provider)});await this.write(document);return copy(provider)})}
  async history(providerId:string){return this.serialize(async()=>copy((await this.read()).history.filter(item=>item.providerId===providerId).sort((a,b)=>a.version-b.version)))}
}
