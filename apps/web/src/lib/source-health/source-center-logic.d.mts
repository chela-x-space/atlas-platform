import type {
  SourceOperationsProvider,
  SourceOperationsStatus,
} from "./source-operations";

export function filterSourceProviders(
  providers: readonly SourceOperationsProvider[],
  query: string,
  status: "all" | SourceOperationsStatus,
): SourceOperationsProvider[];

export function sourceProviderStatistics(
  providers: readonly SourceOperationsProvider[],
): {
  online: number;
  offline: number;
  configurationRequired: number;
  totalReports: number;
};

