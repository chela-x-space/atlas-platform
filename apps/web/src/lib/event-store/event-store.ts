import type { AtlasEvent,AtlasEventPage,AtlasEventQuery } from "@/types/atlas-data";
export interface AtlasEventStore { upsertMany(events:readonly AtlasEvent[]):Promise<void>; getById(id:string):Promise<AtlasEvent|null>; query(query:AtlasEventQuery):Promise<AtlasEventPage>; count(query?:AtlasEventQuery):Promise<number>; deleteExpired(now:string):Promise<number>; }
/** Interface-compatible future SQL repository boundary; no database is configured by this milestone. */
export type AtlasEventRepository = AtlasEventStore;
