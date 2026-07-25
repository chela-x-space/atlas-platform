import type { BreakingCategory } from "@/lib/breaking/breaking-contract";
import type { RiskAlert,RiskLevel } from "@/lib/risk/risk-contracts";

export const REPORTS_VERSION="atlas-reports-v1.2" as const;
export type ReportType="daily-global"|"weekly-global"|"ai-technology"|"cybersecurity"|"natural-disaster"|"space-activity"|"breaking-news"|"risk-summary";
export type ReportHistory="today"|"24h"|"7d"|"30d";
export type ReportExportFormat="markdown"|"json"|"text";
export type ReportEvent={readonly canonicalId:string;readonly title:string;readonly category:BreakingCategory;readonly occurredAt:string;readonly location:string|null;readonly providerId:string;readonly providerName:string;readonly attribution:string;readonly riskLevel:RiskLevel;readonly canonicalTarget:string;readonly timelineTarget:string};
export type AtlasReport={
  readonly reportId:string;readonly reportType:ReportType;readonly title:string;readonly generatedAt:string;
  readonly coveredFrom:string;readonly coveredTo:string;readonly sourceCount:number;readonly eventCount:number;
  readonly categories:readonly BreakingCategory[];readonly providers:readonly {id:string;name:string;attribution:readonly string[]}[];
  readonly canonicalReferences:readonly string[];readonly summary:{readonly eventCount:number;readonly sourceCount:number;readonly categoryCount:number;readonly regionCount:number};
  readonly keyEvents:readonly ReportEvent[];readonly categoryBreakdown:readonly {category:BreakingCategory;count:number}[];
  readonly timeline:readonly ReportEvent[];readonly riskBreakdown:readonly {level:RiskLevel;count:number}[];
  readonly topRegions:readonly {region:string;count:number}[];readonly officialSources:readonly {providerId:string;providerName:string;attribution:readonly string[]}[];
  readonly degraded:boolean;readonly stale:boolean;
};
export type ReportTypeMetadata={readonly id:ReportType;readonly label:string;readonly defaultHistory:ReportHistory;readonly categories:readonly BreakingCategory[];readonly description:string};
export type ReportFilters={readonly type:ReportType;readonly history:ReportHistory;readonly categories:readonly BreakingCategory[];readonly provider:string;readonly risks:readonly RiskLevel[];readonly region:string;readonly search:string};
export type ReportsResponse={readonly reportsVersion:typeof REPORTS_VERSION;readonly generatedAt:string;readonly degraded:boolean;readonly stale:boolean;readonly report:AtlasReport;readonly types:readonly ReportTypeMetadata[]};
export type ReportEngineInput={readonly alerts:readonly RiskAlert[];readonly generatedAt:string;readonly degraded:boolean;readonly stale:boolean};
