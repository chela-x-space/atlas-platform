import { NextRequest, NextResponse } from "next/server";
import { parseGraphQuery } from "@/lib/graph/graph-logic.mjs";
import { getGraph } from "@/lib/graph/graph-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsed = parseGraphQuery(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: { code: parsed.code, message: parsed.message } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const response = await getGraph(parsed.filters);
    return NextResponse.json(response, {
      status: response.partial ? 206 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        error: { code: "GRAPH_UNAVAILABLE", message: "The deterministic event graph is temporarily unavailable" },
        nodes: [],
        edges: [],
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
