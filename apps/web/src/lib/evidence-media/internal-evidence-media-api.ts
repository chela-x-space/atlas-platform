import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { EvidenceMediaError } from "./evidence-media-service";

export function authorizeEvidenceMedia(request:Request):NextResponse|null{
  const configured=process.env.ATLAS_INTERNAL_ADMIN_TOKEN;
  if(!configured)return NextResponse.json({error:{code:"INTERNAL_ADMIN_UNAVAILABLE",message:"Internal Evidence Media administration is not configured"}},{status:503,headers:{"Cache-Control":"no-store"}});
  const supplied=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"")??"",expected=Buffer.from(configured),actual=Buffer.from(supplied);
  return expected.length===actual.length&&timingSafeEqual(expected,actual)?null:NextResponse.json({error:{code:"INTERNAL_ADMIN_UNAUTHORIZED",message:"Valid internal administration credentials are required"}},{status:401,headers:{"Cache-Control":"no-store"}});
}
export function mediaActor(request:Request){const actor=request.headers.get("x-atlas-actor")?.trim()??"";return/^[A-Za-z0-9._:@-]{1,100}$/.test(actor)?actor:"atlas:internal-admin"}
export function mediaOk(data:unknown,status=200){return NextResponse.json({data,meta:{mediaPlatformVersion:"v2.1"}},{status,headers:{"Cache-Control":"no-store"}})}
export function mediaError(error:unknown){
  if(error instanceof EvidenceMediaError)return NextResponse.json({error:{code:error.code,message:error.message,...(error.details?{details:error.details}:{})}},{status:error.status,headers:{"Cache-Control":"no-store"}});
  if(error instanceof SyntaxError)return NextResponse.json({error:{code:"INVALID_JSON",message:"Request body must be valid JSON"}},{status:400,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({error:{code:"EVIDENCE_MEDIA_UNAVAILABLE",message:"Evidence Media Platform is temporarily unavailable"}},{status:503,headers:{"Cache-Control":"no-store"}});
}
