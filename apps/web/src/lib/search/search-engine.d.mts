import type {SearchDocument,SearchFacets,SearchFilters,SearchIndex,SearchResult} from "./search-contracts";
export const SEARCH_SORTS:readonly string[];export const SEARCH_CONTENT_TYPES:readonly string[];
export function filterSearchDocuments(documents:readonly SearchDocument[],filters:SearchFilters,generatedAt:string):SearchResult[];
export function buildFacets(results:readonly SearchResult[]):SearchFacets;
export function searchIndex(index:SearchIndex,filters:SearchFilters):{query:string;filters:SearchFilters;sort:SearchFilters["sort"];page:number;pageSize:number;totalResults:number;totalPages:number;results:SearchResult[];facets:SearchFacets};
export function suggestFromIndex(index:SearchIndex,q:string,limit?:number):readonly {type:string;value:string;path:string|null}[];
export function parseSearchQuery(params:URLSearchParams):{ok:true;filters:SearchFilters}|{ok:false;code:string;message:string};
