import { NextResponse } from "next/server";
import { getOfficialNews } from "@/lib/news/news-service";
export async function GET() {
  const result = await getOfficialNews();
  const attemptedSources = result.sources.filter((source) => !["disabled", "configuration_required", "paused"].includes(source.status));
  if (attemptedSources.length > 0 && attemptedSources.every((source) => ["unavailable", "rate_limited"].includes(source.status)) && result.items.length === 0) {
    return NextResponse.json({ ...result, error: { code: "all-sources-unavailable", message: "Official news feeds are currently unavailable" } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const partial = result.sources.some((source) => source.status === "degraded" || source.status === "unavailable" || source.status === "rate_limited");
  return NextResponse.json(result, { status: partial ? 206 : 200, headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } });
}
