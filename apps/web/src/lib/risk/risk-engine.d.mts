import type { TimelineItem,TimelineSourceStatus } from "../timeline/timeline-contract";
import type { RiskAlert,RiskFilters,RiskRuleMetadata,RiskSnapshot } from "./risk-contracts";
export const RISK_LEVELS:readonly string[];
export const RISK_RULES:readonly RiskRuleMetadata[];
export function evaluateRiskItem(item:TimelineItem,evaluatedAt:string):RiskAlert|null;
export function sortRiskAlerts(alerts:readonly RiskAlert[]):RiskAlert[];
export function filterRiskAlerts(alerts:readonly RiskAlert[],filters:RiskFilters):RiskAlert[];
export function generateRiskSnapshot(input:{items:readonly TimelineItem[];providers:readonly TimelineSourceStatus[]},evaluatedAt:string):RiskSnapshot;
export function parseRiskQuery(params:URLSearchParams):{ok:true;filters:RiskFilters}|{ok:false;code:string;message:string};
