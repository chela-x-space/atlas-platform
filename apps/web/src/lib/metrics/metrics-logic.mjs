export const METRICS_VERSION = "atlas-global-metrics-v1";
export const METRIC_IDS = Object.freeze([
  "global-events-1h", "global-events-24h", "global-events-7d",
  "earthquakes-24h", "earthquakes-magnitude-4-plus-24h",
  "earthquakes-magnitude-5-plus-24h", "earthquakes-magnitude-6-plus-24h",
  "strongest-earthquake-magnitude-24h", "active-cyclones",
  "cyclone-advisories-updated-24h", "nasa-reports-24h", "esa-reports-24h",
  "space-science-reports-24h", "providers-total-configured",
  "providers-operational", "providers-degraded", "providers-unavailable",
  "providers-configuration-required", "provider-availability-percentage",
  "graph-total-nodes", "graph-total-edges", "graph-events-represented",
  "graph-sources-represented", "graph-locations-represented",
]);
const QUERY_METRIC_IDS = new Set([...METRIC_IDS, "planet-activity-index"]);
const WINDOWS = new Set(["1h", "24h", "7d"]);
const PARAMETERS = new Set(["window", "metric"]);
const FORMULA_VERSION = "1.0.0";
const ACTIVITY_EXPLANATION = "This index measures verified event activity, not predicted impact or risk.";
const ACTIVE_EXCLUSIONS = new Set(["configuration_required", "disabled", "paused"]);

