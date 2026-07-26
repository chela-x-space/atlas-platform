import type { MediaAsset,MediaAssetInput,MediaCollectionResult,MediaEvidence,MediaFilter,MediaRelationship,MediaValidationIssue,MediaValidationResult } from "./evidence-media-contracts";
import type { EvidenceMediaStore } from "./evidence-media-store";
import { JsonFileEvidenceMediaStore } from "./evidence-media-store";
import { bindArticleMedia,filterMediaAssets,mediaDuplicateIssues,selectEvidenceMedia,toSafeMediaProjection,validateMediaAsset } from "./evidence-media-logic.mjs";
import { getSourceRegistry } from "@/lib/source-registry/source-registry-service";

export class EvidenceMediaError extends Error {
  constructor(public readonly code:string,message:string,public readonly status:number,public readonly details?:unknown){super(message)}
}

type MediaPatch=Partial<Omit<MediaAsset,"assetId"|"version"|"createdAt"|"createdBy"|"updatedAt"|"updatedBy">>;

export class EvidenceMediaService {
  constructor(private readonly store:EvidenceMediaStore,private readonly providerIds:()=>Promise<readonly string[]>,private readonly now:()=>string=()=>new Date().toISOString()){}
  async list(filters:MediaFilter={}){return filterMediaAssets(await this.store.list(),filters)}
  async get(assetId:string){return this.store.get(assetId)}
  async require(assetId:string){const asset=await this.get(assetId);if(!asset)throw new EvidenceMediaError("MEDIA_NOT_FOUND","Media asset was not found",404);return asset}
  async history(assetId:string){await this.require(assetId);return this.store.history(assetId)}
  async validate(asset:Partial<MediaAsset>):Promise<MediaValidationResult>{return validateMediaAsset(asset,{knownProviderIds:await this.providerIds()})}
  async register(input:MediaAssetInput,actor:string){
    const timestamp=this.now(),asset:MediaAsset={...structuredClone(input),version:1,createdAt:timestamp,updatedAt:timestamp,createdBy:actor,updatedBy:actor};
    const result=await this.validate(asset);
    if(!result.valid)throw new EvidenceMediaError("MEDIA_VALIDATION_FAILED","Media registration failed validation",400,result.issues);
    const duplicates=mediaDuplicateIssues(asset,await this.store.list());
    if(duplicates.length)throw new EvidenceMediaError(duplicates[0].code,duplicates[0].message,409,duplicates);
    return this.store.save(asset,"CREATED",actor);
  }
  async collectCandidates(result:MediaCollectionResult,actor:string){
    const registered:MediaAsset[]=[],errors:MediaValidationIssue[]=[...result.errors];
    for(const candidate of result.candidates){
      if(candidate.source.providerId!==result.providerId||candidate.source.collectorReference!==result.collectorReference){
        errors.push({code:"COLLECTION_PROVENANCE_MISMATCH",field:"source",message:`Candidate ${candidate.assetId} does not match its collection result`});
        continue;
      }
      try{registered.push(await this.register(candidate,actor))}
      catch(error){
        if(error instanceof EvidenceMediaError&&Array.isArray(error.details))errors.push(...error.details as MediaValidationIssue[]);
        else errors.push({code:error instanceof EvidenceMediaError?error.code:"MEDIA_COLLECTION_FAILED",field:"candidates",message:error instanceof Error?error.message:"Media collection failed"});
      }
    }
    return{providerId:result.providerId,collectorReference:result.collectorReference,collectedAt:result.collectedAt,registered,errors};
  }
  async update(assetId:string,patch:MediaPatch,actor:string){
    const current=await this.require(assetId),candidate=structuredClone(patch) as Record<string,unknown>;
    for(const field of ["assetId","version","createdAt","createdBy","updatedAt","updatedBy"])delete candidate[field];
    const next={...current,...candidate,assetId:current.assetId,version:current.version+1,createdAt:current.createdAt,createdBy:current.createdBy,updatedAt:this.now(),updatedBy:actor} as MediaAsset;
    const result=await this.validate(next);
    if(!result.valid)throw new EvidenceMediaError("MEDIA_VALIDATION_FAILED","Media update failed validation",400,result.issues);
    const others=(await this.store.list()).filter(asset=>asset.assetId!==assetId),duplicates=mediaDuplicateIssues(next,others);
    if(duplicates.length)throw new EvidenceMediaError(duplicates[0].code,duplicates[0].message,409,duplicates);
    return this.store.save(next,"UPDATED",actor);
  }
  async disable(assetId:string,reason:string,actor:string){
    const current=await this.require(assetId);
    if(!reason.trim())throw new EvidenceMediaError("DISABLE_REASON_REQUIRED","Disabling media requires a reason",400);
    if(current.status==="DISABLED")throw new EvidenceMediaError("MEDIA_ALREADY_DISABLED","Media asset is already disabled",409);
    const next={...current,status:"DISABLED" as const,rights:{...current.rights,publicDisplayEligible:false},disabledReason:reason.trim(),version:current.version+1,updatedAt:this.now(),updatedBy:actor};
    return this.store.save(next,"DISABLED",actor);
  }
  async bind(recordId:string,assetIds:readonly string[],relationship:MediaRelationship="EVIDENCE"){
    for(const assetId of assetIds)await this.require(assetId);
    const binding=bindArticleMedia(recordId,assetIds,relationship);
    await this.store.saveReferences(recordId,binding.mediaReferences);
    return binding;
  }
  async select(recordId:string){
    const references=await this.store.references(recordId),evidence:MediaEvidence[]=[];
    for(const reference of references){const asset=await this.store.get(reference.assetId);if(asset)evidence.push({reference,asset})}
    return selectEvidenceMedia(recordId,evidence);
  }
  async safeSelection(recordId:string){const selection=await this.select(recordId);return{...selection,selected:selection.selected?toSafeMediaProjection(selection.selected.asset):null}}
  internalView(asset:MediaAsset){const{privateUrl,internalNotes,...safe}=asset;return{...safe,privateUrlConfigured:Boolean(privateUrl),hasInternalNotes:Boolean(internalNotes)}}
}

let mediaRegistry:EvidenceMediaService|undefined;
export function getEvidenceMedia(){
  return mediaRegistry??=new EvidenceMediaService(new JsonFileEvidenceMediaStore(),async()=>(await getSourceRegistry().list()).map(provider=>provider.providerId));
}
