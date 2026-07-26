import type { ArticleMediaBinding,MediaAsset,MediaEvidence,MediaFilter,MediaRelationship,MediaSelection,MediaValidationIssue,MediaValidationResult,SafeMediaProjection } from "./evidence-media-contracts";
export function validateMediaAsset(asset:Partial<MediaAsset>,options?:{knownProviderIds?:readonly string[];maximumBytes?:number}):MediaValidationResult;
export function mediaDuplicateIssues(asset:MediaAsset,assets:readonly MediaAsset[]):readonly MediaValidationIssue[];
export function rankMediaEvidence(evidence:readonly MediaEvidence[]):MediaEvidence[];
export function selectEvidenceMedia(recordId:string,evidence:readonly MediaEvidence[]):MediaSelection;
export function toSafeMediaProjection(asset:MediaAsset):SafeMediaProjection|null;
export function filterMediaAssets(assets:readonly MediaAsset[],filters?:MediaFilter):MediaAsset[];
export function bindArticleMedia(recordId:string,assetIds:readonly string[],relationship?:MediaRelationship):ArticleMediaBinding;
