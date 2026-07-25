import {NextResponse} from "next/server";
import {RISK_RULES} from "@/lib/risk/risk-engine.mjs";
import {RISK_VERSION} from "@/lib/risk/risk-contracts";
export async function GET(){return NextResponse.json({riskVersion:RISK_VERSION,rules:RISK_RULES},{headers:{"Cache-Control":"public, s-maxage=3600"}})}
