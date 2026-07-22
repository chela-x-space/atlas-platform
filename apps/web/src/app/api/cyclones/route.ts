import { NextResponse } from "next/server";
import { getCyclones } from "@/lib/data-sources/noaa-nhc";
export async function GET() { const result = await getCyclones(); if (result.sources.every((source) => !source.ok)) return NextResponse.json({ ...result, error: { code: "all-sources-unavailable", message: "NOAA/NHC cyclone feeds are currently unavailable" } }, { status: 503 }); return NextResponse.json(result, { status: result.sources.some((source) => !source.ok) ? 206 : 200, headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }); }
