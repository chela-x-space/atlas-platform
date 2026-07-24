import { createHash } from "node:crypto";

export const GRAPH_VERSION = "atlas-event-graph-v1";
export const GRAPH_NODE_TYPES = Object.freeze(["event", "report", "advisory", "location", "source"]);
export const GRAPH_EDGE_TYPES = Object.freeze([
  "reports_on", "originates_from", "located_in", "published_by",
  "updates", "references", "related_exact",
]);

const NODE_TYPES = new Set(GRAPH_NODE_TYPES);
const EDGE_TYPES = new Set(GRAPH_EDGE_TYPES);
const SOURCES = new Set(["usgs-earthquakes", "noaa-nhc", "nasa-rss", "esa-rss"]);
const CATEGORIES = new Set([
  "earthquake", "cyclone", "weather", "climate", "space", "science",
  "earth-observation", "technology", "news", "health", "wildfire", "flood",
  "volcano", "conflict", "aviation", "marine", "market", "cyber", "energy", "unknown",
]);
const PARAMETERS = new Set(["nodeType", "edgeType", "source", "category"]);

function hash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function canonicalReference(item) {
  return item.itemType === "report"
    ? item.relatedReportId ?? item.relatedEventId ?? item.id
    : item.relatedEventId ?? item.relatedReportId ?? item.id;
}

function recordId(item) {
  return typeof item.metadata?.sourceRecordId === "string"
    ? item.metadata.sourceRecordId
    : canonicalReference(item);
}

function provenance(item, field, value) {
  return [{
    sourceId: item.sourceId,
    sourceName: item.sourceName,
    sourceRecordId: recordId(item),
    sourceUrl: item.sourceUrl,
    field,
    value,
  }];
}

function nodeId(nodeType, canonicalId) {
  return `graph:${nodeType}:${hash(canonicalId)}`;
}

function edgeId(edgeType, fromNode, toNode, ruleId) {
  return `graph:edge:${hash(`${edgeType}|${fromNode}|${toNode}|${ruleId}`)}`;
}

function makeEdge(edgeType, fromNode, toNode, ruleId, reason, createdAt, sourceProvenance) {
  return {
    id: edgeId(edgeType, fromNode, toNode, ruleId),
    edgeType,
    fromNode,
    toNode,
    ruleId,
    reason,
    createdAt,
    provenance: sourceProvenance,
    deterministic: true,
  };
}

function compareNodes(left, right) {
  return left.id.localeCompare(right.id);
}

function compareEdges(left, right) {
  return left.id.localeCompare(right.id);
}

function latestInstant(items) {
  const values = items.flatMap((item) => [item.updatedAt, item.occurredAt])
    .filter((value) => typeof value === "string" && Number.isFinite(Date.parse(value)));
  return values.sort((left, right) => Date.parse(right) - Date.parse(left) || left.localeCompare(right))[0]
    ?? "1970-01-01T00:00:00.000Z";
}

function regionKey(item) {
  if (!item.location) return null;
  const coordinates = item.coordinates
    ? `${item.coordinates.longitude},${item.coordinates.latitude}`
    : "no-coordinates";
  return `${item.location}|${item.countries.join(",")}|${coordinates}`;
}

function itemNode(item, id = nodeId(item.itemType, canonicalReference(item)), metadata = item.metadata) {
  return {
    id,
    nodeType: item.itemType,
    canonicalId: canonicalReference(item),
    title: item.title,
    sourceId: item.sourceId,
    sourceName: item.sourceName,
    category: item.category,
    occurredAt: item.occurredAt,
    updatedAt: item.updatedAt,
    location: item.location,
    coordinates: item.coordinates,
    metadata: stableValue(metadata),
  };
}

