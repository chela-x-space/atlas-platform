import type { RadarFilters, RadarSnapshot, Technology } from "./ai-radar-contract";
export const RADAR_CATEGORIES: readonly string[];
export const RADAR_CAPABILITIES: readonly string[];
export function stableRadarSort(snapshot: RadarSnapshot): RadarSnapshot;
export function filterTechnologies(items: readonly Technology[], filters: RadarFilters, generatedAt: string): Technology[];
export function parseRadarQuery(params: URLSearchParams): {ok:true;query:RadarFilters&{technology?:string;benchmark?:string;limit:number}}|{ok:false;code:string;message:string};
