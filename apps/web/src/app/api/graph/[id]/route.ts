import { NextResponse } from "next/server";
import { getGraphById } from "@/lib/graph/graph-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const result = await getGraphById(id);
    if (result.status === "invalid") {
      return NextResponse.json(
        { error: { code: result.code, message: result.message } },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (result.status === "not_found") {
      return NextResponse.json(
        { error: { code: result.code, message: result.message } },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(result.response, {
      status: result.response.partial ? 206 : 200,
      headers: { "Cache-Control": "private, no-cache, must-revalidate" },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "GRAPH_UNAVAILABLE", message: "The deterministic event graph is temporarily unavailable" } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
