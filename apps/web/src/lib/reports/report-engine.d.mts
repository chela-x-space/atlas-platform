import type {AtlasReport,ReportEngineInput,ReportExportFormat,ReportFilters,ReportTypeMetadata} from "./report-contracts";
import type {RiskAlert} from "../risk/risk-contracts";
export const REPORT_TYPES:readonly ReportTypeMetadata[];
export function filterReportAlerts(alerts:readonly RiskAlert[],filters:ReportFilters,generatedAt:string):RiskAlert[];
export function generateReport(input:ReportEngineInput,filters:ReportFilters):AtlasReport;
export function exportReport(report:AtlasReport,format:ReportExportFormat):string;
export function parseReportQuery(params:URLSearchParams):{ok:true;filters:ReportFilters}|{ok:false;code:string;message:string};
export function parseExportQuery(params:URLSearchParams):({ok:true;filters:ReportFilters;format:ReportExportFormat}|{ok:false;code:string;message:string});
