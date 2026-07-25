import type { BreakingCategory, BreakingPriority } from "@/lib/breaking/breaking-contract";

export const RISK_VERSION = "atlas-risk-v1.1" as const;
export type RiskLevel = "CRITICAL"|"HIGH"|"ELEVATED"|"WATCH"|"INFORMATIONAL";
export type RiskActivity = "active"|"resolved";
export type RiskAlert = {
  readonly canonicalId:string;readonly level:RiskLevel;readonly ruleId:string;readonly ruleVersion:"1.0.0";
  readonly explanation:string;readonly evaluatedAt:string;readonly sourceEventId:string;
  readonly sourceCategory:BreakingCategory;readonly sourceAttribution:string;readonly canonicalTarget:string;
  readonly title:string;readonly providerId:string;readonly providerName:string;readonly priority:BreakingPriority;
  readonly location:string|null;readonly occurredAt:string;readonly updatedAt:string;readonly activity:RiskActivity;
  readonly latitude:number|null;readonly longitude:number|null;readonly mapTarget:string|null;
  readonly timelineTarget:string;readonly breakingTarget:string;readonly stale:boolean;
};
export type RiskRuleMetadata={readonly ruleId:string;readonly ruleVersion:"1.0.0";readonly category:"all";readonly inputFields:readonly string[];readonly resultingLevel:RiskLevel;readonly explanationTemplate:string;readonly precedence:number};
export type RiskSummary={readonly totalEvaluated:number;readonly counts:Readonly<Record<RiskLevel,number>>;readonly categories:readonly BreakingCategory[];readonly evaluatedAt:string;readonly degraded:boolean;readonly stale:boolean};
export type RiskSnapshot={readonly riskVersion:typeof RISK_VERSION;readonly evaluatedAt:string;readonly degraded:boolean;readonly stale:boolean;readonly alerts:readonly RiskAlert[];readonly summary:RiskSummary;readonly rules:readonly RiskRuleMetadata[];readonly providers:readonly {sourceId:string;sourceName:string;status:string;stale:boolean}[]};
export type RiskFilters={readonly levels:readonly RiskLevel[];readonly categories:readonly BreakingCategory[];readonly provider:string;readonly from:string|null;readonly to:string|null;readonly activity:"" | RiskActivity;readonly coordinates:""|"available"|"unavailable";readonly search:string;readonly limit:number};
