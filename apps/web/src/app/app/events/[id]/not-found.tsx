import Link from "next/link";

export default function EventDetailNotFound() {
  return (
    <main className="event-detail-state">
      <p>ATLAS EVENT DETAIL</p>
      <h1>Event not found</h1>
      <span>The requested exact event or verified report ID is not available. No substitute record was selected.</span>
      <div>
        <Link href="/app/timeline">Back to Global Timeline</Link>
        <Link href="/app/news">Open Event News Center</Link>
      </div>
    </main>
  );
}
