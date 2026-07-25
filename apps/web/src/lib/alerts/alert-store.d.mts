import type {AlertStatus} from "./alert-contracts";
export function statusFor(id:string):AlertStatus;export function transition(id:string,status:AlertStatus,now?:string,reason?:string):AlertStatus;export function auditFor(id:string):readonly {from:AlertStatus;to:AlertStatus;status:AlertStatus;at:string;reason:string}[];export function clearAlertStore():void;