function roundOne(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function validInstant(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function stableUniqueItems(items) {
  const unique = new Map();
  for (const item of [...items].sort((a, b) => a.id.localeCompare(b.id))) {
    if (item?.verificationStatus === "verified" && typeof item.id === "string" && !unique.has(item.id)) {
      unique.set(item.id, item);
    }
  }
  return [...unique.values()];
}

function statusClass(source) {
  if (source.status === "online" && !source.stale) return "operational";
  if (source.status === "degraded" || source.stale || source.status === "rate_limited") return "degraded";
  if (ACTIVE_EXCLUSIONS.has(source.status)) return source.status;
  return "unavailable";
}

function sourceCompleteness(sourceIds, health) {
  const sources = sourceIds.map((id) => health.find((source) => source.sourceId === id)).filter(Boolean);
  if (!sources.length || sources.every((source) => {
    const status = statusClass(source);
    return status === "unavailable" || ACTIVE_EXCLUSIONS.has(status);
  })) return "unavailable";
  return sources.every((source) => statusClass(source) === "operational") ? "complete" : "partial";
}

function provenance(sourceIds, health, inputBySource) {
  return sourceIds.map((sourceId) => {
    const source = health.find((candidate) => candidate.sourceId === sourceId);
    return {
      sourceId,
      sourceName: source?.sourceName ?? sourceId,
      status: source?.status ?? "unavailable",
      stale: source?.stale ?? false,
      inputCount: inputBySource.get(sourceId) ?? 0,
    };
  });
}

function metricStatus(completeness) {
  return completeness === "unavailable" ? "unavailable" : completeness === "partial" ? "partial" : "normal";
}

function activityStatus(value, completeness = "complete") {
  if (value === null || completeness === "unavailable") return "unavailable";
  if (value < 25) return "normal";
  if (value < 50) return "elevated";
  return "high";
}

export function activityStatusForValue(value) {
  return activityStatus(value);
}

function within(item, boundary, generatedMs, field = "occurredAt") {
  const instant = Date.parse(item[field]);
  return Number.isFinite(instant) && instant >= boundary && instant <= generatedMs;
}

function magnitude(item) {
  const value = item.metadata?.magnitude;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function severityPoints(value) {
  if (value < 4) return 0.25;
  if (value < 5) return 1;
  if (value < 6) return 3;
  if (value < 7) return 8;
  return 20;
}

function makeMetric({
  id, label, description, value, unit, completeness, window = null,
  formulaId, generatedAt, inputs, sourceIds, health, breakdown = {}, limitations = [],
  inputCountOverride,
}) {
  const inputBySource = new Map();
  for (const input of inputs) inputBySource.set(input.sourceId, (inputBySource.get(input.sourceId) ?? 0) + 1);
  return {
    id, label, description, value, unit, status: metricStatus(completeness),
    completeness, window, formulaId, formulaVersion: FORMULA_VERSION, generatedAt,
    inputCount: inputCountOverride ?? inputs.length, sourceIds: [...sourceIds],
    provenance: provenance(sourceIds, health, inputBySource),
    breakdown, limitations,
  };
}

function component(id, label, rawValue, normalizedValue, weight, sourceIds, completeness, breakdown, limitations) {
  return {
    id, label, rawValue, normalizedValue, weight,
    contribution: normalizedValue === null ? null : roundOne(normalizedValue * weight),
    sourceIds: [...sourceIds], completeness, breakdown, limitations,
  };
}

export function calculateMetricsSnapshot({ items, sourceHealth, graph, generatedAt }) {
  if (!validInstant(generatedAt)) throw new TypeError("generatedAt must be a valid ISO timestamp");
  const generatedMs = Date.parse(generatedAt);
  const boundaries = {
    "1h": generatedMs - 60 * 60_000,
    "24h": generatedMs - 24 * 60 * 60_000,
    "7d": generatedMs - 7 * 24 * 60 * 60_000,
  };
  const verified = stableUniqueItems(items);
  const eventRecords = verified.filter((item) => item.itemType === "event" || item.itemType === "advisory");
  const reports = verified.filter((item) => item.itemType === "report");
  const allSourceIds = [...new Set(sourceHealth.map((source) => source.sourceId))].sort();
  const globalCompleteness = sourceCompleteness(allSourceIds, sourceHealth);
  const metrics = [];

  for (const window of ["1h", "24h", "7d"]) {
    const inputs = eventRecords.filter((item) => within(item, boundaries[window], generatedMs));
    metrics.push(makeMetric({
      id: `global-events-${window}`, label: `Global events · ${window}`,
      description: `Verified canonical event and advisory records occurring in the inclusive ${window} UTC window.`,
      value: globalCompleteness === "unavailable" ? null : inputs.length, unit: "events",
      completeness: globalCompleteness, window, formulaId: `verified-event-count-${window}-v1`,
      generatedAt, inputs, sourceIds: allSourceIds, health: sourceHealth,
      limitations: ["Reports are excluded from event volume.", "Coverage follows responding official providers."],
    }));
  }

  const earthquakeSources = ["usgs-earthquakes"];
  const earthquakeCompleteness = sourceCompleteness(earthquakeSources, sourceHealth);
  const earthquakes = eventRecords.filter((item) =>
    item.sourceId === "usgs-earthquakes" && item.category === "earthquake" &&
    within(item, boundaries["24h"], generatedMs));
  const validMagnitudes = earthquakes.map((item) => ({ item, value: magnitude(item) }))
    .filter((entry) => entry.value !== null);
  const magnitudeBands = {
    below4: validMagnitudes.filter(({ value }) => value < 4).length,
    magnitude4To4_9: validMagnitudes.filter(({ value }) => value >= 4 && value < 5).length,
    magnitude5To5_9: validMagnitudes.filter(({ value }) => value >= 5 && value < 6).length,
    magnitude6To6_9: validMagnitudes.filter(({ value }) => value >= 6 && value < 7).length,
    magnitude7Plus: validMagnitudes.filter(({ value }) => value >= 7).length,
    invalidOrMissing: earthquakes.length - validMagnitudes.length,
  };
  const earthquakeDefinitions = [
    ["earthquakes-24h", "Earthquakes · 24h", earthquakes.length, "verified-earthquake-count-24h-v1", {}],
    ["earthquakes-magnitude-4-plus-24h", "Earthquakes M4.0+ · 24h", validMagnitudes.filter(({ value }) => value >= 4).length, "earthquake-magnitude-threshold-4-v1", magnitudeBands],
    ["earthquakes-magnitude-5-plus-24h", "Earthquakes M5.0+ · 24h", validMagnitudes.filter(({ value }) => value >= 5).length, "earthquake-magnitude-threshold-5-v1", magnitudeBands],
    ["earthquakes-magnitude-6-plus-24h", "Earthquakes M6.0+ · 24h", validMagnitudes.filter(({ value }) => value >= 6).length, "earthquake-magnitude-threshold-6-v1", magnitudeBands],
  ];
  for (const [id, label, count, formulaId, breakdown] of earthquakeDefinitions) {
    metrics.push(makeMetric({
      id, label, description: `${label} from verified USGS records in the inclusive 24h UTC window.`,
      value: earthquakeCompleteness === "unavailable" ? null : count, unit: "earthquakes",
      completeness: earthquakeCompleteness, window: "24h", formulaId, generatedAt,
      inputs: earthquakes, sourceIds: earthquakeSources, health: sourceHealth, breakdown,
      limitations: ["Events with missing magnitude remain in total earthquake counts but not magnitude thresholds."],
    }));
  }
  const strongest = validMagnitudes.length ? Math.max(...validMagnitudes.map(({ value }) => value)) : null;
  const strongestCompleteness = earthquakeCompleteness === "unavailable" || strongest === null
    ? "unavailable"
    : earthquakeCompleteness;
  metrics.push(makeMetric({
    id: "strongest-earthquake-magnitude-24h", label: "Strongest verified magnitude · 24h",
    description: "Maximum valid verified USGS magnitude in the inclusive 24h UTC window.",
    value: earthquakeCompleteness === "unavailable" ? null : strongest, unit: "magnitude",
    completeness: strongestCompleteness, window: "24h", formulaId: "strongest-verified-magnitude-24h-v1",
    generatedAt, inputs: validMagnitudes.map(({ item }) => item), sourceIds: earthquakeSources,
    health: sourceHealth, breakdown: magnitudeBands,
    limitations: ["A null value means no valid magnitude was supplied in the available window."],
  }));

  const cycloneSources = ["noaa-nhc"];
  const cycloneCompleteness = sourceCompleteness(cycloneSources, sourceHealth);
  const cycloneItems = eventRecords.filter((item) => item.sourceId === "noaa-nhc" && item.itemType === "advisory");
  const cycloneGroups = new Map();
  for (const item of cycloneItems) {
    const canonicalId = item.relatedEventId ?? item.id;
    const group = cycloneGroups.get(canonicalId) ?? [];
    group.push(item);
    cycloneGroups.set(canonicalId, group);
  }
  const activeCyclones = [...cycloneGroups.values()].filter((group) => {
    const latest = [...group].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.id.localeCompare(b.id))[0];
    return latest && !["inactive", "ended", "closed"].includes(String(latest.status).toLowerCase());
  });
  const advisoryUpdates = cycloneItems.filter((item) => within(item, boundaries["24h"], generatedMs, "updatedAt"));
  const additionalUpdates = activeCyclones.reduce((total, group) =>
    total + Math.max(0, group.filter((item) => within(item, boundaries["24h"], generatedMs, "updatedAt")).length - 1), 0);
  metrics.push(makeMetric({
    id: "active-cyclones", label: "Active verified cyclones",
    description: "Distinct active NOAA/NHC canonical cyclone IDs currently represented by verified advisories.",
    value: cycloneCompleteness === "unavailable" ? null : activeCyclones.length, unit: "cyclones",
    completeness: cycloneCompleteness, formulaId: "active-canonical-cyclones-v1", generatedAt,
    inputs: activeCyclones.flat(), sourceIds: cycloneSources, health: sourceHealth,
    breakdown: { additionalAdvisoryUpdates24h: additionalUpdates },
    limitations: ["Coverage is limited to NOAA/NHC Atlantic and eastern/central Pacific basins."],
  }));
  metrics.push(makeMetric({
    id: "cyclone-advisories-updated-24h", label: "Cyclone advisories updated · 24h",
    description: "Verified NOAA/NHC advisory records whose official updatedAt is in the inclusive 24h UTC window.",
    value: cycloneCompleteness === "unavailable" ? null : advisoryUpdates.length, unit: "advisories",
    completeness: cycloneCompleteness, window: "24h", formulaId: "verified-advisory-updates-24h-v1",
    generatedAt, inputs: advisoryUpdates, sourceIds: cycloneSources, health: sourceHealth,
    breakdown: { activeCyclones: activeCyclones.length, additionalUpdates },
    limitations: ["No missing advisories are estimated."],
  }));

  const reportSources = ["nasa-rss", "esa-rss"];
  const nasaCompleteness = sourceCompleteness(["nasa-rss"], sourceHealth);
  const esaCompleteness = sourceCompleteness(["esa-rss"], sourceHealth);
  const spaceCompleteness = sourceCompleteness(reportSources, sourceHealth);
  const nasaReports = reports.filter((item) => item.sourceId === "nasa-rss" && within(item, boundaries["24h"], generatedMs));
  const esaReports = reports.filter((item) => item.sourceId === "esa-rss" && within(item, boundaries["24h"], generatedMs));
  const combinedReports = [...nasaReports, ...esaReports].sort((a, b) => a.id.localeCompare(b.id));
  for (const definition of [
    ["nasa-reports-24h", "NASA reports · 24h", nasaReports, ["nasa-rss"], nasaCompleteness],
    ["esa-reports-24h", "ESA reports · 24h", esaReports, ["esa-rss"], esaCompleteness],
    ["space-science-reports-24h", "Space and science reports · 24h", combinedReports, reportSources, spaceCompleteness],
  ]) {
    const [id, label, inputs, sourceIds, completeness] = definition;
    metrics.push(makeMetric({
      id, label, description: `${label} published in the inclusive 24h UTC window.`,
      value: completeness === "unavailable" ? null : inputs.length, unit: "reports",
      completeness, window: "24h", formulaId: "verified-space-reports-24h-v1",
      generatedAt, inputs, sourceIds, health: sourceHealth,
      breakdown: { nasa: nasaReports.length, esa: esaReports.length },
      limitations: ["Counts include official feed records only; missing provider records are not estimated."],
    }));
  }

  const classified = sourceHealth.map((source) => ({ source, classification: statusClass(source) }));
  const activeExpected = classified.filter(({ classification }) => !ACTIVE_EXCLUSIONS.has(classification));
  const operational = classified.filter(({ classification }) => classification === "operational");
  const degraded = classified.filter(({ classification }) => classification === "degraded");
  const unavailable = classified.filter(({ classification }) => classification === "unavailable");
  const configurationRequired = classified.filter(({ classification }) => classification === "configuration_required");
  const availability = activeExpected.length
    ? roundOne((activeExpected.reduce((sum, { classification }) =>
      sum + (classification === "operational" ? 1 : classification === "degraded" ? 0.5 : 0), 0) /
      activeExpected.length) * 100)
    : null;
  const availabilityCompleteness = activeExpected.length ? "complete" : "unavailable";
  const availabilityInputs = sourceHealth.map((source) => ({ sourceId: source.sourceId }));
  for (const [id, label, value, unit, formulaId] of [
    ["providers-total-configured", "Configured metric providers", sourceHealth.length, "providers", "configured-provider-count-v1"],
    ["providers-operational", "Operational providers", operational.length, "providers", "provider-status-count-v1"],
    ["providers-degraded", "Degraded providers", degraded.length, "providers", "provider-status-count-v1"],
    ["providers-unavailable", "Unavailable providers", unavailable.length, "providers", "provider-status-count-v1"],
    ["providers-configuration-required", "Configuration-required providers", configurationRequired.length, "providers", "provider-status-count-v1"],
    ["provider-availability-percentage", "Provider availability", availability, "percent", "active-provider-weighted-availability-v1"],
  ]) {
    metrics.push(makeMetric({
      id, label, description: id === "provider-availability-percentage"
        ? "Operational=1.0, degraded=0.5, unavailable=0.0; configuration-required, disabled, and paused providers are excluded from the denominator."
        : `${label} in the current metrics runtime provider set.`,
      value, unit, completeness: id === "provider-availability-percentage" ? availabilityCompleteness : "complete",
      formulaId, generatedAt, inputs: availabilityInputs, sourceIds: allSourceIds, health: sourceHealth,
      breakdown: { activeExpected: activeExpected.length, denominatorExcluded: sourceHealth.length - activeExpected.length },
      limitations: ["Percentage is rounded to one decimal place."],
    }));
  }

  const graphNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const graphEdges = Array.isArray(graph?.edges) ? graph.edges : [];
  const graphCompleteness = graph?.partial ? "partial" : "complete";
  const graphCounts = {
    events: graphNodes.filter((node) => node.nodeType === "event" || node.nodeType === "advisory").length,
    sources: graphNodes.filter((node) => node.nodeType === "source").length,
    locations: graphNodes.filter((node) => node.nodeType === "location").length,
  };
  for (const [id, label, value, unit] of [
    ["graph-total-nodes", "Graph nodes", graphNodes.length, "nodes"],
    ["graph-total-edges", "Graph edges", graphEdges.length, "edges"],
    ["graph-events-represented", "Events represented in graph", graphCounts.events, "events"],
    ["graph-sources-represented", "Sources represented in graph", graphCounts.sources, "sources"],
    ["graph-locations-represented", "Locations represented in graph", graphCounts.locations, "locations"],
  ]) {
    metrics.push(makeMetric({
      id, label, description: `${label} from the deterministic Event Graph v1 snapshot.`,
      value, unit, completeness: graphCompleteness, formulaId: "event-graph-node-edge-count-v1",
      generatedAt, inputs: [], sourceIds: allSourceIds, health: sourceHealth,
      inputCountOverride: value,
      breakdown: { nodeTypes: Object.fromEntries(["event", "report", "advisory", "location", "source"].map((type) =>
        [type, graphNodes.filter((node) => node.nodeType === type).length])),
      edgeTypes: Object.fromEntries(["reports_on", "originates_from", "located_in", "published_by", "updates", "references", "related_exact"].map((type) =>
        [type, graphEdges.filter((edge) => edge.edgeType === type).length])) },
      limitations: ["Counts reflect the bounded current graph snapshot."],
    }));
  }

  const earthRaw = validMagnitudes.reduce((sum, { value }) => sum + severityPoints(value), 0);
  const earth = component(
    "earth-activity", "Earth Activity", earthquakeCompleteness === "unavailable" ? null : earthRaw,
    earthquakeCompleteness === "unavailable" ? null : Math.min(100, earthRaw), 0.5,
    earthquakeSources, earthquakeCompleteness, magnitudeBands,
    ["Only valid verified magnitudes contribute severity points."],
  );
  const cycloneRaw = activeCyclones.length * 20 + additionalUpdates * 2;
  const cyclone = component(
    "cyclone-activity", "Cyclone Activity", cycloneCompleteness === "unavailable" ? null : cycloneRaw,
    cycloneCompleteness === "unavailable" ? null : Math.min(100, cycloneRaw), 0.25,
    cycloneSources, cycloneCompleteness,
    { activeCyclones: activeCyclones.length, activeCyclonePoints: activeCyclones.length * 20, additionalUpdates, advisoryUpdatePoints: additionalUpdates * 2 },
    ["No missing NOAA/NHC advisories are estimated."],
  );
  const spaceRaw = combinedReports.length * 5;
  const space = component(
    "space-activity", "Space Activity", spaceCompleteness === "unavailable" ? null : spaceRaw,
    spaceCompleteness === "unavailable" ? null : Math.min(100, spaceRaw), 0.25,
    reportSources, spaceCompleteness,
    { nasa: nasaReports.length, esa: esaReports.length, pointsPerReport: 5 },
    ["Only verified NASA and ESA feed reports in the 24h window contribute."],
  );
  const components = [earth, cyclone, space];
  const availableComponents = components.filter((entry) => entry.normalizedValue !== null);
  const indexCompleteness = availableComponents.length === 0
    ? "unavailable"
    : components.every((entry) => entry.completeness === "complete") ? "complete" : "partial";
  const indexValue = availableComponents.length
    ? roundOne(components.reduce((sum, entry) =>
      sum + (entry.normalizedValue === null ? 0 : entry.normalizedValue * entry.weight), 0))
    : null;
  const activityIndex = {
    id: "planet-activity-index", value: indexValue, maximum: 100,
    status: activityStatus(indexValue, indexCompleteness),
    formulaId: "planet-activity-index-v1", formulaVersion: FORMULA_VERSION,
    components, completeness: indexCompleteness, explanation: ACTIVITY_EXPLANATION,
  };

  return {
    metricsVersion: METRICS_VERSION, generatedAt,
    partial: globalCompleteness !== "complete" || graphCompleteness !== "complete" || indexCompleteness !== "complete",
    stale: false, sourceHealth: [...sourceHealth].sort((a, b) => a.sourceId.localeCompare(b.sourceId)),
    metrics: metrics.sort((a, b) => a.id.localeCompare(b.id)),
    activityIndex,
    inputSummary: {
      verifiedTimelineItems: items.filter((item) => item?.verificationStatus === "verified").length,
      uniqueTimelineItems: verified.length, eventRecords: eventRecords.length, reportRecords: reports.length,
      graphNodes: graphNodes.length, graphEdges: graphEdges.length,
      windowBoundaries: Object.fromEntries(Object.entries(boundaries).map(([key, value]) => [key, new Date(value).toISOString()])),
    },
  };
}

export function parseMetricsQuery(searchParams) {
  for (const key of searchParams.keys()) {
    if (!PARAMETERS.has(key)) return { ok: false, code: "INVALID_PARAMETERS", message: `Unsupported parameter: ${key}` };
  }
  const window = searchParams.get("window");
  const metric = searchParams.get("metric");
  if (window !== null && !WINDOWS.has(window)) {
    return { ok: false, code: "INVALID_WINDOW", message: "window must be one of: 1h, 24h, 7d" };
  }
  if (metric !== null && !QUERY_METRIC_IDS.has(metric)) {
    return { ok: false, code: "INVALID_METRIC", message: "metric is not supported" };
  }
  return { ok: true, query: { window, metric } };
}

export function filterMetricsSnapshot(snapshot, query) {
  const metrics = snapshot.metrics.filter((metric) =>
    (!query.window || metric.window === query.window) &&
    (!query.metric || metric.id === query.metric));
  return {
    ...snapshot,
    metrics,
    activityIndex: query.metric && query.metric !== "planet-activity-index"
      ? { ...snapshot.activityIndex, components: [] }
      : snapshot.activityIndex,
  };
}
