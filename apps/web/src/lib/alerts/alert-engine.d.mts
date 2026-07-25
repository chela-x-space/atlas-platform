import type {Alert,AlertFilters,AlertStatus,AlertSummary} from "./alert-contracts";
export const ALERT_STATUSES:readonly string[];export const ALERT_SOURCES:readonly string[];
export function canTransition(from:AlertStatus,to:AlertStatus):boolean;
export function severityForPriority(priority:string):string;
export function normalizeAlert(input:Alert):Alert;
export function deduplicateAlerts(alerts:readonly Alert[]):Alert[];
export function filterAlerts(alerts:readonly Alert[],filters:AlertFilters):Alert[];
export function summarizeAlerts(alerts:readonly Alert[],generatedAt:string,warnings?:readonly string[]):AlertSummary;
export function parseAlertQuery(params:URLSearchParams):{ok:true;filters:AlertFilters}|{ok:false;code:string;message:string};
