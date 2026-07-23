import type { ProviderFetchResult } from "./provider-contract";
export function withProviderCache(
  key: string,
  ttlMs: number,
  staleMs: number,
  loader: () => Promise<ProviderFetchResult>,
  now?: number,
): Promise<ProviderFetchResult>;
export function clearProviderCache(): void;
