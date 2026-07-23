import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { EventDetailMap } from "@/components/event-detail/EventDetailMap";
import type {
  EventDetail,
  EventDetailSourceHealth,
} from "@/lib/event-detail/event-detail-contract";
import { resolveEventDetail } from "@/lib/event-detail/event-detail-resolver";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };
const getEventDetail = cache(resolveEventDetail);

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "long",
    timeZone: "UTC",
  }).format(new Date(value));
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

function metadataLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
}

function canonicalPath(id: string) {
  return `/app/events/${encodeURIComponent(id)}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getEventDetail(id);
  if (result.status !== "found") {
    return {
      title: "Event not found",
      description: "The requested ATLAS event or verified report was not found.",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: result.response.item.title,
    description: result.response.item.summary.slice(0, 200),
    alternates: {
      canonical: `https://atlas.chela-x.space${canonicalPath(result.response.item.id)}`,
    },
  };
}

function Fact({ name, value }: { name: string; value: string | number }) {
  return <div><dt>{name}</dt><dd>{value}</dd></div>;
}

function TypeFacts({ item }: { item: EventDetail }) {
  if (item.category === "earthquake") {
    return (
      <>
        <Fact name="Magnitude" value={item.magnitude ?? "Unavailable from source"} />
        <Fact name="Depth" value={item.depthKilometers === null ? "Unavailable from source" : `${item.depthKilometers} km`} />
        {typeof item.metadata.alert === "string" && <Fact name="USGS alert" value={item.metadata.alert} />}
        {typeof item.metadata.tsunami === "boolean" && <Fact name="USGS tsunami flag" value={item.metadata.tsunami ? "Yes" : "No"} />}
      </>
    );
  }
  if (item.canonicalType === "advisory") {
    return (
      <>
        {typeof item.metadata.stormName === "string" && <Fact name="Storm name" value={item.metadata.stormName} />}
        {typeof item.metadata.basin === "string" && <Fact name="Basin" value={item.metadata.basin} />}
        {item.advisoryNumber !== null && <Fact name="Advisory number" value={item.advisoryNumber} />}
        <Fact name="Advisory time" value={formatDate(item.occurredAt)} />
      </>
    );
  }
  return (
    <>
      <Fact name="Published" value={formatDate(item.occurredAt)} />
      <Fact name="Report category" value={label(item.category)} />
    </>
  );
}

