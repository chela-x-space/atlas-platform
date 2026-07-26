import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { SourceRegistryError } from "./source-registry-service";

export function authorizeSourceRegistry(request:Request):NextResponse|null{
  const configured=process.env.ATLAS_INTERNAL_ADMIN_TOKEN;
  if(!configured)return NextResponse.json({error:{code:"INTERNAL_ADMIN_UNAVAILABLE",message:"Internal Source Registry administration is not configured"}},{status:503,headers:{"Cache-Control":"no-store"}});
  const supplied=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"")??"";
  const expectedBuffer=Buffer.from(configured),suppliedBuffer=Buffer.from(supplied);
  const authorized=expectedBuffer.length===suppliedBuffer.length&&timingSafeEqual(expectedBuffer,suppliedBuffer);
  return authorized?null:NextResponse.json({error:{code:"INTERNAL_ADMIN_UNAUTHORIZED",message:"Valid internal administration credentials are required"}},{status:401,headers:{"Cache-Control":"no-store"}});
}

export function registryActor(request:Request){
  const actor=request.headers.get("x-atlas-actor")?.trim()??"";
  return/^[A-Za-z0-9._:@-]{1,100}$/.test(actor)?actor:"atlas:internal-admin";
}

export function registryOk(data:unknown,status=200){return NextResponse.json({data,meta:{registryVersion:"v2.0"}},{status,headers:{"Cache-Control":"no-store"}})}
export function registryError(error:unknown){
  if(error instanceof SourceRegistryError)return NextResponse.json({error:{code:error.code,message:error.message,...(error.details?{details:error.details}:{})}},{status:error.status,headers:{"Cache-Control":"no-store"}});
  if(error instanceof SyntaxError)return NextResponse.json({error:{code:"INVALID_JSON",message:"Request body must be valid JSON"}},{status:400,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({error:{code:"SOURCE_REGISTRY_UNAVAILABLE",message:"Source Registry is temporarily unavailable"}},{status:503,headers:{"Cache-Control":"no-store"}});
}
