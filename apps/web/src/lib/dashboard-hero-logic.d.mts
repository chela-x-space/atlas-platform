import type { AtlasEvent } from "../types/atlas-data";

export const BREAKING_WINDOW_MS: number;
export function selectDashboardHeroEvent(events: readonly AtlasEvent[]): AtlasEvent | null;
export function isBreakingHeroEvent(event: AtlasEvent | null, snapshotGeneratedAt: string): boolean;
