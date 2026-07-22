import { NextRequest, NextResponse } from "next/server";
import { getWeather, parseCoordinate } from "@/lib/data-sources/open-meteo";
import { UpstreamError } from "@/lib/http/fetch-text";
export async function GET(request: NextRequest) {
  const latitude = parseCoordinate(request.nextUrl.searchParams.get("latitude"), "latitude");
  const longitude = parseCoordinate(request.nextUrl.searchParams.get("longitude"), "longitude");
  if (latitude === null || longitude === null) return NextResponse.json({ error: { code: "invalid-parameters", message: "latitude (-90..90) and longitude (-180..180) are required" } }, { status: 400 });
  try { return NextResponse.json(await getWeather(latitude, longitude), { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } }); }
  catch (error) { const upstream = error instanceof UpstreamError ? error : new UpstreamError("unavailable", "Weather source unavailable", 503); return NextResponse.json({ error: { code: upstream.code, message: "Open-Meteo weather data is currently unavailable" }, source: { id: "open-meteo", name: "Open-Meteo", url: "https://open-meteo.com/en/docs" }, fetchedAt: new Date().toISOString() }, { status: upstream.status }); }
}
