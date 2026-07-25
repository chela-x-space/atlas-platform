import {getRiskSnapshot} from "@/lib/risk/risk-service";
import type {ReportFilters,ReportsResponse} from "./report-contracts";
import {REPORTS_VERSION} from "./report-contracts";
import {generateReport,REPORT_TYPES} from "./report-engine.mjs";
import {withReportCache} from "./report-cache.mjs";

export async function getReport(filters:ReportFilters):Promise<ReportsResponse>{
  const key=`${REPORTS_VERSION}:${JSON.stringify(filters)}`;
  return withReportCache(key,60_000,5*60_000,async()=>{
    const risk=await getRiskSnapshot();
    const report=generateReport({alerts:risk.alerts,generatedAt:risk.evaluatedAt,degraded:risk.degraded,stale:risk.stale},filters);
    return{reportsVersion:REPORTS_VERSION,generatedAt:risk.evaluatedAt,degraded:risk.degraded,stale:risk.stale,report,types:REPORT_TYPES};
  });
}