function SourceStatus({ health }: { health: EventDetailSourceHealth | undefined }) {
  if (!health) return <span className="event-detail-source-status unavailable">Status unavailable</span>;
  return (
    <span className={`event-detail-source-status ${health.status}`}>
      {health.status}{health.stale ? " · stale" : ""}
    </span>
  );
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getEventDetail(id);
  if (result.status === "invalid" || result.status === "not_found") notFound();
  if (result.status === "unavailable") {
    return (
      <main className="event-detail-state">
        <p>ATLAS EVENT DETAIL</p>
        <h1>Event detail temporarily unavailable</h1>
        <span>Live sources could not be reached and no bounded cached record is available.</span>
        <div>
          <Link href="/app/timeline">Back to Global Timeline</Link>
          <Link href="/app/news">Open Event News Center</Link>
        </div>
      </main>
    );
  }

  const { item, sourceHealth, errors } = result.response;
  const itemHealth = sourceHealth.find((source) => source.sourceId === item.sourceId);
  const hasLocation = item.availableSections.includes("location");

  return (
    <main className="event-detail-page">
      <nav className="event-detail-back" aria-label="Back navigation">
        <Link href="/app/timeline">← Global Timeline</Link>
        <Link href="/app/news">Event News Center</Link>
      </nav>

      <header className="event-detail-header">
        <div className="event-detail-badges">
          <span>{label(item.category)}</span>
          <span>{label(item.canonicalType)}</span>
          <SourceStatus health={itemHealth} />
        </div>
        <h1>{item.title}</h1>
        <div className="event-detail-header-meta">
          <span>{item.sourceName}</span>
          <span>Status: {item.status}</span>
          <time dateTime={item.occurredAt}>Occurred {formatDate(item.occurredAt)}</time>
          <time dateTime={item.updatedAt}>Updated {formatDate(item.updatedAt)}</time>
          {item.stale && <strong>Stale cached detail</strong>}
        </div>
      </header>

      {result.response.partial && (
        <aside className="event-detail-partial" role="status">
          <strong>Partial source coverage</strong>
          <span>{errors.map((error) => `${error.sourceId ?? "Source"}: ${error.message}`).join(" · ")}</span>
        </aside>
      )}

      <div className="event-detail-grid">
        <div className="event-detail-main">
          <section className="event-detail-section">
            <h2>Overview</h2>
            <p className="event-detail-summary">{item.summary}</p>
            <dl className="event-detail-facts">
              <Fact name="Type" value={item.eventType ? label(item.eventType) : label(item.canonicalType)} />
              <Fact name="Verification" value={item.verificationStatus} />
              {item.severity && <Fact name="Severity" value={item.severity} />}
              {!hasLocation && <TypeFacts item={item} />}
            </dl>
          </section>

          {hasLocation && (
            <section className="event-detail-section">
              <h2>Location and source facts</h2>
              <dl className="event-detail-facts">
                {item.location && <Fact name="Location" value={item.location} />}
                {item.countries.length > 0 && <Fact name="Countries" value={item.countries.join(", ")} />}
                {item.coordinates && (
                  <Fact
                    name="Coordinates"
                    value={`${item.coordinates.latitude.toFixed(4)}, ${item.coordinates.longitude.toFixed(4)}`}
                  />
                )}
                <TypeFacts item={item} />
              </dl>
            </section>
          )}

          {item.coordinates && item.availableSections.includes("map") && (
            <section className="event-detail-section">
              <h2>Map</h2>
              <EventDetailMap
                latitude={item.coordinates.latitude}
                longitude={item.coordinates.longitude}
                title={item.title}
              />
            </section>
          )}

          {item.relatedReports.length > 0 && (
            <section className="event-detail-section">
              <h2>Exactly linked reports</h2>
              <div className="event-detail-related">
                {item.relatedReports.map((report) => (
                  <article key={report.id}>
                    <span>{report.sourceName}</span>
                    <time dateTime={report.publishedAt}>{formatDate(report.publishedAt)}</time>
                    <h3><Link href={canonicalPath(report.id)}>{report.title}</Link></h3>
                    {report.sourceUrl && <a href={report.sourceUrl} target="_blank" rel="noopener noreferrer">Read original ↗</a>}
                  </article>
                ))}
              </div>
            </section>
          )}

          {item.relatedTimelineItems.length > 0 && (
            <section className="event-detail-section">
              <h2>Related timeline</h2>
              <div className="event-detail-related">
                {item.relatedTimelineItems.map((timelineItem) => {
                  const reference = timelineItem.relatedEventId ?? timelineItem.relatedReportId;
                  return (
                    <article key={timelineItem.id}>
                      <span>{timelineItem.sourceName} · {timelineItem.itemType}</span>
                      <time dateTime={timelineItem.occurredAt}>{formatDate(timelineItem.occurredAt)}</time>
                      <h3>{reference
                        ? <Link href={canonicalPath(reference)}>{timelineItem.title}</Link>
                        : timelineItem.title}
                      </h3>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {Object.keys(item.metadata).length > 0 && (
            <section className="event-detail-section">
              <details className="event-detail-raw">
                <summary>Raw source metadata</summary>
                <dl>
                  {Object.entries(item.metadata).map(([key, value]) => (
                    <div key={key}>
                      <dt>{metadataLabel(key)}</dt>
                      <dd>{Array.isArray(value) ? value.join(", ") || "None supplied" : String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </section>
          )}
        </div>

        <aside className="event-detail-source">
          <h2>Source and provenance</h2>
          <dl>
            <Fact name="Provider" value={item.sourceName} />
            <Fact name="Original source" value={item.originalSource} />
            <Fact name="Attribution" value={item.attribution} />
            <Fact name="Source status" value={itemHealth ? `${itemHealth.status}${itemHealth.stale ? " · stale" : ""}` : "Unavailable"} />
            <Fact name="Ingested" value={formatDate(item.ingestedAt)} />
          </dl>
          <div className="event-detail-actions">
            {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Open official source ↗</a>}
            {itemHealth?.documentationUrl && <a href={itemHealth.documentationUrl} target="_blank" rel="noopener noreferrer">Provider documentation ↗</a>}
          </div>
          <div className="event-detail-provenance">
            <strong>Field provenance</strong>
            <p>{Object.keys(item.provenance).map(metadataLabel).join(", ")}</p>
            <span>All listed fields preserve values from {item.sourceName}.</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