export function generateGraph(items, eventGroups = []) {
  const verified = items.filter((item) => item?.verificationStatus === "verified");
  const generatedAt = latestInstant(verified);
  const nodes = new Map();
  const edges = new Map();
  const itemsByCanonical = new Map();

  for (const item of verified) {
    const canonicalId = canonicalReference(item);
    const group = itemsByCanonical.get(canonicalId) ?? [];
    group.push(item);
    itemsByCanonical.set(canonicalId, group);
  }

  for (const [canonicalId, group] of [...itemsByCanonical].sort(([a], [b]) => a.localeCompare(b))) {
    const ordered = [...group].sort((left, right) =>
      Date.parse(left.updatedAt) - Date.parse(right.updatedAt) || left.id.localeCompare(right.id));
    const current = ordered.at(-1);
    const canonicalNode = itemNode(current);
    nodes.set(canonicalNode.id, canonicalNode);

    const sourceNode = {
      id: nodeId("source", current.sourceId),
      nodeType: "source",
      canonicalId: current.sourceId,
      title: current.sourceName,
      sourceId: current.sourceId,
      sourceName: current.sourceName,
      category: null,
      occurredAt: null,
      updatedAt: current.updatedAt,
      location: null,
      coordinates: null,
      metadata: { providerId: current.sourceId },
    };
    nodes.set(sourceNode.id, sourceNode);
    const ownershipType = current.itemType === "report" ? "published_by" : "originates_from";
    const ownershipRule = current.itemType === "report"
      ? "source-ownership-report-v1"
      : "source-ownership-event-v1";
    const ownership = makeEdge(
      ownershipType, canonicalNode.id, sourceNode.id, ownershipRule,
      `Verified ${current.itemType} sourceId exactly equals provider canonicalId`,
      current.updatedAt, provenance(current, "sourceId", current.sourceId),
    );
    edges.set(ownership.id, ownership);

    const key = regionKey(current);
    if (key) {
      const locationNode = {
        id: nodeId("location", key),
        nodeType: "location",
        canonicalId: key,
        title: current.location,
        sourceId: current.sourceId,
        sourceName: current.sourceName,
        category: null,
        occurredAt: null,
        updatedAt: current.updatedAt,
        location: current.location,
        coordinates: current.coordinates,
        metadata: { countries: [...current.countries] },
      };
      nodes.set(locationNode.id, locationNode);
      const locationEdge = makeEdge(
        "located_in", canonicalNode.id, locationNode.id, "verified-location-exact-v1",
        current.coordinates
          ? "Verified source location and exact source coordinates"
          : "Verified source location",
        current.updatedAt,
        provenance(current, "location", current.location).concat(
          current.coordinates ? provenance(current, "coordinates", current.coordinates) : [],
        ),
      );
      edges.set(locationEdge.id, locationEdge);
    }

    if (ordered.length > 1 && current.itemType !== "report") {
      let previous = canonicalNode.id;
      for (const revision of ordered) {
        const revisionNode = itemNode(
          revision,
          nodeId(revision.itemType, `${canonicalId}|revision|${revision.id}`),
          { ...revision.metadata, revisionOf: canonicalId },
        );
        nodes.set(revisionNode.id, revisionNode);
        const updateEdge = makeEdge(
          "updates", previous, revisionNode.id, "official-update-timestamp-v1",
          "Same exact canonical event identifier, ordered by official updatedAt timestamp",
          revision.updatedAt,
          provenance(revision, "relatedEventId", revision.relatedEventId)
            .concat(provenance(revision, "updatedAt", revision.updatedAt)),
        );
        edges.set(updateEdge.id, updateEdge);
        previous = revisionNode.id;
      }
    }
  }

  for (const group of eventGroups) {
    if (group.confidence !== "exact") continue;
    const reports = [...group.relatedReports].sort((a, b) => a.id.localeCompare(b.id));
    const anchorId = group.eventAnchor?.id;
    if (anchorId) {
      const eventNode = nodes.get(nodeId("event", anchorId)) ?? nodes.get(nodeId("advisory", anchorId));
      if (!eventNode) continue;
      for (const report of reports) {
        const reportNode = nodes.get(nodeId("report", report.id));
        if (!reportNode) continue;
        const edge = makeEdge(
          "reports_on", reportNode.id, eventNode.id, "exact-provider-identifier-v1",
          group.groupingReason,
          report.updatedAt,
          [{
            sourceId: report.provider,
            sourceName: report.originalSource,
            sourceRecordId: report.rawProviderId,
            sourceUrl: report.sourceUrl,
            field: "exactProviderIdentifier",
            value: anchorId,
          }],
        );
        edges.set(edge.id, edge);
      }
    } else if (reports.length > 1) {
      for (let index = 1; index < reports.length; index += 1) {
        const from = nodes.get(nodeId("report", reports[index - 1].id));
        const to = nodes.get(nodeId("report", reports[index].id));
        if (!from || !to) continue;
        const edge = makeEdge(
          "related_exact", from.id, to.id, "shared-provider-identifier-v1",
          group.groupingReason,
          reports[index].updatedAt,
          [{
            sourceId: reports[index].provider,
            sourceName: reports[index].originalSource,
            sourceRecordId: reports[index].rawProviderId,
            sourceUrl: reports[index].sourceUrl,
            field: "eventGroupId",
            value: group.id,
          }],
        );
        edges.set(edge.id, edge);
      }
    }
  }

  for (const item of verified) {
    if (item.itemType === "report" && item.relatedEventId) {
      const reportNode = nodes.get(nodeId("report", canonicalReference(item)));
      const eventNode = nodes.get(nodeId("event", item.relatedEventId)) ??
        nodes.get(nodeId("advisory", item.relatedEventId));
      if (reportNode && eventNode) {
        const edge = makeEdge(
          "reports_on", reportNode.id, eventNode.id, "related-event-id-exact-v1",
          "Report relatedEventId exactly equals event canonicalId",
          item.updatedAt,
          provenance(item, "relatedEventId", item.relatedEventId),
        );
        edges.set(edge.id, edge);
      }
    }
    if (item.itemType !== "report" && item.relatedReportId) {
      const from = nodes.get(nodeId(item.itemType, canonicalReference(item)));
      const reportNode = nodes.get(nodeId("report", item.relatedReportId));
      if (from && reportNode) {
        const edge = makeEdge(
          "references", from.id, reportNode.id, "related-report-id-exact-v1",
          "Item relatedReportId exactly equals report canonicalId",
          item.updatedAt,
          provenance(item, "relatedReportId", item.relatedReportId),
        );
        edges.set(edge.id, edge);
      }
    }
  }

  return {
    nodes: [...nodes.values()].sort(compareNodes),
    edges: [...edges.values()].sort(compareEdges),
    generatedAt,
    graphVersion: GRAPH_VERSION,
  };
}

