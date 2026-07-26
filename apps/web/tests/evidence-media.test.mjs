import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  bindArticleMedia,
  mediaDuplicateIssues,
  rankMediaEvidence,
  selectEvidenceMedia,
  toSafeMediaProjection,
  validateMediaAsset,
} from "../src/lib/evidence-media/evidence-media-logic.mjs";

const providerIds=["provider:noaa-nhc","provider:nasa","provider:usgs","provider:cisa","provider:who"];
function asset(overrides={}){
  const base={
    assetId:"media:nasa-earth-001",mediaType:"OFFICIAL_IMAGE",status:"VERIFIED",quality:"ORIGINAL",origin:"OFFICIAL_PROVIDER",
    displayUrl:"https://images.nasa.gov/example.jpg",thumbnailUrl:"https://images.nasa.gov/example-thumb.jpg",privateUrl:null,
    caption:"Earth observation from the official NASA source.",altText:"Earth viewed from orbit.",
    source:{providerId:"provider:nasa",publisher:"NASA",originalUrl:"https://images.nasa.gov/details/example",collectorReference:"nasa-media:test",collectedAt:"2026-07-26T00:00:00.000Z",verifiedAt:"2026-07-26T00:01:00.000Z",contentType:"image/jpeg",checksum:"sha256:abc",urlStatus:"VERIFIED_REACHABLE"},
    rights:{license:"OFFICIAL_USE_POLICY",licenseSummary:"NASA media usage guidelines",attributionRequired:true,attributionText:"NASA",redistribution:"ATTRIBUTION_REQUIRED",expiresAt:null,termsUrl:"https://www.nasa.gov/nasa-brand-center/images-and-media/",usageRestrictions:["Follow NASA media usage guidelines"],policy:"ATTRIBUTION_REQUIRED",publicDisplayEligible:true},
    variants:[],metadata:{width:1600,height:900,durationSeconds:null,byteSize:100000,pageCount:null,language:"en"},
    disabledReason:null,internalNotes:null,version:1,createdAt:"2026-07-26T00:00:00.000Z",updatedAt:"2026-07-26T00:00:00.000Z",createdBy:"test",updatedBy:"test",
  };
  return{...base,...overrides,source:{...base.source,...overrides.source},rights:{...base.rights,...overrides.rights},metadata:{...base.metadata,...overrides.metadata}};
}
const validate=value=>validateMediaAsset(value,{knownProviderIds:providerIds});

test("valid evidence media has explicit provenance and rights",()=>{
  const result=validate(asset());
  assert.equal(result.valid,true);
  assert.equal(result.displayEligible,true);
});

test("domain validation rejects invalid URLs, unknown providers, content types, size, and AI media",()=>{
  const result=validate(asset({displayUrl:"http://example.test/media.jpg",origin:"AI_GENERATED",source:{providerId:"provider:unknown",contentType:"application/octet-stream"},metadata:{byteSize:25_000_001}}));
  assert.deepEqual(new Set(result.issues.map(item=>item.code)),new Set(["AI_MEDIA_PROHIBITED","INVALID_MEDIA_URL","UNKNOWN_PROVIDER","INVALID_CONTENT_TYPE","MEDIA_TOO_LARGE"]));
});

test("broken and unchecked URLs cannot masquerade as verified evidence",()=>{
  assert.ok(validate(asset({source:{urlStatus:"BROKEN"}})).issues.some(item=>item.code==="BROKEN_MEDIA_URL"));
  assert.ok(validate(asset({source:{urlStatus:"UNCHECKED"}})).issues.some(item=>item.code==="URL_NOT_VERIFIED"));
});

test("rights, licensing, attribution, and expiration gates are explicit",()=>{
  const result=validate(asset({rights:{license:"UNKNOWN",licenseSummary:"",attributionText:"",expiresAt:"2020-01-01T00:00:00.000Z",policy:"RESTRICTED",publicDisplayEligible:true}}));
  const codes=result.issues.map(item=>item.code);
  assert.ok(codes.includes("INVALID_MEDIA_RIGHTS"));
  assert.ok(codes.includes("MISSING_MEDIA_ATTRIBUTION"));
  assert.ok(codes.includes("EXPIRED_MEDIA_RIGHTS"));
  assert.ok(codes.includes("INVALID_PUBLIC_DISPLAY_RIGHTS"));
});

test("redistribution policy is mandatory",()=>{
  assert.ok(validate(asset({rights:{redistribution:"UNSPECIFIED"}})).issues.some(item=>item.code==="INVALID_REDISTRIBUTION_RIGHTS"));
});

