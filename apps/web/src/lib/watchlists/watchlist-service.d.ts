import type {AlertStatus} from "./watchlist-contracts";
export function getWatchlistSnapshot():Promise<unknown>;
export function getWatchlist(id:string):Promise<unknown|null>;
export function setWatchlistAlertStatus(id:string,status:AlertStatus):Promise<unknown>;
