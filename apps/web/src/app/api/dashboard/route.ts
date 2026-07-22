import { NextResponse } from "next/server";import { getAtlasDataHub } from "@/lib/data-hub";
export async function GET(){const hub=getAtlasDataHub();await hub.refreshSources();return NextResponse.json(await hub.getDashboardSnapshot(),{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=300"}});}
