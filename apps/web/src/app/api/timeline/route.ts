import { NextRequest, NextResponse } from "next/server";
import { getTimeline } from "@/lib/timeline/timeline-service";
import { parseTimelineQuery } from "@/lib/timeline/timeline-logic.mjs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsed = parseTimelineQuery(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: { code: parsed.code, message: parsed.message } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const result = await getTimeline(parsed.filters);
    if (!result.ok) {
      return NextResponse.json(
        { error: { code: result.code, message: result.message } },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(result.response, {
      status: result.response.partial ? 206 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        error: { code: "TIMELINE_UNAVAILABLE", message: "The global timeline is temporarily unavailable" },
        items: [],
        total: 0,
        returned: 0,
        nextCursor: null,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
