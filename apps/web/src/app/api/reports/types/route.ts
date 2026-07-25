import {NextResponse} from "next/server";
import {REPORT_TYPES} from "@/lib/reports/report-engine.mjs";
import {REPORTS_VERSION} from "@/lib/reports/report-contracts";
export async function GET(){return NextResponse.json({reportsVersion:REPORTS_VERSION,types:REPORT_TYPES},{headers:{"Cache-Control":"public, s-maxage=3600"}})}
