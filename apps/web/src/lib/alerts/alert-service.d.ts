import type {AlertFilters,AlertStatus} from "./alert-contracts";
export function getAlertSnapshot():Promise<unknown>;export function listAlerts(filters:AlertFilters):Promise<unknown>;export function getAlert(id:string):Promise<unknown|null>;export function transitionAlert(id:string,status:AlertStatus):Promise<unknown|null>;
