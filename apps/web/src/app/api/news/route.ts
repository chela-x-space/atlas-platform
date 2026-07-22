import { NextResponse } from "next/server";
import { getOfficialNews } from "@/lib/news/news-service";
export async function GET() {
  const result = await getOfficialNews();
  if (result.sources.every((source) => !source.ok)) return NextResponse.json({ ...result, error: { code: "all-sources-unavailable", message: "Official news feeds are currently unavailable" } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(result, { status: result.sources.some((source) => !source.ok) ? 206 : 200, headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } });
}
