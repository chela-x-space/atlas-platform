import type { MessageKey } from "./messages/en";

export const SEVERITY_DISPLAY_KEYS = {
  CRITICAL: "severity.critical",
  HIGH_IMPACT: "severity.highImpact",
  REGIONAL: "severity.regional",
  MONITORING: "severity.monitoring",
} as const satisfies Record<string, MessageKey>;

export const HEALTH_DISPLAY_KEYS = {
  UNKNOWN: "status.unknown",
  HEALTHY: "status.healthy",
  DEGRADED: "status.degraded",
  UNHEALTHY: "status.unhealthy",
  PAUSED: "status.paused",
  DISABLED: "status.disabled",
} as const satisfies Record<string, MessageKey>;

export const VERIFICATION_DISPLAY_KEYS = {
  VERIFIED: "status.verified",
  UNVERIFIED: "status.unverified",
  PENDING: "status.pending",
  FAILED: "status.failed",
  UNAVAILABLE: "status.unavailable",
} as const satisfies Record<string, MessageKey>;

export const CATEGORY_DISPLAY_KEYS = {
  EARTHQUAKE: "enum.earthquake",
  VOLCANO: "enum.volcano",
  WEATHER: "enum.weather",
  DISASTER: "enum.disaster",
  CONFLICT: "enum.conflict",
  ECONOMY: "enum.economy",
  MARKETS: "enum.markets",
  AI_TECHNOLOGY: "enum.aiTechnology",
  CYBERSECURITY: "enum.cybersecurity",
  AVIATION: "enum.aviation",
  MARINE: "enum.marine",
  SPACE: "enum.space",
  ENERGY: "enum.energy",
  HEALTH: "enum.health",
} as const satisfies Record<string, MessageKey>;

export function displayKeyFor(
  value: string,
  mapping: Readonly<Record<string, MessageKey>>,
): MessageKey | null {
  return mapping[value] ?? null;
}
