import {NextResponse} from "next/server";import {getAlertSnapshot} from "@/lib/alerts/alert-service";
export const dynamic="force-dynamic";
export async function GET(){try{const value=await getAlertSnapshot();return NextResponse.json({sources:value.summary.sourceCounts,degraded:value.degraded,warnings:value.warnings,generatedAt:value.generatedAt},{status:value.degraded?206:200})}catch{return NextResponse.json({error:{code:"ALERTS_UNAVAILABLE",message:"Alert sources are temporarily unavailable"}},{status:503})}}
