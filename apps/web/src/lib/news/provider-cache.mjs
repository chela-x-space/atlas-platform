const cache = new Map();
const inFlight = new Map();
const MAXIMUM_PROVIDERS = 12;

export async function withProviderCache(key, ttlMs, staleMs, loader, now = Date.now()) {
  const existing = cache.get(key);
  if (existing && existing.expiresAt > now) return existing.value;
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = loader()
    .then((value) => {
      if (cache.size >= MAXIMUM_PROVIDERS && !cache.has(key)) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
      }
      cache.set(key, { value, expiresAt: now + ttlMs, staleUntil: now + ttlMs + staleMs });
      return value;
    })
    .catch((error) => {
      if (existing && existing.staleUntil > now) {
        return {
          reports: existing.value.reports,
          health: {
            ...existing.value.health,
            status: "degraded",
            stale: true,
            lastCheckedAt: new Date(now).toISOString(),
            errorCode: "STALE_CACHE",
            errorMessage: error instanceof Error ? error.message : "Provider refresh failed",
          },
        };
      }
      throw error;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}

export function clearProviderCache() {
  cache.clear();
  inFlight.clear();
}
