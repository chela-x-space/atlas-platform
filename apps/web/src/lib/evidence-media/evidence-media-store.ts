import { mkdir,readFile,rename,writeFile } from "node:fs/promises";
import { dirname,join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import type { MediaAsset,MediaAssetVersion,MediaReference,MediaVersionAction } from "./evidence-media-contracts";

type MediaDocument={schemaVersion:1;assets:MediaAsset[];references:MediaReference[];history:MediaAssetVersion[]};
const emptyDocument=():MediaDocument=>({schemaVersion:1,assets:[],references:[],history:[]});
const copy=<T>(value:T):T=>structuredClone(value);

export interface EvidenceMediaStore {
  list():Promise<MediaAsset[]>;
  get(assetId:string):Promise<MediaAsset|null>;
  save(asset:MediaAsset,action:MediaVersionAction,actor:string):Promise<MediaAsset>;
  history(assetId:string):Promise<MediaAssetVersion[]>;
  references(recordId:string):Promise<MediaReference[]>;
  saveReferences(recordId:string,references:readonly MediaReference[]):Promise<MediaReference[]>;
}

export class InMemoryEvidenceMediaStore implements EvidenceMediaStore {
  private document:MediaDocument;
  constructor(document:Partial<MediaDocument>={}){this.document={...emptyDocument(),...copy(document)}}
  async list(){return copy(this.document.assets)}
  async get(assetId:string){return copy(this.document.assets.find(asset=>asset.assetId===assetId)??null)}
  async save(asset:MediaAsset,action:MediaVersionAction,actor:string){
    const index=this.document.assets.findIndex(item=>item.assetId===asset.assetId);
    if(index>=0)this.document.assets[index]=copy(asset);else this.document.assets.push(copy(asset));
    this.document.history.push({assetId:asset.assetId,version:asset.version,action,recordedAt:asset.updatedAt,actor,asset:copy(asset)});
    return copy(asset);
  }
  async history(assetId:string){return copy(this.document.history.filter(item=>item.assetId===assetId).sort((a,b)=>a.version-b.version))}
  async references(recordId:string){return copy(this.document.references.filter(item=>item.recordId===recordId))}
  async saveReferences(recordId:string,references:readonly MediaReference[]){this.document.references=this.document.references.filter(item=>item.recordId!==recordId);this.document.references.push(...copy([...references]));return copy([...references])}
}

export class JsonFileEvidenceMediaStore implements EvidenceMediaStore {
  private queue:Promise<unknown>=Promise.resolve();
  constructor(private readonly filePath=process.env.ATLAS_EVIDENCE_MEDIA_PATH||join(tmpdir(),"atlas-evidence-media-v2.json")){}
  private async read():Promise<MediaDocument>{
    try{
      const parsed=JSON.parse(await readFile(this.filePath,"utf8")) as MediaDocument;
      if(parsed.schemaVersion!==1||!Array.isArray(parsed.assets)||!Array.isArray(parsed.references)||!Array.isArray(parsed.history))throw new Error("Unsupported Evidence Media document");
      return parsed;
    }catch(error){
      if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;
      const document=emptyDocument();await this.write(document);return document;
    }
  }
  private async write(document:MediaDocument){
    await mkdir(dirname(this.filePath),{recursive:true});
    const temporary=`${this.filePath}.${randomUUID()}.tmp`;
    await writeFile(temporary,`${JSON.stringify(document,null,2)}\n`,{encoding:"utf8",mode:0o600});
    await rename(temporary,this.filePath);
  }
  private serialize<T>(operation:()=>Promise<T>):Promise<T>{const result=this.queue.then(operation,operation);this.queue=result.then(()=>undefined,()=>undefined);return result}
  async list(){return this.serialize(async()=>copy((await this.read()).assets))}
  async get(assetId:string){return this.serialize(async()=>copy((await this.read()).assets.find(asset=>asset.assetId===assetId)??null))}
  async save(asset:MediaAsset,action:MediaVersionAction,actor:string){return this.serialize(async()=>{const document=await this.read(),index=document.assets.findIndex(item=>item.assetId===asset.assetId);if(index>=0)document.assets[index]=copy(asset);else document.assets.push(copy(asset));document.history.push({assetId:asset.assetId,version:asset.version,action,recordedAt:asset.updatedAt,actor,asset:copy(asset)});await this.write(document);return copy(asset)})}
  async history(assetId:string){return this.serialize(async()=>copy((await this.read()).history.filter(item=>item.assetId===assetId).sort((a,b)=>a.version-b.version)))}
  async references(recordId:string){return this.serialize(async()=>copy((await this.read()).references.filter(item=>item.recordId===recordId)))}
  async saveReferences(recordId:string,references:readonly MediaReference[]){return this.serialize(async()=>{const document=await this.read();document.references=document.references.filter(item=>item.recordId!==recordId);document.references.push(...copy([...references]));await this.write(document);return copy([...references])})}
}