function values(value) {
  return value ? [...new Set(value.split(",").map((part) => part.trim()).filter(Boolean))] : [];
}

export function parseGraphQuery(searchParams) {
  for (const key of searchParams.keys()) {
    if (!PARAMETERS.has(key)) {
      return { ok: false, code: "INVALID_PARAMETERS", message: `Unsupported parameter: ${key}` };
    }
  }
  const nodeTypes = values(searchParams.get("nodeType"));
  const edgeTypes = values(searchParams.get("edgeType"));
  const sources = values(searchParams.get("source"));
  const categories = values(searchParams.get("category"));
  if (nodeTypes.some((value) => !NODE_TYPES.has(value))) {
    return { ok: false, code: "INVALID_PARAMETERS", message: "nodeType contains an unsupported value" };
  }
  if (edgeTypes.some((value) => !EDGE_TYPES.has(value))) {
    return { ok: false, code: "INVALID_PARAMETERS", message: "edgeType contains an unsupported value" };
  }
  if (sources.some((value) => !SOURCES.has(value))) {
    return { ok: false, code: "INVALID_PARAMETERS", message: "source contains an unsupported value" };
  }
  if (categories.some((value) => !CATEGORIES.has(value))) {
    return { ok: false, code: "INVALID_PARAMETERS", message: "category contains an unsupported value" };
  }
  return { ok: true, filters: { nodeTypes, edgeTypes, sources, categories } };
}

export function filterGraph(snapshot, filters) {
  const nodes = snapshot.nodes.filter((node) =>
    (!filters.nodeTypes.length || filters.nodeTypes.includes(node.nodeType)) &&
    (!filters.sources.length || (node.sourceId && filters.sources.includes(node.sourceId))) &&
    (!filters.categories.length || (node.category && filters.categories.includes(node.category))));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = snapshot.edges.filter((edge) =>
    nodeIds.has(edge.fromNode) && nodeIds.has(edge.toNode) &&
    (!filters.edgeTypes.length || filters.edgeTypes.includes(edge.edgeType)));
  return { ...snapshot, nodes, edges };
}

export function graphForId(snapshot, rawId) {
  if (typeof rawId !== "string" || !rawId || rawId.length > 300 || !/^[A-Za-z0-9._~:%-]+$/.test(rawId)) {
    return { ok: false, code: "INVALID_GRAPH_ID", message: "Graph id is invalid" };
  }
  let id;
  try {
    id = decodeURIComponent(rawId);
  } catch {
    return { ok: false, code: "INVALID_GRAPH_ID", message: "Graph id is invalid" };
  }
  const seeds = snapshot.nodes.filter((node) => node.id === id || node.canonicalId === id);
  if (!seeds.length) return { ok: false, code: "NOT_FOUND", message: "Graph node not found" };
  const nodeIds = new Set(seeds.map((node) => node.id));
  const nodesById = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const expanded = new Set();
  const queue = [...nodeIds];
  while (queue.length) {
    const currentId = queue.shift();
    if (expanded.has(currentId)) continue;
    expanded.add(currentId);
    const current = nodesById.get(currentId);
    if (!current || current.nodeType === "source" || current.nodeType === "location") continue;
    for (const edge of snapshot.edges) {
      if (edge.fromNode !== currentId && edge.toNode !== currentId) continue;
      const relatedId = edge.fromNode === currentId ? edge.toNode : edge.fromNode;
      if (!nodeIds.has(relatedId)) {
        nodeIds.add(relatedId);
        queue.push(relatedId);
      }
    }
  }
  return {
    ok: true,
    snapshot: {
      ...snapshot,
      nodes: snapshot.nodes.filter((node) => nodeIds.has(node.id)),
      edges: snapshot.edges.filter((edge) => nodeIds.has(edge.fromNode) && nodeIds.has(edge.toNode)),
    },
  };
}
