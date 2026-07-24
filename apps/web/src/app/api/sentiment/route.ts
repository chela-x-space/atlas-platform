import { NextRequest, NextResponse } from "next/server";
import { parseSentimentQuery } from "@/lib/sentiment/sentiment-logic.mjs";
import { getSentiment } from "@/lib/sentiment/sentiment-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsed = parseSentimentQuery(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: { code: parsed.code, message: parsed.message } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const snapshot = await getSentiment(parsed.query);
    return NextResponse.json(snapshot, {
      status: snapshot.partial ? 206 : 200,
      headers: {
        "Cache-Control": snapshot.stale ? "private, no-store" : "public, s-maxage=60, stale-while-revalidate=300",
        "X-Atlas-Data-State": snapshot.stale ? "stale" : snapshot.partial ? "partial" : "complete",
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "SENTIMENT_UNAVAILABLE", message: "Verified source-text sentiment is temporarily unavailable" } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
