import type { AtlasNewsItem } from "@/types/atlas-data";

export type AtlasNewsEventGroup = {
  id: string;
  title: string;
  category: string;
  latestAt: string;
  articles: AtlasNewsItem[];
  sourceCount: number;
  confidence?: "exact" | "strong" | "probable" | "standalone";
  groupingReason?: string;
};

export function groupNewsByEvent(items: readonly AtlasNewsItem[]): AtlasNewsEventGroup[];
export function filterNewsGroups(
  groups: readonly AtlasNewsEventGroup[],
  query: string,
  category: string,
): AtlasNewsEventGroup[];
export function canUseAiSummary(
  group: AtlasNewsEventGroup,
  trustedSourceIds: readonly string[],
): boolean;
