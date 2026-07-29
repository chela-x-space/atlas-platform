import { rankDashboardEvents } from "./dashboard-logic.mjs";

export const BREAKING_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Presentation-only hero order:
 * critical, high, moderate, low, info, unknown; then the existing dashboard
 * confirmation rank, observed recency, and stable event ID tie-breaker.
 * This reuses the dashboard's deterministic ranking and never mutates an event.
 */
export function selectDashboardHeroEvent(events) {
  return rankDashboardEvents(events)[0] ?? null;
}

/**
 * “Breaking” is limited to critical/high events observed in the 24 hours before
 * the real dashboard snapshot time. Future or invalid timestamps are ineligible.
 */
export function isBreakingHeroEvent(event, snapshotGeneratedAt) {
  if (!event || !["critical", "high"].includes(event.severity)) return false;
  const observedAt = Date.parse(event.occurredAt);
  const snapshotAt = Date.parse(snapshotGeneratedAt);
  if (!Number.isFinite(observedAt) || !Number.isFinite(snapshotAt)) return false;
  const age = snapshotAt - observedAt;
  return age >= 0 && age <= BREAKING_WINDOW_MS;
}
