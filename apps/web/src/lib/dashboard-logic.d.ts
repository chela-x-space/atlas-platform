export const MENU_ROUTES: Readonly<Record<string, string>>;
export const EARTHQUAKE_FEEDS: Readonly<Record<"24h" | "7d" | "30d", string>>;
export const EARTHQUAKE_LAYER_IDS: readonly string[];
export function routeForMenu(label: string): string | null;
export function feedForRange(range: string): string;
export function earthquakeLayersVisible(activeLayer: string): boolean;
export function filterEvents<T extends readonly string[]>(events: readonly T[], query: string): T[];
export function marketRowsForTab<T>(datasets: Record<string, T[]>, tab: string): T[];