test("duplicates use stable ID, original URL, and checksum",()=>{
  const duplicate=asset({assetId:"media:nasa-earth-002"});
  const issues=mediaDuplicateIssues(duplicate,[asset()]);
  assert.deepEqual(issues.map(item=>item.code),["DUPLICATE_MEDIA_URL","DUPLICATE_MEDIA_CHECKSUM"]);
});

test("selection follows the published deterministic priority and stable tie breaker",()=>{
  const recordId="event:example",make=(origin,id)=>({reference:{recordId,assetId:id,relationship:"EVIDENCE"},asset:asset({assetId:id,origin,source:{originalUrl:`https://example.test/${id}`,checksum:`sha256:${id}`}})});
  const evidence=[
    make("EVIDENCE_VISUALIZATION","media:test-visual"),
    make("OPEN_LICENSED","media:test-open"),
    make("OFFICIAL_MAP","media:test-map"),
    make("OFFICIAL_SATELLITE","media:test-satellite"),
    make("OFFICIAL_PROVIDER","media:test-official-b"),
    make("OFFICIAL_PROVIDER","media:test-official-a"),
  ];
  assert.deepEqual(rankMediaEvidence(evidence).map(item=>item.asset.assetId),["media:test-official-a","media:test-official-b","media:test-satellite","media:test-map","media:test-open","media:test-visual"]);
  assert.equal(selectEvidenceMedia(recordId,evidence).selected.asset.assetId,"media:test-official-a");
  assert.equal(selectEvidenceMedia("event:none",evidence).selected,null);
});

test("safe projection excludes internal fields and restricted or disabled media",()=>{
  const projection=toSafeMediaProjection(asset({privateUrl:"https://private.example.test/a",internalNotes:"review note"}));
  assert.deepEqual(Object.keys(projection).sort(),["attribution","caption","displayUrl","licenseSummary","mediaType","thumbnailUrl","verificationStatus"].sort());
  assert.equal(toSafeMediaProjection(asset({rights:{policy:"INTERNAL_ONLY",publicDisplayEligible:false}})),null);
  assert.equal(toSafeMediaProjection(asset({status:"DISABLED",rights:{publicDisplayEligible:false}})),null);
});

test("article bindings contain references rather than raw media URLs",()=>{
  const binding=bindArticleMedia("event:example",["media:z","media:a","media:a"],"FEATURED");
  assert.deepEqual(binding.mediaReferences.map(item=>item.assetId),["media:a","media:z"]);
  assert.equal(JSON.stringify(binding).includes("https://"),false);
});

test("storage, service, internal API, and dashboard fallback boundaries are wired",async()=>{
  const paths=[
    "../src/lib/evidence-media/evidence-media-store.ts",
    "../src/lib/evidence-media/evidence-media-service.ts",
    "../src/lib/evidence-media/internal-evidence-media-api.ts",
    "../src/app/api/internal/media/route.ts",
    "../src/app/api/internal/media/selection-preview/route.ts",
    "../src/app/api/internal/media/bindings/route.ts",
    "../src/app/api/dashboard/route.ts",
    "../src/components/dashboard/AtlasDashboard.tsx",
  ];
  const[store,service,auth,route,preview,bindings,dashboardApi,dashboard]=await Promise.all(paths.map(path=>readFile(new URL(path,import.meta.url),"utf8")));
  assert.match(store,/rename\(temporary,this\.filePath\)/);
  assert.match(store,/history:MediaAssetVersion\[\]/);
  assert.match(service,/getSourceRegistry/);
  assert.match(service,/collectCandidates/);
  assert.match(service,/selectEvidenceMedia/);
  assert.match(auth,/ATLAS_INTERNAL_ADMIN_TOKEN/);
  assert.match(route,/authorizeEvidenceMedia/);
  assert.match(preview,/safeSelection/);
  assert.match(bindings,/getEvidenceMedia\(\)\.bind/);
  assert.match(dashboardApi,/safeSelection/);
  assert.match(dashboard,/snapshot\?\.evidenceMedia/);
  assert.doesNotMatch(dashboard,/placeholder(?:-image|\.jpg)|media-placeholder/i);
  assert.match(dashboard,/No critical events detected/);
});

test("no fabricated initial media seeds or public API routes are introduced",async()=>{
  const store=await readFile(new URL("../src/lib/evidence-media/evidence-media-store.ts",import.meta.url),"utf8");
  assert.match(store,/assets:\[\]/);
  await assert.rejects(readFile(new URL("../src/app/api/v1/media/route.ts",import.meta.url),"utf8"));
});
