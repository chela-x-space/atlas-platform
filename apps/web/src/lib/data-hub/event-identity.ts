import { createHash } from "node:crypto";
import type { AtlasEventCategory, AtlasCoordinates } from "@/types/atlas-data";
export type AtlasIdentityInput = { sourceId:string; sourceItemId?:string; category:AtlasEventCategory; type:string; title:string; occurredAt:string; coordinates?:AtlasCoordinates };
export function normalizeIdentityText(value:string):string { return value.normalize("NFKC").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").replace(/\s+/g," "); }
function hash(value:string):string { return createHash("sha256").update(value,"utf8").digest("hex"); }
function canonical(input:AtlasIdentityInput):string { const stable=input.sourceItemId?.trim(); if(stable) return `v1|source-item|${normalizeIdentityText(input.sourceId)}|${stable}`; const occurred=Date.parse(input.occurredAt); if(!Number.isFinite(occurred)) throw new TypeError("occurredAt must be a valid timestamp"); /* Five-minute buckets absorb harmless feed timestamp precision changes without collapsing separate location/time events. */ const bucket=Math.floor(occurred/300_000); const point=input.coordinates ? `${input.coordinates.longitude.toFixed(4)},${input.coordinates.latitude.toFixed(4)}`:"none"; return ["v1",input.sourceId,input.category,normalizeIdentityText(input.type),normalizeIdentityText(input.title),point,bucket].join("|"); }
export function createAtlasEventFingerprint(input:AtlasIdentityInput):string { return `sha256:${hash(canonical(input))}`; }
export function createAtlasEventId(input:AtlasIdentityInput):string { return `evt_${hash(canonical(input)).slice(0,32)}`; }
