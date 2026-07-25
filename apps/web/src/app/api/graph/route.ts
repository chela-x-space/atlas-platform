import { NextRequest, NextResponse } from "next/server";
import { parseGraphQuery } from "@/lib/graph/graph-logic.mjs";
import { getGraph } from "@/lib/graph/graph-service";
import { getEntityTraversal } from "@/lib/graph/entity-graph-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("view") === "entities") {
    const allowed = new Set(["view", "root", "depth"]);
    for (const key of request.nextUrl.searchParams.keys()) if (!allowed.has(key)) {
      return NextResponse.json({ error: { code: "INVALID_PARAMETERS", message: `Unsupported entity graph parameter: ${key}` } }, { status: 400 });
    }
    const depth = Number(request.nextUrl.searchParams.get("depth") ?? 1);
    if (!Number.isInteger(depth) || depth < 1 || depth > 2) return NextResponse.json({ error: { code: "INVALID_DEPTH", message: "depth must be 1 or 2" } }, { status: 400 });
    try {
      const response = await getEntityTraversal(request.nextUrl.searchParams.get("root"), depth);
      return response ? NextResponse.json(response, { status: response.degraded ? 206 : 200 }) : NextResponse.json({ error: { code: "GRAPH_ROOT_NOT_FOUND", message: "Canonical graph root was not found" } }, { status: 404 });
    } catch {
      return NextResponse.json({ error: { code: "ENTITY_GRAPH_UNAVAILABLE", message: "The canonical entity graph is unavailable" } }, { status: 503 });
    }
  }
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
