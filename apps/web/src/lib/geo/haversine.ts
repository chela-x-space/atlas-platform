import type { AtlasCoordinates } from "@/types/atlas-data";
import { validateCoordinates } from "@/lib/data-hub/validation";
/** Great-circle distance in kilometres using mean Earth radius 6371.0088 km. */
export function haversineKilometers(a:Pick<AtlasCoordinates,"longitude"|"latitude">,b:Pick<AtlasCoordinates,"longitude"|"latitude">):number { if(!validateCoordinates(a).ok||!validateCoordinates(b).ok) throw new RangeError("Invalid WGS84 coordinate"); const rad=(n:number)=>n*Math.PI/180; const dLat=rad(b.latitude-a.latitude),dLon=rad(b.longitude-a.longitude); const h=Math.sin(dLat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLon/2)**2; return 2*6371.0088*Math.asin(Math.sqrt(h)); }
