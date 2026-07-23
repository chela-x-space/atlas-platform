import { NextResponse } from "next/server";
import { getAtlasDataHub } from "@/lib/data-hub";
import { getOfficialNews } from "@/lib/news/news-service";

export async function GET() {
  const generatedAt = new Date().toISOString();
  try {
    const hub = getAtlasDataHub();
    const [, news] = await Promise.all([hub.refreshSources(), getOfficialNews()]);
    return NextResponse.json({
      generatedAt,
      sources: hub.getSourceHealth(),
      newsProviders: news.sources,
    }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({
      error: { code: "SOURCE_HEALTH_UNAVAILABLE", message: "Source health is temporarily unavailable" },
      generatedAt,
      sources: [],
      newsProviders: [],
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
