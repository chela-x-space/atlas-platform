import {ok} from "@/lib/api/v1-api";
export const dynamic="force-dynamic";
export async function GET(request:Request){return ok(request,{apiVersion:"v1",classification:"PUBLIC-STABLE",degraded:false,resources:["status","sources","events","timeline","breaking","radar","map","risk","reports","search","entities","graph"],authentication:"not-implemented"})}
