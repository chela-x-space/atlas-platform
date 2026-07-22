import type { AtlasEvent } from "@/types/atlas-data";
import { createAtlasEventFingerprint,createAtlasEventId,type AtlasIdentityInput } from "../event-identity";
import { validateAtlasEvent } from "../validation";
export function finalizeEvent(identity:AtlasIdentityInput,event:Omit<AtlasEvent,"id"|"fingerprint">):AtlasEvent|null { const candidate:AtlasEvent={...event,id:createAtlasEventId(identity),fingerprint:createAtlasEventFingerprint(identity)}; const result=validateAtlasEvent(candidate); return result.ok?result.value:null; }
export function iso(value:string|number|Date):string|null { const d=new Date(value); return Number.isFinite(d.valueOf())?d.toISOString():null; }
