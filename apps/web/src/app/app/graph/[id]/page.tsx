import Link from "next/link";
import { notFound } from "next/navigation";
import type {
  GraphEdge,
  GraphNode,
} from "@/lib/graph/graph-contract";
import { getGraphById } from "@/lib/graph/graph-service";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function label(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function NodeCard({ node, primary }: { node: GraphNode; primary?: boolean }) {
  return (
    <article className={`event-graph-node ${node.nodeType}${primary ? " primary" : ""}`}>
      <div>
        <span>{label(node.nodeType)}</span>
        {node.category && <span>{label(node.category)}</span>}
      </div>
      <h3>{node.title}</h3>
      {node.sourceName && <p>{node.sourceName}</p>}
      {node.location && <p>{node.location}</p>}
      {node.occurredAt && <time dateTime={node.occurredAt}>{formatDate(node.occurredAt)}</time>}
      <small>{node.canonicalId}</small>
    </article>
  );
}

function EdgeCard({ edge, nodes }: { edge: GraphEdge; nodes: Map<string, GraphNode> }) {
  const from = nodes.get(edge.fromNode);
  const to = nodes.get(edge.toNode);
  if (!from || !to) return null;
  return (
    <article className="event-graph-relationship">
      <div className="event-graph-edge-line">
        <span>{from.title}</span>
        <strong>↓ {label(edge.edgeType)}</strong>
        <span>{to.title}</span>
      </div>
      <p>{edge.reason}</p>
      <details>
        <summary>Rule and provenance</summary>
        <code>{edge.ruleId}</code>
        {edge.provenance.map((entry, index) => (
          <span key={`${entry.field}-${index}`}>
            {entry.sourceName} · {entry.field} · {String(entry.value)}
          </span>
        ))}
      </details>
    </article>
  );
}

export default async function EventGraphPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getGraphById(id);
  if (result.status === "invalid" || result.status === "not_found") notFound();
  const { nodes, edges, graphVersion, generatedAt, partial } = result.response;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const primary = nodes.find((node) => node.canonicalId === id) ??
    nodes.find((node) => node.nodeType === "event" || node.nodeType === "report" || node.nodeType === "advisory");

  return (
    <main className="event-graph-page">
      <nav className="event-detail-back" aria-label="Back navigation">
        <Link href={primary ? `/app/events/${encodeURIComponent(primary.canonicalId)}` : "/app/timeline"}>
          ← Event detail
        </Link>
        <Link href="/app/timeline">Global Timeline</Link>
      </nav>

      <header className="event-graph-header">
        <p>ATLAS DETERMINISTIC EVENT GRAPH</p>
        <h1>{primary?.title ?? "Verified relationship graph"}</h1>
        <div>
          <span>{graphVersion}</span>
          <span>{nodes.length} nodes</span>
          <span>{edges.length} edges</span>
          <time dateTime={generatedAt}>Input state {formatDate(generatedAt)}</time>
        </div>
      </header>

      {partial && (
        <aside className="event-detail-partial" role="status">
          <strong>Partial source coverage</strong>
          <span>The graph contains only verified records available from responding sources.</span>
        </aside>
      )}

      <section className="event-graph-section" aria-labelledby="graph-map-heading">
        <div className="event-graph-section-heading">
          <div>
            <span>Informational · read only</span>
            <h2 id="graph-map-heading">Relationship map</h2>
          </div>
          <p>Every connection below names the exact deterministic rule that created it.</p>
        </div>
        <div className="event-graph-map">
          {nodes.map((node) => <NodeCard key={node.id} node={node} primary={node.id === primary?.id} />)}
        </div>
      </section>

      <section className="event-graph-section" aria-labelledby="relationships-heading">
        <div className="event-graph-section-heading">
          <div>
            <span>Explainable edges</span>
            <h2 id="relationships-heading">Verified relationships</h2>
          </div>
        </div>
        <div className="event-graph-relationships">
          {edges.map((edge) => <EdgeCard key={edge.id} edge={edge} nodes={byId} />)}
          {edges.length === 0 && <p>No deterministic relationship is present for this node.</p>}
        </div>
      </section>
    </main>
  );
}
