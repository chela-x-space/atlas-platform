import type {BreakingEvent,BreakingFilters,BreakingInputs,BreakingPriority,BreakingSnapshot} from "./breaking-contract";
export const BREAKING_CATEGORIES:readonly string[];export const BREAKING_PRIORITIES:readonly string[];
export function earthquakePriority(magnitude:unknown):BreakingPriority;
export function weatherPriority(title:string,status?:string):BreakingPriority;
export function aiReleasePriority(release:{version:string;category:string}):BreakingPriority;
export function generateBreakingSnapshot(inputs:BreakingInputs,generatedAt:string):BreakingSnapshot;
export function filterBreakingEvents(events:readonly BreakingEvent[],filters:BreakingFilters):BreakingEvent[];
export function parseBreakingQuery(params:URLSearchParams):{ok:true;filters:BreakingFilters}|{ok:false;code:string;message:string};
